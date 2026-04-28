import { useState, useEffect } from "react";

const API = "http://localhost:4000";

function api(path, options = {}) {
  const token = localStorage.getItem("token");
  return fetch(API + path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  }).then(r => r.json());
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    const data = await api(`/${mode}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.error) return setError(data.error);
    localStorage.setItem("token", data.token);
    onLogin(data.user);
  }

  return (
    <div style={s.center}>
      <div style={s.card}>
        <h1 style={s.title}>📝 Todo App</h1>
        <div style={s.tabs}>
          <button style={mode === "login" ? s.activeTab : s.tab} onClick={() => setMode("login")}>Login</button>
          <button style={mode === "register" ? s.activeTab : s.tab} onClick={() => setMode("register")}>Register</button>
        </div>
        <form onSubmit={submit}>
          <input style={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
        </form>
      </div>
    </div>
  );
}

function TaskApp({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    api("/tasks").then(data => { if (Array.isArray(data)) setTasks(data); });
  }, []);

  async function addTask(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const task = await api("/tasks", { method: "POST", body: JSON.stringify({ text }) });
    setTasks(prev => [...prev, task]);
    setText("");
  }

  async function toggleDone(task) {
    const updated = await api(`/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify({ done: !task.done }),
    });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  }

  async function deleteTask(id) {
    await api(`/tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div style={s.center}>
      <div style={{ ...s.card, width: 480 }}>
        <div style={s.row}>
          <h2 style={s.title}>My Tasks</h2>
          <button style={s.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
        <form onSubmit={addTask} style={s.row}>
          <input style={{ ...s.input, flex: 1, margin: 0 }} placeholder="Add a task..." value={text} onChange={e => setText(e.target.value)} />
          <button style={{ ...s.btn, width: "auto", padding: "10px 16px", marginLeft: 8 }} type="submit">Add</button>
        </form>
        {tasks.length === 0 && <p style={{ color: "#888" }}>No tasks yet. Add one above!</p>}
        {tasks.map(task => (
          <div key={task.id} style={s.taskRow}>
            <input type="checkbox" checked={task.done} onChange={() => toggleDone(task)} style={{ marginRight: 10 }} />
            <span style={{ flex: 1, textDecoration: task.done ? "line-through" : "none", color: task.done ? "#aaa" : "#222" }}>
              {task.text}
            </span>
            <button style={s.deleteBtn} onClick={() => deleteTask(task.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }
  return user ? <TaskApp user={user} onLogout={logout} /> : <AuthScreen onLogin={setUser} />;
}

const s = {
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", fontFamily: "sans-serif" },
  card: { background: "#fff", borderRadius: 12, padding: 32, boxShadow: "0 2px 20px rgba(0,0,0,0.08)", width: 380 },
  title: { margin: "0 0 20px", fontSize: 22, fontWeight: 700 },
  input: { display: "block", width: "100%", padding: "10px 14px", marginBottom: 12, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  btn: { display: "block", width: "100%", padding: "11px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  tabs: { display: "flex", gap: 8, marginBottom: 16 },
  tab: { flex: 1, padding: "8px", background: "#f1f1f1", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  activeTab: { flex: 1, padding: "8px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  error: { color: "#ef4444", fontSize: 13, margin: "0 0 12px" },
  row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  taskRow: { display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  deleteBtn: { background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 16 },
  logoutBtn: { background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#666" },
};