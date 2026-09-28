from __future__ import annotations
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
JOURNEYS = json.loads((ROOT / 'resources/journey_templates.json').read_text())


def _resource_index(resources: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {r['id']: r for r in resources}


def build_journey(goal: str, profile: dict[str, Any], resources: list[dict[str, Any]], decision: dict[str, Any]) -> dict[str, Any]:
    """Expand a fuzzy journey classification into deterministic, auditable steps."""
    journey_type = decision.get('journey_type') or 'general_ai'
    template = JOURNEYS['templates'].get(journey_type) or JOURNEYS['templates']['general_ai']
    by_id = _resource_index(resources)
    steps = []
    for position, spec in enumerate(template['steps'], start=1):
        resource = by_id.get(spec['resource_id'])
        if not resource:
            continue
        alternatives = [by_id[rid] for rid in spec.get('alternatives', []) if rid in by_id]
        steps.append({
            'position': position,
            'resource_id': resource['id'],
            'name': resource['name'],
            'world': resource.get('world', 'ucla'),
            'zone': resource['zone'],
            'status': resource['status'],
            'purpose': spec['purpose'],
            'action': spec['action'],
            'optional': bool(spec.get('optional', False)),
            'official_url': resource['official_url'],
            'location': resource.get('location', {}),
            'alternatives': [
                {
                    'resource_id': alt['id'],
                    'name': alt['name'],
                    'world': alt.get('world', 'ucla'),
                    'status': alt['status'],
                    'official_url': alt['official_url'],
                }
                for alt in alternatives
            ],
        })

    # If Jev's best single resource is not already represented, insert it as an optional
    # "recommended detour" after the first learning/setup step rather than silently discarding it.
    anchor_id = decision.get('resource_id')
    if anchor_id in by_id and anchor_id not in {s['resource_id'] for s in steps}:
        anchor = by_id[anchor_id]
        detour = {
            'position': 0,
            'resource_id': anchor['id'],
            'name': anchor['name'],
            'world': anchor.get('world', 'ucla'),
            'zone': anchor['zone'],
            'status': anchor['status'],
            'purpose': 'Jev selected this as the strongest immediate match for the stated goal.',
            'action': 'Review this recommendation as an optional detour; keep the ordered journey milestones intact.',
            'optional': True,
            'official_url': anchor['official_url'],
            'location': anchor.get('location', {}),
            'alternatives': [],
            'source': 'jev_anchor',
        }
        insert_at = min(1, len(steps))
        steps.insert(insert_at, detour)

    for i, step in enumerate(steps, start=1):
        step['position'] = i

    transitions = []
    for prev, curr in zip(steps, steps[1:]):
        if prev['world'] != curr['world']:
            transitions.append({
                'after_step': prev['position'],
                'from_world': prev['world'],
                'to_world': curr['world'],
                'label': 'Campus ↔ Online portal transition',
            })

    return {
        'journey_type': journey_type,
        'title': template['title'],
        'summary': template['summary'],
        'goal': goal,
        'step_count': len(steps),
        'steps': steps,
        'transitions': transitions,
        'planner': 'deterministic-template-v1',
        'classifier_backend': decision.get('backend'),
        'classifier_model': decision.get('model'),
    }
