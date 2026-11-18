import { Router } from 'express';
import { pool, q, TODAY_IST } from './db.js';
import { reportXlsx, receiptXlsx } from './excel.js';

const r = Router();
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const bad = (res, msg) => res.status(400).json({ error: msg });
const int = (v) => (Number.isFinite(+v) ? Math.round(+v) : NaN);

async function loadAll() {
  const [m, p, e, s] = await Promise.all([
    q(`SELECT id, name, phone, amt, start_month AS start FROM members ORDER BY id`),
    q(`SELECT member_id, month, amt, to_char(paid_on,'DD/MM/YYYY') AS date FROM payments`),
    q(`SELECT id, month, description AS d, amt, to_char(spent_on,'DD/MM/YYYY') AS date
       FROM expenses ORDER BY id`),
    q(`SELECT key, value FROM settings`),
  ]);
  const pay = {};
  p.rows.forEach((x) => ((pay[x.month] ||= {})[x.member_id] = { amt: x.amt, date: x.date }));
  const exp = {};
  e.rows.forEach((x) => (exp[x.month] ||= []).push({ id: x.id, d: x.d, amt: x.amt, date: x.date }));
  const st = Object.fromEntries(s.rows.map((x) => [x.key, x.value]));
  return {
    members: m.rows,
    pay,
    exp,
    settings: { org: st.org ?? '', day: +st.day || 15, tpl: st.tpl ?? '' },
  };
}

r.get('/data', async (_req, res) => res.json(await loadAll()));

/* ---------- members ---------- */
r.post('/members', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').replace(/\D/g, '');
  const amt = int(req.body.amt);
  const start = req.body.start;
  if (!name || !(amt > 0)) return bad(res, 'নাম আর টাকার অঙ্ক দিন');
  if (!MONTH_RE.test(start)) return bad(res, 'মাস ঠিক নেই');
  const { rows } = await q(
    `INSERT INTO members(name,phone,amt,start_month) VALUES ($1,$2,$3,$4)
     RETURNING id, name, phone, amt, start_month AS start`,
    [name, phone, amt, start]
  );
  res.status(201).json(rows[0]);
});

r.post('/members/bulk-amt', async (req, res) => {
  const amt = int(req.body.amt);
  if (!(amt > 0)) return bad(res, 'টাকার অঙ্ক দিন');
  await q('UPDATE members SET amt=$1', [amt]);
  res.json({ ok: true });
});

r.patch('/members/:id', async (req, res) => {
  const amt = int(req.body.amt);
  if (!(amt >= 0)) return bad(res, 'টাকার অঙ্ক ঠিক নেই');
  const { rowCount } = await q('UPDATE members SET amt=$1 WHERE id=$2', [amt, req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'সদস্য পাওয়া যায়নি' });
  res.json({ ok: true });
});

r.delete('/members/:id', async (req, res) => {
  await q('DELETE FROM members WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- payments ---------- */
r.put('/payments', async (req, res) => {
  const { memberId, month } = req.body;
  const amt = int(req.body.amt);
  if (!MONTH_RE.test(month)) return bad(res, 'মাস ঠিক নেই');
  if (!(amt >= 0)) return bad(res, 'টাকার অঙ্ক ঠিক নেই');
  try {
    await q(
      `INSERT INTO payments(member_id,month,amt,paid_on) VALUES ($1,$2,$3,${TODAY_IST})
       ON CONFLICT (member_id,month) DO UPDATE SET amt=EXCLUDED.amt, paid_on=EXCLUDED.paid_on`,
      [memberId, month, amt]
    );
  } catch (e) {
    if (e.code === '23503') return res.status(404).json({ error: 'সদস্য পাওয়া যায়নি' });
    throw e;
  }
  res.json({ ok: true });
});

r.delete('/payments/:memberId/:month', async (req, res) => {
  await q('DELETE FROM payments WHERE member_id=$1 AND month=$2', [req.params.memberId, req.params.month]);
  res.json({ ok: true });
});

/* ---------- expenses ---------- */
r.post('/expenses', async (req, res) => {
  const { month } = req.body;
  const description = String(req.body.description || '').trim();
  const amt = int(req.body.amt);
  if (!description || !(amt > 0)) return bad(res, 'বিবরণ আর টাকার অঙ্ক দিন');
  if (!MONTH_RE.test(month)) return bad(res, 'মাস ঠিক নেই');
  await q(`INSERT INTO expenses(month,description,amt,spent_on) VALUES ($1,$2,$3,${TODAY_IST})`, [
    month, description, amt,
  ]);
  res.status(201).json({ ok: true });
});

r.delete('/expenses/:id', async (req, res) => {
  await q('DELETE FROM expenses WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- settings ---------- */
r.put('/settings', async (req, res) => {
  const { org, day, tpl } = req.body;
  const up = (k, v) =>
    q(`INSERT INTO settings(key,value) VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`, [k, String(v)]);
  if (day !== undefined) {
    const d = int(day);
    if (!(d >= 1 && d <= 31)) return bad(res, 'তারিখ ১–৩১ এর মধ্যে দিন');
    await up('day', d);
  }
  if (org !== undefined) await up('org', org);
  if (tpl !== undefined) await up('tpl', tpl);
  res.json({ ok: true });
});

/* ---------- Excel downloads ---------- */
r.get('/export/report/:month', async (req, res) => {
  if (!MONTH_RE.test(req.params.month)) return bad(res, 'মাস ঠিক নেই');
  await reportXlsx(req.params.month, res);
});

r.get('/export/receipt/:memberId/:month', async (req, res) => {
  if (!MONTH_RE.test(req.params.month)) return bad(res, 'মাস ঠিক নেই');
  const ok = await receiptXlsx(req.params.memberId, req.params.month, res);
  if (!ok) res.status(404).json({ error: 'এই মাসে জমা নেই' });
});

/* ---------- backup / restore ---------- */
r.get('/backup', async (_req, res) => {
  const [m, p, e, s] = await Promise.all([
    q(`SELECT id, name, phone, amt, start_month AS start FROM members ORDER BY id`),
    q(`SELECT member_id AS "memberId", month, amt, to_char(paid_on,'YYYY-MM-DD') AS date FROM payments`),
    q(`SELECT id, month, description, amt, to_char(spent_on,'YYYY-MM-DD') AS date FROM expenses ORDER BY id`),
    q(`SELECT key, value FROM settings WHERE key IN ('org','day','tpl')`),
  ]);
  res.json({
    version: 1,
    members: m.rows,
    payments: p.rows,
    expenses: e.rows,
    settings: Object.fromEntries(s.rows.map((x) => [x.key, x.value])),
  });
});

r.post('/restore', async (req, res) => {
  const d = req.body;
  if (!d || !Array.isArray(d.members) || !Array.isArray(d.payments) || !Array.isArray(d.expenses)) {
    return bad(res, 'ব্যাকআপ ঠিক নেই');
  }
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('TRUNCATE payments, expenses, members RESTART IDENTITY CASCADE');
    for (const m of d.members) {
      await c.query('INSERT INTO members(id,name,phone,amt,start_month) VALUES ($1,$2,$3,$4,$5)', [
        m.id, m.name, m.phone || '', m.amt, m.start,
      ]);
    }
    for (const p of d.payments) {
      await c.query('INSERT INTO payments(member_id,month,amt,paid_on) VALUES ($1,$2,$3,$4)', [
        p.memberId, p.month, p.amt, p.date,
      ]);
    }
    for (const x of d.expenses) {
      await c.query('INSERT INTO expenses(id,month,description,amt,spent_on) VALUES ($1,$2,$3,$4,$5)', [
        x.id, x.month, x.description, x.amt, x.date,
      ]);
    }
    for (const [k, v] of Object.entries(d.settings || {})) {
      if (['org', 'day', 'tpl'].includes(k)) {
        await c.query(
          `INSERT INTO settings(key,value) VALUES ($1,$2)
           ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`, [k, String(v)]);
      }
    }
    await c.query(`SELECT setval(pg_get_serial_sequence('members','id'), COALESCE((SELECT max(id) FROM members),0)+1, false)`);
    await c.query(`SELECT setval(pg_get_serial_sequence('expenses','id'), COALESCE((SELECT max(id) FROM expenses),0)+1, false)`);
    await c.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await c.query('ROLLBACK');
    console.error(e);
    bad(res, 'ব্যাকআপ ঠিক নেই');
  } finally {
    c.release();
  }
});

export default r;
