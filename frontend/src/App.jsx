import { useState } from "react";
import "./App.css";

const API_URL = "https://bfhl-api-bc7x.onrender.com/bfhl";

export default function App() {
  const [input, setInput] = useState('["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setResponse(null); setLoading(true);
    let data;
    try {
      data = JSON.parse(input);
      if (!Array.isArray(data)) throw new Error();
    } catch {
      setError("Input must be a valid JSON array of strings, e.g. [\"A->B\", \"B->C\"]");
      setLoading(false); return;
    }
    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      const j = await r.json();
      setResponse(j);
    } catch (e) {
      setError(`Request failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderTree = (obj, depth = 0) => {
    const entries = Object.entries(obj);
    if (!entries.length) return null;
    return (
      <ul className="tree">
        {entries.map(([k, v]) => (
          <li key={k} style={{ "--d": depth }}>
            <span className="node">{k}</span>
            {renderTree(v, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="app">
      <header>
        <h1>BFHL Hierarchy Builder</h1>
        <p className="sub">Paste a JSON array of edges → get the parsed hierarchy.</p>
      </header>

      <section className="card">
        <label>Input</label>
        <textarea
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='["A->B", "B->C"]'
        />
        <div className="row">
          <button onClick={submit} disabled={loading}>
            {loading ? "Processing…" : "Submit"}
          </button>
          <span className="hint">Valid format: uppercase letter → uppercase letter, e.g. <code>A-&gt;B</code></span>
        </div>
        {error && <div className="error">{error}</div>}
      </section>

      {response && (
        <section className="card">
          <div className="meta">
            <div><span>user_id</span><b>{response.user_id}</b></div>
            <div><span>email</span><b>{response.email_id}</b></div>
            <div><span>roll</span><b>{response.college_roll_number}</b></div>
          </div>

          <div className="summary">
            <div className="pill">Trees: <b>{response.summary.total_trees}</b></div>
            <div className="pill">Cycles: <b>{response.summary.total_cycles}</b></div>
            <div className="pill">Largest root: <b>{response.summary.largest_tree_root || "—"}</b></div>
          </div>

          <h3>Hierarchies</h3>
          <div className="grid">
            {response.hierarchies.map((h, i) => (
              <div key={i} className={`hcard ${h.has_cycle ? "cyc" : ""}`}>
                <div className="hhead">
                  <span className="root">Root: {h.root}</span>
                  {h.has_cycle ? <span className="badge cyc">cycle</span>
                               : <span className="badge">depth {h.depth}</span>}
                </div>
                {h.has_cycle
                  ? <div className="cycMsg">Cyclic group — no tree structure</div>
                  : renderTree(h.tree)}
              </div>
            ))}
          </div>

          <details>
            <summary>Raw JSON response</summary>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </details>

          {response.invalid_entries?.length > 0 && (
            <div className="lists">
              <h4>Invalid entries</h4>
              <div className="chips">{response.invalid_entries.map((x, i) => <span key={i} className="chip red">{String(x) || "(empty)"}</span>)}</div>
            </div>
          )}
          {response.duplicate_edges?.length > 0 && (
            <div className="lists">
              <h4>Duplicate edges</h4>
              <div className="chips">{response.duplicate_edges.map((x, i) => <span key={i} className="chip amber">{x}</span>)}</div>
            </div>
          )}
        </section>
      )}

      <footer>Shubh Agarwal · RA2311003010328</footer>
    </div>
  );
}