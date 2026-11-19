import { useState } from 'react';
import { inr } from '../utils.js';

const FILTERS = [['all', 'সব'], ['pend', 'বাকি'], ['ok', 'জমা']];

export default function MemberList({ members, payOf, a }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState('all');
  if (!members.length) return <div className="mu">কোনো সদস্য নেই। নিচে যোগ করুন।</div>;

  const term = q.trim().toLowerCase();
  const list = members
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => (f === 'all' || (f === 'ok') === !!payOf(x.id)))
    .filter(({ x }) => !term || x.name.toLowerCase().includes(term) || (x.phone || '').includes(term));

  return (
    <>
      <input placeholder="🔍 নাম বা মোবাইল খুঁজুন" style={{ width: '100%', marginBottom: 8 }} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        {FILTERS.map(([k, label]) => (
          <button key={k} className={'chip ' + (f === k ? 'on' : '')} onClick={() => setF(k)}>{label}</button>
        ))}
      </div>
      {!list.length && <div className="mu" style={{ padding: '10px 0' }}>কাউকে পাওয়া যায়নি</div>}
      {list.map(({ x, i }) => {
        const p = payOf(x.id);
        return (
          <div className="m" key={x.id}>
            <div>
              <span className="mu">{i + 1}.</span> <b>{x.name}</b> <span className="mu">{x.phone || ''}</span>
              <br />
              {p ? (
                <><span className="tag ok">জমা {inr(p.amt)}</span> <span className="mu">{p.date}</span></>
              ) : (
                <span className="tag no">বাকি {inr(x.amt)}</span>
              )}
            </div>
            <div className="row">
              <button className={'s ' + (p ? '' : 'p')} onClick={() => a.togglePay(x)}>{p ? '❌ জমা মুছুন' : 'জমা নিলাম'}</button>
              {p ? (
                <>
                  <button className="s" onClick={() => a.receiptJpg(x)}>🖼 Receipt JPG</button>
                  <button className="s" onClick={() => a.receiptXl(x)}>📊 Excel</button>
                  <button className="s p" onClick={() => a.sendReceipt(x)}>📲 Send</button>
                </>
              ) : (
                <button className="s" onClick={() => a.wa(x)}>Reminder</button>
              )}
              <button className="s" onClick={() => a.editAmt(x)}>✏️ ₹</button>
              <button className="s" onClick={() => a.delMember(x)}>🗑</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
