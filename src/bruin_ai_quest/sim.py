from __future__ import annotations
import json
from pathlib import Path
from .decision import decide
from .journeys import build_journey

ROOT=Path(__file__).resolve().parents[2]
UCLA_CATALOG=json.loads((ROOT/'resources/ucla_ai_resources.json').read_text())
ONLINE_CATALOG=json.loads((ROOT/'resources/online_ai_resources.json').read_text())

class BruinQuest:
    def __init__(self):
        self.tick=0
        self.student={'id':'student','name':'Bruin','role':'UCLA student / researcher','zone':'plaza','status':'exploring','sprite':'founder'}
        self.goal='Find the best UCLA AI resource for my task'
        self.profile={'affiliation':'UCLA','role':'student_or_researcher','field':'unspecified','budget':'unspecified'}
        self.selected=None
        self.decision=None
        self.events=[]
        self.journey=None

    @property
    def ucla_resources(self): return UCLA_CATALOG['resources']

    @property
    def online_resources(self): return ONLINE_CATALOG['resources']

    @property
    def resources(self): return self.ucla_resources + self.online_resources

    def snapshot(self):
        return {
            'tick':self.tick,'student':self.student,'goal':self.goal,'profile':self.profile,
            'selected':self.selected,'pathway':getattr(self,'pathway',[]),'journey':self.journey,'decision':self.decision,
            'resources':self.resources,'ucla_resources':self.ucla_resources,'online_resources':self.online_resources,
            'events':self.events[-15:],'last_verified':{
                'ucla': UCLA_CATALOG['last_verified'], 'online': ONLINE_CATALOG['last_verified']},
            'disclaimer':{'ucla': UCLA_CATALOG['disclaimer'], 'online': ONLINE_CATALOG['disclaimer']}}

    def route(self, goal: str, profile: dict|None=None):
        self.tick+=1
        self.goal=goal.strip() or self.goal
        if profile: self.profile.update(profile)
        d=decide(self.goal,self.profile,self.resources)
        r=next((x for x in self.resources if x['id']==d['resource_id']),self.resources[0])
        self.selected=r
        ranked=sorted(d.get('probabilities',{}).items(), key=lambda kv: kv[1], reverse=True)
        by_id={x['id']:x for x in self.resources}
        self.pathway=[by_id[rid] | {'route_probability': prob} for rid,prob in ranked[:3] if rid in by_id]
        self.decision=d
        self.student['zone']=r['zone']; self.student['world']=r.get('world','ucla'); self.student['status']='walking_to_resource'
        event={'tick':self.tick,'goal':self.goal,'resource_id':r['id'],'resource_name':r['name'],'zone':r['zone'],'world':r.get('world','ucla'),'decision':d}
        self.events.append(event)
        return {'state':self.snapshot(),'event':event}

    def plan_journey(self, goal: str, profile: dict|None=None):
        self.tick += 1
        self.goal = goal.strip() or self.goal
        if profile:
            self.profile.update(profile)
        d = decide(self.goal, self.profile, self.resources)
        journey = build_journey(self.goal, self.profile, self.resources, d)
        self.journey = journey
        self.decision = d
        first = journey['steps'][0] if journey['steps'] else None
        if first:
            r = next((x for x in self.resources if x['id'] == first['resource_id']), None)
            self.selected = r
            if r:
                self.student['zone'] = r['zone']
                self.student['world'] = r.get('world', 'ucla')
                self.student['status'] = 'journey_ready'
        event = {
            'tick': self.tick, 'goal': self.goal, 'kind': 'journey',
            'journey_type': journey['journey_type'], 'step_count': journey['step_count'],
            'first_resource_id': first['resource_id'] if first else None,
            'decision': d,
        }
        self.events.append(event)
        return {'state': self.snapshot(), 'journey': journey, 'event': event}
