// Keep routing deterministic and independent from resource selection/Jev.
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function buildGraph(data) {
  const adjacency = new Map(Object.keys(data.nodes).map(id => [id, []]));
  for (const [a, b] of data.edges) {
    if (!adjacency.has(a) || !adjacency.has(b)) continue;
    adjacency.get(a).push(b); adjacency.get(b).push(a);
  }
  // Snap to the largest connected network, avoiding isolated indoor fragments.
  let largest = []; const visited = new Set();
  for (const id of adjacency.keys()) {
    if (visited.has(id)) continue;
    const stack = [id], component = []; visited.add(id);
    while (stack.length) {
      const current = stack.pop(); component.push(current);
      for (const next of adjacency.get(current)) if (!visited.has(next)) { visited.add(next); stack.push(next); }
    }
    if (component.length > largest.length) largest = component;
  }
  return {nodes: data.nodes, adjacency, connected: largest};
}
export function nearestNode(point, graph) {
  let best = null, d = Infinity;
  for (const id of graph.connected) {
    const candidate = distance(point, graph.nodes[id]);
    if (candidate < d) {d = candidate; best = id;}
  }
  return best;
}
export function astar(graph, start, goal) {
  if (!graph.adjacency.has(start) || !graph.adjacency.has(goal)) return [];
  const open = new Set([start]), came = new Map(), g = new Map([[start, 0]]);
  const f = new Map([[start, distance(graph.nodes[start], graph.nodes[goal])]]);
  while (open.size) {
    let current = null, score = Infinity;
    for (const id of open) if (f.get(id) < score) {current = id; score = f.get(id);}
    if (current === goal) {
      const path = [current];
      while (came.has(current)) { current = came.get(current); path.push(current); }
      return path.reverse();
    }
    open.delete(current);
    for (const next of graph.adjacency.get(current)) {
      const cost = g.get(current) + distance(graph.nodes[current], graph.nodes[next]);
      if (cost < (g.get(next) ?? Infinity)) {
        came.set(next, current); g.set(next, cost);
        f.set(next, cost + distance(graph.nodes[next], graph.nodes[goal])); open.add(next);
      }
    }
  }
  return [];
}
