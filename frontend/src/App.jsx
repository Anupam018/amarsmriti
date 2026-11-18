import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, saveBlob, setToken, setUnauthorizedHandler } from './api.js';
import { activeMembers, fillTpl, inr, mname, ph, receiptNo, ym } from './utils.js';
import { receiptCanvas, reportCanvas, toJpg } from './canvas.js';
import Login from './components/Login.jsx';
import Alert from './components/Alert.jsx';
import MemberList from './components/MemberList.jsx';
import { Expenses, BulkSet, AddMember } from './components/Forms.jsx';
import Grid from './components/Grid.jsx';
import { Reminder, Backup } from './components/SettingsBackup.jsx';
import ImageModal from './components/ImageModal.jsx';

const cur = ym(new Date());

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  useEffect(() => {
    setUnauthorizedHandler(() => { setToken(null); setAuthed(false); });
  }, []);
  return authed ? <Main /> : <Login onDone={() => setAuthed(true)} />;
}

function Main() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(cur);
  const [preview, setPreview] = useState(null);
  const [loadErr, setLoadErr] = useState('');

  const refresh = useCallback(async () => setData(await api.getData()), []);
  useEffect(() => { refresh().catch((e) => setLoadErr(e.message)); }, [refresh]);

  // run an action, refresh, and show any error in Bengali alert like the original
  const run = async (fn) => {
    try { const r = await fn(); await refresh(); return r ?? true; }
    catch (e) { alert(e.message); return false; }
  };

  // settings: update UI instantly, save to server shortly after typing stops
  const saveTimer = useRef();
  const pendingPatch = useRef({});
  const updateSettings = (patch) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const p = pendingPatch.current; pendingPatch.current = {};
      api.saveSettings(p).catch((e) => alert(e.message));
    }, 500);
  };

  const derived = useMemo(() => {
    if (!data) return null;
    const A = activeMembers(data.members, month);
    const payOf = (id) => data.pay[month]?.[id];
    const ok = A.filter((x) => payOf(x.id));
    const pend = A.filter((x) => !payOf(x.id));
    const got = ok.reduce((s, x) => s + payOf(x.id).amt, 0);
    const due = pend.reduce((s, x) => s + x.amt, 0);
    const ex = data.exp[month] || [];
    const exT = ex.reduce((t, e) => t + e.amt, 0);
    return { A, payOf, ok, pend, got, due, ex, exT };
  }, [data, month]);

  if (loadErr) return <main><div className="card err">{loadErr}</div></main>;
  if (!data) return <main><div className="mu">লোড হচ্ছে…</div></main>;

  const { A, payOf, ok, pend, got, due, ex, exT } = derived;
  const { settings } = data;
  const late = month < cur || (month === cur && new Date().getDate() >= settings.day);

  /* ---------- actions ---------- */
  const noPhone = () => alert('মোবাইল নম্বর নেই');
  const a = {
    wa(x) {
      if (!x.phone) return noPhone();
      window.open('https://wa.me/' + ph(x.phone) + '?text=' + encodeURIComponent(fillTpl(settings.tpl, x, month)), '_blank');
    },
    sms(x) {
      if (!x.phone) return noPhone();
      location.href = 'sms:+' + ph(x.phone) + '?body=' + encodeURIComponent(fillTpl(settings.tpl, x, month));
    },
    togglePay(x) {
      if (payOf(x.id)) {
        if (!confirm('এই জমা মুছে দেবেন? (আবার "বাকি" হয়ে যাবে)')) return;
        return run(() => api.delPayment(x.id, month));
      }
      const v = prompt('কত টাকা পেলেন?', x.amt);
      if (v === null) return;
      return run(() => api.putPayment(x.id, month, +v || 0));
    },
    editAmt(x) {
      const v = prompt(x.name + ' এর মাসিক চাঁদা ₹', x.amt);
      if (v === null) return;
      return run(() => api.setAmt(x.id, +v || 0));
    },
    delMember(x) {
      if (!confirm('সদস্য মুছবেন?')) return;
      return run(() => api.delMember(x.id));
    },
    async receiptJpg(x) {
      const p = payOf(x.id); if (!p) return;
      const no = receiptNo(month, data.members.indexOf(x));
      const blob = await toJpg(await receiptCanvas({ member: x, pay: p, month, no }));
      setPreview({ url: URL.createObjectURL(blob), name: `Rosid-${x.name.replace(/\s+/g, '-')}-${month}.jpg` });
    },
    async receiptXl(x) {
      try {
        saveBlob(await api.excel(`/export/receipt/${x.id}/${month}`), `Rosid-${x.name.replace(/\s+/g, '-')}-${month}.xlsx`);
      } catch (e) { alert(e.message); }
    },
    async sendReceipt(x) {
      const p = payOf(x.id); if (!p) return;
      const no = receiptNo(month, data.members.indexOf(x));
      const t = (settings.org ? settings.org + '\n' : '') + 'চাঁদা রসিদ\nরসিদ নং: ' + no + '\nনাম: ' + x.name +
        '\nমাস: ' + mname(month) + '\nপ্রাপ্ত টাকা: ₹' + p.amt + '\nতারিখ: ' + p.date + '\nধন্যবাদ।';
      try {
        if (navigator.canShare) {
          const blob = await toJpg(await receiptCanvas({ member: x, pay: p, month, no }));
          const file = new File([blob], 'rosid-' + no + '.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] }) &&
              confirm('রসিদের ছবি শেয়ার করবেন?\nOK = ছবি (WhatsApp বেছে নিন)\nCancel = শুধু লেখা পাঠান')) {
            await navigator.share({ files: [file], text: t });
            return;
          }
        }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      if (!x.phone) return noPhone();
      window.open('https://wa.me/' + ph(x.phone) + '?text=' + encodeURIComponent(t), '_blank');
    },
  };

  async function reportJpg() {
    if (!A.length) return alert('কোনো সদস্য নেই');
    const blob = await toJpg(await reportCanvas({ month, members: A, payOf, expTotal: exT }));
    setPreview({ url: URL.createObjectURL(blob), name: `Chanda-report-${month}.jpg` });
  }
  async function reportXl() {
    if (!A.length) return alert('কোনো সদস্য নেই');
    try { saveBlob(await api.excel('/export/report/' + month), `Chanda-hisab-${month}.xlsx`); }
    catch (e) { alert(e.message); }
  }

  const addExpense = (d, amt) => {
    if (!d || !amt) { alert('বিবরণ আর টাকার অঙ্ক দিন'); return false; }
    return run(() => api.addExpense(month, d, amt));
  };
  const delExpense = (e) => {
    if (!confirm('এই খরচ মুছবেন?')) return;
    return run(() => api.delExpense(e.id));
  };
  const setAll = (v) => {
    if (!v) { alert('টাকার অঙ্ক দিন'); return false; }
    if (!confirm('সবার মাসিক চাঁদা ₹' + v + ' করবেন?')) return false;
    return run(() => api.setAllAmt(v));
  };
  const addMember = (name, phone, amt) => {
    if (!name || !amt) { alert('নাম আর টাকার অঙ্ক দিন'); return false; }
    return run(() => api.addMember({ name, phone, amt, start: month || cur }));
  };
  const exportBackup = async () => {
    try {
      const text = JSON.stringify(await api.backup());
      try { await navigator.clipboard.writeText(text); } catch {}
      return text;
    } catch (e) { alert(e.message); return ''; }
  };
  const importBackup = async (text) => {
    let d;
    try { d = JSON.parse(text); if (!d.members) throw 0; } catch { return alert('ব্যাকআপ ঠিক নেই'); }
    if (!confirm('বর্তমান সব ডেটা মুছে ব্যাকআপের ডেটা বসবে। নিশ্চিত?')) return;
    if (await run(() => api.restore(d))) alert('ফিরে এসেছে');
  };

  return (
    <main>
      <img className="banner" src="/banner.jpg" alt="পালংপুর অমর স্মৃতি সংঘ" />
      <h1>
        💰 মাসিক চাঁদা হিসাব{' '}
        <button className="s" style={{ float: 'right' }} onClick={() => { setToken(null); location.reload(); }}>লগআউট</button>
      </h1>

      {late && (
        <Alert month={month} pending={pend} day={settings.day} onWa={a.wa} onSms={a.sms} />
      )}

      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>মাস:</h2>
          <input type="month" style={{ flex: '0 0 auto' }} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          <button className="s" onClick={reportJpg}>🖼 রিপোর্ট JPG</button>
          <button className="s" onClick={reportXl}>📊 মাসের হিসাব Excel</button>
        </div>
        <div className="stats">
          <div className="stat"><b>{inr(got)}</b><span>জমা ({ok.length} জন)</span></div>
          <div className="stat"><b>{inr(due)}</b><span>বাকি ({pend.length} জন)</span></div>
          <div className="stat"><b>{A.length}</b><span>মোট সদস্য</span></div>
          <div className="stat"><b>{inr(exT)}</b><span>খরচ</span></div>
          <div className="stat"><b>{inr(got - exT)}</b><span>হাতে আছে</span></div>
          <div className="stat"><b>{inr(got + due)}</b><span>মোট ধার্য</span></div>
        </div>
      </div>

      <div className="card">
        <h2>এই মাসের তালিকা</h2>
        <MemberList members={A} payOf={payOf} a={a} />
      </div>

      <Expenses list={ex} onAdd={addExpense} onDel={delExpense} />
      <BulkSet onSet={setAll} />
      <AddMember onAdd={addMember} />

      <div className="card">
        <h2>গত ১২ মাসের হিসাব</h2>
        <div className="scroll"><Grid members={data.members} pay={data.pay} /></div>
      </div>

      <Reminder settings={settings} onChange={updateSettings} />
      <Backup onExport={exportBackup} onImport={importBackup} />

      {preview && (
        <ImageModal {...preview} onClose={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} />
      )}
    </main>
  );
}
