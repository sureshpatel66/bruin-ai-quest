import json
import os
from pathlib import Path

os.environ['BRUIN_BACKEND'] = 'rules'

from bruin_ai_quest.sim import BruinQuest
from bruin_ai_quest.journeys import JOURNEYS

ROOT = Path(__file__).resolve().parents[1]


def test_every_journey_template_references_known_resources():
    game = BruinQuest()
    ids = {r['id'] for r in game.resources}
    assert set(JOURNEYS['templates']) == {
        'ai_agent_builder','single_cell_research','coding_project','gpu_compute',
        'literature_review','model_api_exploration','cloud_learning','general_ai'
    }
    for journey_id, template in JOURNEYS['templates'].items():
        assert template['steps'], journey_id
        for step in template['steps']:
            assert step['resource_id'] in ids, (journey_id, step['resource_id'])
            assert set(step.get('alternatives', [])) <= ids


def test_agent_gpu_goal_builds_cross_world_ordered_journey():
    game = BruinQuest()
    out = game.plan_journey('I am a UCLA student and want to learn AI, build an agent, and run it on a GPU')
    journey = out['journey']
    assert journey['journey_type'] == 'ai_agent_builder'
    ids = [s['resource_id'] for s in journey['steps']]
    assert ids[:4] == [
        'qcbio_ai_agents','online_github_student_pack','online_github_codespaces','online_hugging_face'
    ]
    assert 'bruincloud' in ids
    assert 'online_openrouter' in ids
    assert [s['position'] for s in journey['steps']] == list(range(1, len(ids)+1))
    assert journey['transitions']
    assert journey['planner'] == 'deterministic-template-v1'


def test_single_cell_journey_is_research_specific():
    game = BruinQuest()
    journey = game.plan_journey('I want a reproducible single-cell RNA-seq analysis workflow')['journey']
    assert journey['journey_type'] == 'single_cell_research'
    ids = [s['resource_id'] for s in journey['steps']]
    assert ids[0] == 'qcbio_scrna'
    assert 'bruincloud' in ids
    assert 'gemini_notebook' in ids


def test_model_api_journey_has_direct_provider_benchmarks():
    game = BruinQuest()
    journey = game.plan_journey('I want to compare OpenRouter, Groq, OpenAI API and Claude API')['journey']
    assert journey['journey_type'] == 'model_api_exploration'
    ids = [s['resource_id'] for s in journey['steps']]
    for rid in ('online_openrouter','online_groq','online_openai_api','online_anthropic_api','online_gemini_api'):
        assert rid in ids


def test_journey_steps_expose_action_status_and_official_source():
    journey = BruinQuest().plan_journey('I want to learn cloud platforms as a student')['journey']
    for step in journey['steps']:
        assert step['purpose']
        assert step['action']
        assert step['status']
        assert step['official_url'].startswith('https://')
