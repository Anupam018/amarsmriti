import ExcelJS from 'exceljs';
import { q } from './db.js';

const MN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const mname = (k) => `${MN[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
const todayIN = () => new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
const getOrg = async () => (await q(`SELECT value FROM settings WHERE key='org'`)).rows[0]?.value || '';

async function send(res, wb, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  await wb.xlsx.write(res);
  res.end();
}

function sheet(rows, boldRows = []) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.columns = [{ width: 24 }, { width: 28 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }];
  rows.forEach((r) => ws.addRow(r));
  boldRows.forEach((n) => (ws.getRow(n).font = { bold: true }));
  return wb;
}

export async function reportXlsx(month, res) {
  const org = await getOrg();
  const { rows: mem } = await q(
    `SELECT m.id, m.name, m.phone, m.amt AS due_amt, p.amt AS paid_amt, to_char(p.paid_on,'DD/MM/YYYY') AS paid_on
       FROM members m LEFT JOIN payments p ON p.member_id=m.id AND p.month=$1
      WHERE m.start_month <= $1 ORDER BY m.id`, [month]);
  const { rows: ex } = await q(
    `SELECT description, amt, to_char(spent_on,'DD/MM/YYYY') AS date FROM expenses WHERE month=$1 ORDER BY id`, [month]);

  let got = 0, due = 0;
  const memberRows = mem.map((x, i) => {
    const paid = x.paid_amt !== null;
    if (paid) got += x.paid_amt; else due += x.due_amt;
    return [i + 1, x.name, x.phone || '-', paid ? 'জমা' : 'বাকি', paid ? x.paid_amt : x.due_amt, paid ? x.paid_on : ''];
  });
  const exT = ex.reduce((t, e) => t + e.amt, 0);

  const rows = [
    [org], [`${mname(month)} এর মাসিক হিসাব`], ['তৈরি', todayIN()], [],
    ['সারসংক্ষেপ'],
    ['মোট ধার্য চাঁদা (₹)', got + due], ['মোট জমা (₹)', got], ['মোট বাকি (₹)', due],
    ['মোট খরচ (₹)', exT], ['হাতে আছে (জমা − খরচ) (₹)', got - exT], [],
    ['সদস্যদের তালিকা'],
    ['ক্রম', 'নাম', 'মোবাইল', 'অবস্থা', 'টাকা (₹)', 'জমার তারিখ'],
    ...memberRows, [],
    ['খরচের তালিকা'],
    ['ক্রম', 'বিবরণ', '', '', 'টাকা (₹)', 'তারিখ'],
  ];
  const expHeaderRow = rows.length;
  ex.forEach((e, i) => rows.push([i + 1, e.description, '', '', e.amt, e.date]));
  if (!ex.length) rows.push(['এই মাসে কোনো খরচ নেই']);
  rows.push(['মোট খরচ', '', '', '', exT]);

  await send(res, sheet(rows, [1, 2, 5, 12, 13, expHeaderRow - 1, expHeaderRow, rows.length]),
    `Chanda-hisab-${month}.xlsx`);
}

export async function receiptXlsx(memberId, month, res) {
  const org = await getOrg();
  const { rows } = await q(
    `SELECT m.name, m.phone, p.amt, to_char(p.paid_on,'DD/MM/YYYY') AS date,
            (SELECT count(*)::int FROM members WHERE id <= m.id) AS n
       FROM members m JOIN payments p ON p.member_id=m.id AND p.month=$2
      WHERE m.id=$1`, [memberId, month]);
  if (!rows.length) return false;
  const x = rows[0];
  const no = `RC-${month.replace('-', '')}-${String(x.n).padStart(2, '0')}`;
  await send(res, sheet([
    [org], ['চাঁদা রসিদ'], [],
    ['রসিদ নং', no], ['তারিখ', x.date], ['সদস্যের নাম', x.name], ['মোবাইল', x.phone || '-'],
    ['কোন মাসের চাঁদা', mname(month)], ['প্রাপ্ত টাকা (₹)', x.amt],
  ], [1, 2]), `Rosid-${x.name.replace(/\s+/g, '-')}-${month}.xlsx`);
  return true;
}
