const RX = /^([A-Z])->([A-Z])$/;

function processBfhl(data) {
  if (!Array.isArray(data)) return { error: "data must be an array" };

  const invalid_entries = [], duplicate_edges = [], edges = [];
  const seen = new Set();

  for (const raw of data) {
    if (typeof raw !== "string") { invalid_entries.push(raw); continue; }
    const m = raw.trim().match(RX);
    if (!m || m[1] === m[2]) { invalid_entries.push(raw); continue; }
    const k = `${m[1]}->${m[2]}`;
    if (seen.has(k)) { if (!duplicate_edges.includes(k)) duplicate_edges.push(k); continue; }
    seen.add(k);
    edges.push([m[1], m[2]]);
  }

  const parentOf = new Map(), childrenOf = new Map(), nodes = new Set(), accepted = [];
  for (const [p, c] of edges) {
    nodes.add(p); nodes.add(c);
    if (parentOf.has(c)) continue;
    parentOf.set(c, p);
    if (!childrenOf.has(p)) childrenOf.set(p, []);
    childrenOf.get(p).push(c);
    accepted.push([p, c]);
  }

  const uf = new Map();
  const find = x => uf.get(x) === x ? x : (uf.set(x, find(uf.get(x))), uf.get(x));
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) uf.set(ra, rb); };
  for (const n of nodes) uf.set(n, n);
  for (const [p, c] of accepted) union(p, c);

  const groups = new Map();
  for (const n of nodes) {
    const r = find(n);
    if (!groups.has(r)) groups.set(r, new Set());
    groups.get(r).add(n);
  }

  const hierarchies = [];
  let total_trees = 0, total_cycles = 0, largest = null;

  for (const g of groups.values()) {
    const arr = [...g];
    const roots = arr.filter(n => !parentOf.has(n));

    if (roots.length === 0) {
      hierarchies.push({ root: arr.sort()[0], tree: {}, has_cycle: true });
      total_cycles++; continue;
    }

    const root = roots.sort()[0];
    const visited = new Set();
    let cyc = false;
    const dfs = (n, stk) => {
      if (stk.has(n)) { cyc = true; return; }
      if (visited.has(n)) return;
      visited.add(n); stk.add(n);
      for (const k of childrenOf.get(n) || []) dfs(k, stk);
      stk.delete(n);
    };
    dfs(root, new Set());

    if (cyc || visited.size !== g.size) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
      total_cycles++; continue;
    }

    const build = n => Object.fromEntries((childrenOf.get(n) || []).map(k => [k, build(k)]));
    const depthOf = n => {
      const ks = childrenOf.get(n) || [];
      return ks.length ? 1 + Math.max(...ks.map(depthOf)) : 1;
    };
    const depth = depthOf(root);
    hierarchies.push({ root, tree: { [root]: build(root) }, depth });
    total_trees++;
    if (!largest || depth > largest.depth || (depth === largest.depth && root < largest.root)) {
      largest = { root, depth };
    }
  }

  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  return {
    hierarchies, invalid_entries, duplicate_edges,
    summary: { total_trees, total_cycles, largest_tree_root: largest?.root || "" }
  };
}

module.exports = { processBfhl };