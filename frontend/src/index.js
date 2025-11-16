import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [items, setItems] = React.useState([]);
  const [name, setName] = React.useState("");
  const base = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

  React.useEffect(() => {
    fetch(`${base}/items`).then(r => r.json()).then(setItems);
  }, [base]);

  const add = async () => {
    const r = await fetch(`${base}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const it = await r.json();
    setItems([it, ...items]);
    setName("");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Items</h1>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={add}>Add</button>
      <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
