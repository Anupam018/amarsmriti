import { inr } from '../utils.js';

export default function MemberList({ members, payOf, a }) {
  if (!members.length) return <div className="mu">কোনো সদস্য নেই। নিচে যোগ করুন।</div>;
  return members.map((x, i) => {
    const p = payOf(x.id);
    return (
      <div className="m" key={x.id}>
        <div>
          <span className="mu">{i + 1}.</span> <b>{x.name}</b> <span className="mu">{x.phone || ''}</span>
          <br />
          {p ? (
            <>
              <span className="tag ok">জমা {inr(p.amt)}</span> <span className="mu">{p.date}</span>
            </>
          ) : (
            <span className="tag no">বাকি {inr(x.amt)}</span>
          )}
        </div>
        <div className="row">
          <button className={'s ' + (p ? '' : 'p')} onClick={() => a.togglePay(x)}>
            {p ? '❌ জমা মুছুন' : 'জমা নিলাম'}
          </button>
          {p ? (
            <>
              <button className="s" onClick={() => a.receiptJpg(x)}>🖼 রসিদ JPG</button>
              <button className="s" onClick={() => a.receiptXl(x)}>📊 Excel</button>
              <button className="s p" onClick={() => a.sendReceipt(x)}>📲 পাঠান</button>
            </>
          ) : (
            <button className="s" onClick={() => a.wa(x)}>মেসেজ</button>
          )}
          <button className="s" onClick={() => a.editAmt(x)}>✏️ ₹</button>
          <button className="s" onClick={() => a.delMember(x)}>🗑</button>
        </div>
      </div>
    );
  });
}
