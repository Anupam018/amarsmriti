export const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const mname = (k) => `${MN[+k.slice(5) - 1]} ${k.slice(0, 4)}`;
export const inr = (n) => (n < 0 ? '-' : '') + '₹' + Math.abs(Number(n || 0)).toLocaleString('en-IN');
export const ph = (p) => {
  p = String(p).replace(/\D/g, '');
  return p.length === 10 ? '91' + p : p;
};
export const fillTpl = (tpl, mem, m) =>
  tpl.replace(/{নাম}/g, mem.name).replace(/{মাস}/g, mname(m)).replace(/{টাকা}/g, mem.amt);
export const activeMembers = (members, m) => members.filter((x) => x.start <= m);
export const receiptNo = (m, idx) => `RC-${m.replace('-', '')}-${String(idx + 1).padStart(2, '0')}`;
export const todayIN = () => new Date().toLocaleDateString('en-IN');
