import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {buildGraph, nearestNode, astar, distance} from '../web/navigation.mjs';

const data = JSON.parse(fs.readFileSync(new URL('../web/assets/campus-map.json', import.meta.url)));
const graph = buildGraph(data.graph);

test('Every verified venue is reachable from Bruin Plaza on real graph edges', () => {
  const start = nearestNode(data.start, graph);
  for (const venue of data.venues) {
    const end = nearestNode(venue.point, graph), path = astar(graph, start, end);
    assert.equal(path[0], start); assert.equal(path.at(-1), end);
    assert.ok(distance(venue.point, graph.nodes[end]) < 50, venue.name + ' must snap near its building');
    for (let i = 1; i < path.length; i++) assert.ok(graph.adjacency.get(path[i-1]).includes(path[i]));
  }
});

test('Every pair of venue destinations is connected', () => {
  for (const a of data.venues) for (const b of data.venues) {
    const start = nearestNode(a.point, graph), end = nearestNode(b.point, graph);
    assert.ok(astar(graph, start, end).length > 0);
  }
});

test('Unknown or disconnected endpoints produce no invented path', () => {
  const isolated = buildGraph({nodes: {a:[0,0], b:[10,10], c:[1,0]}, edges:[['a','c']]});
  assert.deepEqual(astar(isolated, 'a', 'b'), []);
  assert.deepEqual(astar(isolated, 'a', 'missing'), []);
});
