import { inr, mname } from '../utils.js';

export default function Alert({ month, pending, day, onWa, onSms }) {
  if (!pending.length) return null;
  return (
    <details className="alert">
      <summary style={{ cursor: 'pointer' }}>
        <b>⏰ {mname(month)} — {day} তারিখ পার, {pending.length} জনের চাঁদা বাকি</b>{' '}
        <span className="mu">(দেখুন ▾)</span>
      </summary>
      <div className="mu" style={{ margin: '4px 0 8px' }}>নিচের বোতামে চাপলে মেসেজ তৈরি হয়ে WhatsApp খুলবে।</div>
      {pending.map((x) => (
        <div className="row" style={{ margin: '4px 0' }} key={x.id}>
          <span style={{ flex: 1 }}>{x.name} — {inr(x.amt)}</span>
          <button className="s p" onClick={() => onWa(x)}>WhatsApp</button>
          <button className="s" onClick={() => onSms(x)}>SMS</button>
        </div>
      ))}
    </details>
  );
}
