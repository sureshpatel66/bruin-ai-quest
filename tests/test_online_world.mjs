import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { onlineShortestPath, buildShopLayout, buildVisualRoute, DISTRICTS } from '../web/online-world.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../resources/online_ai_resources.json', import.meta.url)));
const resources = catalog.resources;

const graph = new Map([['portal', new Set(resources.map(r => r.id))]]);
for (const r of resources) graph.set(r.id, new Set((r.properties?.next_steps || []).filter(id => resources.some(x => x.id === id))));
for (const [from,tos] of [...graph]) for (const to of tos) {if (!graph.has(to)) graph.set(to,new Set());graph.get(to).add(from);}

test('all online resources have a district, source, and safe next-step IDs', () => {
  const ids = new Set(resources.map(r => r.id));
  assert.equal(resources.length, 18);
  for (const r of resources) {
    assert.ok(DISTRICTS[r.district], `${r.id} district must exist`);
    assert.ok(r.official_url.startsWith('https://'));
    assert.equal(r.last_verified, '2026-09-27');
    for (const id of r.properties?.next_steps || []) assert.ok(ids.has(id), `${r.id} has unknown next step ${id}`);
  }
});

test('shop layout gives every resource a unique clickable room', () => {
  const layout = buildShopLayout(resources);
  assert.equal(layout.size, resources.length);
  const centers = new Set();
  for (const r of resources) {
    const shop = layout.get(r.id); assert.ok(shop);
    const [x,y,w,h] = shop.rect; assert.ok(w > 25 && h > 20);
    const key = `${Math.round(x+w/2)},${Math.round(y+h/2)}`; assert.ok(!centers.has(key)); centers.add(key);
  }
});

test('relevance paths are deterministic and visually expanded onto district roads', () => {
  const logical = onlineShortestPath(graph, 'online_openrouter', 'online_modal_cloud');
  assert.equal(logical[0], 'online_openrouter'); assert.equal(logical.at(-1), 'online_modal_cloud');
  const visual = buildVisualRoute(logical, buildShopLayout(resources), resources);
  assert.ok(visual.length >= logical.length);
  assert.deepEqual(buildVisualRoute(logical, buildShopLayout(resources), resources), visual);
});

test('portal can reach every shop', () => {
  for (const r of resources) {
    const path = onlineShortestPath(graph, 'portal', r.id);
    assert.equal(path[0], 'portal'); assert.equal(path.at(-1), r.id);
  }
});
