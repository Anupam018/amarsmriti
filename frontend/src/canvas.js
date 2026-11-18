import { mname, todayIN } from './utils.js';

const FF = '"Noto Sans Bengali","Nirmala UI",Vrinda,system-ui,sans-serif';
const cv = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.textBaseline = 'top';
  return [c, g];
};
const ft = (g, sz, b) => (g.font = (b ? '700 ' : '400 ') + sz + 'px ' + FF);

let bannerP;
export const loadBanner = () =>
  (bannerP ||= new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = '/banner.jpg';
  }));
const bannerH = (BN) => (BN?.naturalWidth ? Math.round((1090 * BN.naturalHeight) / BN.naturalWidth) : 0);

export const toJpg = (c) => new Promise((rs) => c.toBlob(rs, 'image/jpeg', 0.92));

export async function receiptCanvas({ member: x, pay: p, month: m, no }) {
  const BN = await loadBanner();
  const [c, g] = cv(1190, 1010);
  g.strokeStyle = '#1f7a4d'; g.lineWidth = 6; g.strokeRect(20, 20, 1150, 970);
  if (BN) g.drawImage(BN, 50, 50, 1090, bannerH(BN));
  g.textAlign = 'center'; ft(g, 42, 1); g.fillStyle = '#1f7a4d'; g.fillText('চাঁদা রসিদ', 595, 325);
  g.textAlign = 'left';
  const rows = [
    ['রসিদ নং', no], ['তারিখ', p.date], ['সদস্যের নাম', x.name], ['মোবাইল', x.phone || '-'],
    ['কোন মাসের চাঁদা', mname(m)], ['প্রাপ্ত টাকা', '₹ ' + p.amt],
  ];
  rows.forEach((q, i) => {
    const y = 410 + i * 72;
    ft(g, 32); g.fillStyle = '#68716b'; g.fillText(q[0], 80, y);
    ft(g, 34, i === 5); g.fillStyle = '#111'; g.fillText(': ' + q[1], 430, y);
  });
  ft(g, 28); g.fillStyle = '#68716b'; g.fillText('গ্রহীতার স্বাক্ষর', 840, 925);
  g.fillStyle = '#1f7a4d'; g.fillRect(780, 910, 330, 2);
  return c;
}

export async function reportCanvas({ month: m, members: A, payOf, expTotal }) {
  const BN = await loadBanner();
  const oy = bannerH(BN) + 80;
  const [c, g] = cv(1190, A.length * 52 + 345 + oy);
  g.textAlign = 'left';
  if (BN) g.drawImage(BN, 50, 40, 1090, bannerH(BN));
  ft(g, 38, 1); g.fillStyle = '#1f7a4d'; g.fillText(mname(m) + ' এর চাঁদার হিসাব', 50, oy + 20);
  ft(g, 26); g.fillStyle = '#68716b'; g.fillText('তৈরি: ' + todayIN(), 50, oy + 78);
  const X = [50, 130, 520, 780, 960];
  ft(g, 28, 1); g.fillStyle = '#111';
  ['ক্রম', 'নাম', 'মোবাইল', 'অবস্থা', 'টাকা'].forEach((t, i) => g.fillText(t, X[i], oy + 130));
  g.fillRect(50, oy + 172, 1090, 2);
  let got = 0, due = 0;
  A.forEach((x, i) => {
    const y = oy + 190 + i * 52, p = payOf(x.id);
    ft(g, 28); g.fillStyle = '#111';
    g.fillText(String(i + 1), X[0], y); g.fillText(x.name, X[1], y); g.fillText(x.phone || '-', X[2], y);
    g.fillStyle = p ? '#1f7a4d' : '#c0392b'; g.fillText(p ? 'জমা' : 'বাকি', X[3], y);
    g.fillText('₹ ' + (p ? p.amt : x.amt), X[4], y);
    if (p) got += p.amt; else due += x.amt;
  });
  const y = oy + 190 + A.length * 52 + 10;
  g.fillStyle = '#111'; g.fillRect(50, y, 1090, 2); ft(g, 30, 1);
  g.fillText('মোট জমা: ₹ ' + got + '      মোট বাকি: ₹ ' + due, 50, y + 25);
  g.fillText('মোট খরচ: ₹ ' + expTotal + '      হাতে আছে: ₹ ' + (got - expTotal), 50, y + 75);
  return c;
}
