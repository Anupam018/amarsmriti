import { useState } from 'react';
import { inr } from '../utils.js';

export function Expenses({ list, onAdd, onDel }) {
  const [d, setD] = useState('');
  const [amt, setAmt] = useState('');
  return (
    <div className="card">
      <h2>এই মাসের খরচ</h2>
      {list.length ? (
        list.map((e) => (
          <div className="m" key={e.id}>
            <div>{e.d} <span className="mu">{e.date}</span></div>
            <div className="row">
              <b>{inr(e.amt)}</b>
              <button className="s" onClick={() => onDel(e)}>🗑</button>
            </div>
          </div>
        ))
      ) : (
        <div className="mu">এই মাসে কোনো খরচ নেই</div>
      )}
      <div className="row" style={{ marginTop: 8 }}>
        <input placeholder="খরচের বিবরণ" value={d} onChange={(e) => setD(e.target.value)} />
        <input placeholder="টাকা ₹" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <button className="p" onClick={async () => { if (await onAdd(d.trim(), +amt)) { setD(''); setAmt(''); } }}>
          যোগ করুন
        </button>
      </div>
    </div>
  );
}

export function BulkSet({ onSet }) {
  const [v, setV] = useState('');
  return (
    <div className="card">
      <h2>সবার মাসিক চাঁদা একসাথে সেট করুন</h2>
      <div className="row">
        <input placeholder="যেমন 100" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} />
        <button className="p" onClick={async () => { if (await onSet(+v)) setV(''); }}>সেট করুন</button>
      </div>
    </div>
  );
}

export function AddMember({ onAdd }) {
  const [nm, setNm] = useState('');
  const [ph, setPh] = useState('');
  const [am, setAm] = useState('');
  return (
    <div className="card">
      <h2>নতুন সদস্য যোগ করুন</h2>
      <div className="row">
        <input placeholder="নাম" value={nm} onChange={(e) => setNm(e.target.value)} />
        <input placeholder="মোবাইল নম্বর" inputMode="tel" value={ph} onChange={(e) => setPh(e.target.value)} />
        <input placeholder="মাসিক চাঁদা ₹" inputMode="numeric" value={am} onChange={(e) => setAm(e.target.value)} />
        <button
          className="p"
          onClick={async () => { if (await onAdd(nm.trim(), ph, +am)) { setNm(''); setPh(''); setAm(''); } }}
        >
          যোগ করুন
        </button>
      </div>
    </div>
  );
}
