// App.jsx (very small demo client)
import React, { useEffect, useState } from "react";

const API = "http://localhost:4000/api";

function authHeaders(token) {
  return { Authorization: token ? `Bearer ${token}` : "" };
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API}/elections`)
      .then(r => r.json())
      .then(setElections)
      .catch(console.error);
  }, []);

  function saveAuth(tkn, usr) {
    setToken(tkn); setUser(usr);
    localStorage.setItem("token", tkn);
    localStorage.setItem("user", JSON.stringify(usr));
  }

  async function login(email, password) {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if (res.ok) {
      saveAuth(j.token, j.user);
      setMessage("Logged in");
    } else {
      setMessage(j.error || "Login failed");
    }
  }

  async function register(name, email, password) {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ name, email, password })
    });
    const j = await res.json();
    if (res.ok) {
      setMessage("Registered! Please log in.");
    } else setMessage(j.error || "Register failed");
  }

  async function viewElection(eid) {
    const res = await fetch(`${API}/elections/${eid}`);
    const j = await res.json();
    if (res.ok) {
      setSelected(j.election);
      setCandidates(j.candidates);
    }
  }

  async function castVote(candidate_id) {
    if (!token) { setMessage("Please log in"); return; }
    const res = await fetch(`${API}/elections/${selected.id}/vote`, {
      method: "POST",
      headers: {"Content-Type":"application/json", ...authHeaders(token)},
      body: JSON.stringify({ candidate_id })
    });
    const j = await res.json();
    setMessage(j.error || "Vote recorded. Thank you!");
  }

  return (
    <div style={{maxWidth:800, margin:"0 auto", fontFamily:"Arial, sans-serif"}}>
      <h1>Mini Voting App</h1>
      <div>
        {user ? <div>Welcome, {user.name} <button onClick={() => { localStorage.clear(); setUser(null); setToken(null); }}>Logout</button></div> :
          <AuthForms onLogin={login} onRegister={register} />}
      </div>

      <hr />
      <h2>Elections</h2>
      <ul>
        {elections.map(e => <li key={e.id}>
          <b>{e.title}</b> {e.is_active ? "(active)" : "(inactive)"} 
          <button onClick={() => viewElection(e.id)} style={{marginLeft:8}}>View</button>
        </li>)}
      </ul>

      {selected && (
        <div style={{border:"1px solid #ddd", padding:12, marginTop:12}}>
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
          <h4>Candidates</h4>
          <ul>
            {candidates.map(c => <li key={c.id}>
              {c.name} <button onClick={() => castVote(c.id)} style={{marginLeft:8}}>Vote</button>
            </li>)}
          </ul>
        </div>
      )}

      {message && <div style={{marginTop:12, color:"green"}}>{message}</div>}
    </div>
  );
}

function AuthForms({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  return (
    <div style={{display:"flex", gap:12}}>
      <div>
        <div>
          <button onClick={() => setMode("login")} disabled={mode==="login"}>Login</button>
          <button onClick={() => setMode("register")} disabled={mode==="register"}>Register</button>
        </div>
        {mode==="register" && <>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} /><br/>
        </>}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><br/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /><br/>
        {mode==="login" ? <button onClick={() => onLogin(email, password)}>Login</button>
          : <button onClick={() => onRegister(name, email, password)}>Register</button>}
      </div>
    </div>
  );
}
