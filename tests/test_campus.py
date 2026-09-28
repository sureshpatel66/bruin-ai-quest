import json
from pathlib import Path
from fastapi.testclient import TestClient
from bruin_ai_quest import sim
from bruin_ai_quest.api import app as local_app
from api.index import app as production_app
import api.index as production_api

ROOT = Path(__file__).resolve().parents[1]


def test_every_resource_has_a_supported_location():
    catalog = json.loads((ROOT / 'resources/ucla_ai_resources.json').read_text())
    geography = json.loads((ROOT / 'web/assets/campus-map.json').read_text())
    venues = {v['id'] for v in geography['venues']}
    counts = {'online': 0, 'physical': 0, 'multiple': 0}
    for resource in catalog['resources']:
        location = resource['location']
        counts[location['kind']] += 1
        assert location['source_url'].startswith('https://')
        assert location['last_verified']
        assert set(location['venue_ids']) <= venues
        if location['kind'] == 'online':
            assert location['venue_ids'] == []
        else:
            assert location['venue_ids']
    assert counts == {'online': 11, 'physical': 5, 'multiple': 1}


def test_online_catalog_is_a_separate_evidence_bounded_world():
    catalog = json.loads((ROOT / 'resources/online_ai_resources.json').read_text())
    assert len(catalog['resources']) >= 8
    for resource in catalog['resources']:
        assert resource['world'] == 'online'
        assert resource['location']['kind'] == 'online_world'
        assert resource['official_url'].startswith('https://')
        assert resource['properties']['data_boundary']
        assert resource['properties']['next_steps']
    by_id = {r['id'] for r in catalog['resources']}
    assert all(set(r['properties']['next_steps']) <= by_id for r in catalog['resources'])


def test_public_api_rejects_profile_and_legacy_routes(monkeypatch):
    monkeypatch.setenv('BRUIN_BACKEND', 'rules')
    for app in (local_app, production_app):
        client = TestClient(app)
        rejected = client.post('/api/journey', json={'goal': 'GPU compute', 'profile': {'role': 'synthetic-client-A'}})
        assert rejected.status_code == 422
        assert client.post('/api/route', json={'goal': 'GPU compute'}).status_code == 404
        assert client.get('/api/state').status_code == 404


def test_both_entry_points_serve_offline_map_assets():
    for app, prefix in ((local_app, '/static'), (production_app, '/api/static')):
        client = TestClient(app)
        for asset in ('app.mjs', 'campus-map.mjs', 'online-world.mjs', 'navigation.mjs', 'campus.css', 'assets/campus-map.json'):
            assert client.get(prefix + '/' + asset).status_code == 200


def test_both_entry_points_build_stateless_journeys(monkeypatch):
    monkeypatch.setenv('BRUIN_BACKEND', 'rules')
    goal = 'I am a UCLA student and want to learn AI, build an agent, and run it on a GPU'
    for app in (local_app, production_app):
        client = TestClient(app)
        response = client.post('/api/journey', json={'goal': goal})
        assert response.status_code == 200
        data = response.json()
        assert data['journey']['journey_type'] == 'ai_agent_builder'
        assert data['journey']['steps'][0]['resource_id'] == 'qcbio_ai_agents'
        assert data['state']['events'][-1]['kind'] == 'journey'
        # A second request starts from a fresh per-request simulation state.
        second = client.post('/api/journey', json={'goal': 'I want help reading research papers'})
        assert second.status_code == 200
        assert second.json()['state']['tick'] == 1
        assert second.json()['state']['goal'] == 'I want help reading research papers'


def test_goal_length_is_bounded_at_api_schema():
    for app in (local_app, production_app):
        response = TestClient(app).post('/api/journey', json={'goal': 'x' * 2001})
        assert response.status_code == 422


def test_production_docs_are_not_public():
    client = TestClient(production_app)
    assert client.get('/docs').status_code == 404
    assert client.get('/redoc').status_code == 404
    assert client.get('/openapi.json').status_code == 404


def test_production_rate_limit_is_enforced(monkeypatch):
    monkeypatch.setenv('BRUIN_BACKEND', 'rules')
    production_api._client_hits.clear()
    production_api._global_hits.clear()
    client = TestClient(production_app)
    headers = {'x-forwarded-for': '203.0.113.77'}
    for _ in range(production_api._PER_CLIENT_LIMIT):
        assert client.post('/api/journey', json={'goal': 'general AI'}, headers=headers).status_code == 200
    blocked = client.post('/api/journey', json={'goal': 'general AI'}, headers=headers)
    assert blocked.status_code == 429
    assert blocked.headers['cache-control'] == 'no-store'
    assert 'retry-after' in blocked.headers
    production_api._client_hits.clear()
    production_api._global_hits.clear()


def test_security_txt_is_available_without_personal_contact_data():
    response = TestClient(production_app).get('/api/security.txt')
    assert response.status_code == 200
    assert 'security/advisories/new' in response.text
    assert '@gmail.com' not in response.text
