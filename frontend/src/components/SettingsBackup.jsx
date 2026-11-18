import { useState } from 'react';

export function Reminder({ settings, onChange }) {
  return (
    <div className="card">
      <h2>রিমাইন্ডার মেসেজ</h2>
      <input
        placeholder="সংগঠনের নাম (রসিদ ও রিপোর্টে দেখাবে)"
        style={{ width: '100%', marginBottom: 8 }}
        value={settings.org}
        onChange={(e) => onChange({ org: e.target.value })}
      />
      <div className="row" style={{ marginBottom: 8 }}>
        <span>প্রতি মাসের</span>
        <input
          type="number" min="1" max="31" style={{ flex: '0 0 70px' }}
          value={settings.day}
          onChange={(e) => { const v = +e.target.value; if (v >= 1 && v <= 31) onChange({ day: v }); }}
        />
        <span>তারিখের পর বাকি থাকলে রিমাইন্ডার দেখাবে</span>
      </div>
      <textarea value={settings.tpl} onChange={(e) => onChange({ tpl: e.target.value })} />
      <div className="mu">{'{নাম}, {মাস}, {টাকা}'} নিজে থেকে বসে যাবে।</div>
    </div>
  );
}

export function Backup({ onExport, onImport }) {
  const [text, setText] = useState('');
  return (
    <div className="card">
      <h2>ব্যাকআপ</h2>
      <div className="row">
        <button onClick={async () => { const t = await onExport(); if (t) setText(t); }}>ব্যাকআপ কপি করুন</button>
        <button onClick={() => onImport(text)}>ব্যাকআপ থেকে ফিরিয়ে আনুন</button>
      </div>
      <textarea
        placeholder="এখানে ব্যাকআপ লেখা আসবে / পেস্ট করুন"
        style={{ marginTop: 8 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mu">ডেটা সার্ভারের ডাটাবেসে সেভ থাকে। চাইলে ব্যাকআপ কপি করে নিজের কাছেও রাখুন।</div>
    </div>
  );
}
