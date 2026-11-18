import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onDone }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { token } = await api.login(pw);
      setToken(token);
      onDone();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <img className="banner" src="/banner.jpg" alt="পালংপুর অমর স্মৃতি সংঘ" />
      <form className="card" onSubmit={submit}>
        <h2>🔒 LOGIN</h2>
        <div className="row">
          <input type="password" placeholder="পাসওয়ার্ড" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          <button className="p" disabled={busy || !pw}>ঢুকুন</button>
        </div>
        {err && <div className="err">{err}</div>}
      </form>
    </div>
  );
}
