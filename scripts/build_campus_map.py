"""Build the offline pixel-map geometry from four public OSM extracts.

Usage: python scripts/build_campus_map.py /tmp/bruin-campus-{0,1,2,3}.osm
Coordinates are projected north-up; source node IDs preserve pedestrian topology.
The raw extracts stay outside the repo. Only map geometry and public names ship.
"""
import argparse
import datetime
import hashlib
import json
import math
from pathlib import Path
from defusedxml import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BBOX = [-118.459, 34.0635, -118.436, 34.08]
WIDTH = 1400
HEIGHT = round(WIDTH * (BBOX[3] - BBOX[1]) / ((BBOX[2] - BBOX[0]) * math.cos(math.radians(34.07))))
VENUES = {'boyer': ('422876525', 'Boyer Hall'), 'engineering_v': ('422876660', 'Engineering V'), 'james_west': ('422876655', 'James West Alumni Center')}
LANDMARKS = {'Royce Hall', 'Powell Library', 'Hedrick Hall', 'Charles E. Young Research Library', 'Edwin W. Pauley Pavilion', 'Ackerman Union', 'Kerckhoff Hall', 'Drake Stadium', 'Ronald Reagan UCLA Medical Center', 'Sculpture Garden'}


def project(lon, lat):
    return [round((lon - BBOX[0]) / (BBOX[2] - BBOX[0]) * WIDTH, 1), round((BBOX[3] - lat) / (BBOX[3] - BBOX[1]) * HEIGHT, 1)]


def build(paths):
    nodes, ways = {}, {}
    for path in paths:
        root = ET.parse(path).getroot()
        for n in root.findall('node'):
            nodes[n.attrib['id']] = (float(n.attrib['lon']), float(n.attrib['lat']))
        for w in root.findall('way'):
            ways[w.attrib['id']] = w
    inside = {k for k, (lon, lat) in nodes.items() if BBOX[0] <= lon <= BBOX[2] and BBOX[1] <= lat <= BBOX[3]}
    features, graph_nodes, edges, landmarks, venues = [], {}, [], [], []
    walk_types = {'footway', 'pedestrian', 'path', 'steps', 'residential', 'service', 'living_street', 'tertiary', 'secondary', 'primary', 'unclassified'}
    for wid, way in sorted(ways.items()):
        tags = {t.attrib['k']: t.attrib['v'] for t in way.findall('tag')}
        refs = [n.attrib['ref'] for n in way.findall('nd') if n.attrib['ref'] in nodes]
        if len(refs) < 2 or not any(r in inside for r in refs):
            continue
        points = [project(*nodes[r]) for r in refs]
        name = tags.get('name', '')
        kind = 'building' if 'building' in tags else 'road' if 'highway' in tags else 'green' if tags.get('leisure') in {'park', 'pitch', 'garden', 'stadium', 'recreation_ground'} else None
        if not kind:
            continue
        center = [round(sum(p[i] for p in points[:-1] or points) / len(points[:-1] or points), 1) for i in [0, 1]]
        if kind == 'building' and not (0 <= center[0] <= WIDTH and 0 <= center[1] <= HEIGHT):
            continue
        features.append({'id': wid, 'kind': kind, 'name': name, 'type': tags.get('highway', tags.get('leisure', '')), 'points': points})
        if name in LANDMARKS:
            landmarks.append({'name': name, 'point': center})
        for key, (osm_id, title) in VENUES.items():
            if wid == osm_id:
                venues.append({'id': key, 'name': title, 'point': center, 'osm_way': wid, 'coordinates': [round(sum(nodes[r][i] for r in refs[:-1]) / len(refs[:-1]), 7) for i in [0, 1]]})
        if tags.get('highway') in walk_types and tags.get('access') not in {'private', 'no'} and tags.get('foot') not in {'no', 'private'} and tags.get('area') != 'yes':
            for a, b in zip(refs, refs[1:]):
                if a in inside and b in inside and a != b:
                    graph_nodes[a] = project(*nodes[a]); graph_nodes[b] = project(*nodes[b])
                    edges.append([a, b])
    if len(venues) != 3:
        raise ValueError('Missing a verified venue building')
    data = {'width': WIDTH, 'height': HEIGHT, 'bbox': BBOX, 'retrieved': str(datetime.date.today()), 'attribution': '© OpenStreetMap contributors · ODbL 1.0', 'license_url': 'https://www.openstreetmap.org/copyright', 'official_map_url': 'https://map.ucla.edu/', 'source_url': 'https://www.openstreetmap.org/api/0.6/map', 'extract_sha256': [hashlib.sha256(p.read_bytes()).hexdigest() for p in paths], 'features': features, 'venues': venues, 'landmarks': landmarks, 'start': project(*nodes['566579946']), 'graph': {'nodes': graph_nodes, 'edges': edges}}
    dest = ROOT / 'web/assets/campus-map.json'
    dest.write_text(json.dumps(data, separators=(',', ':')) + '\n')
    print(f'{len(features)} map features, {len(graph_nodes)} walking nodes, {len(edges)} edges; {dest.stat().st_size:,} bytes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('extracts', nargs='+', type=Path)
    build(parser.parse_args().extracts)
