const TOKEN_KEY = 'chanda_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(path, { method = 'GET', body, raw } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && path !== '/login') onUnauthorized();
  if (!res.ok) {
    let msg = 'কিছু একটা সমস্যা হয়েছে';
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return raw ? res.blob() : res.json();
}

export const api = {
  login: (password) => request('/login', { method: 'POST', body: { password } }),
  getData: () => request('/data'),
  addMember: (m) => request('/members', { method: 'POST', body: m }),
  setAmt: (id, amt) => request('/members/' + id, { method: 'PATCH', body: { amt } }),
  setAllAmt: (amt) => request('/members/bulk-amt', { method: 'POST', body: { amt } }),
  delMember: (id) => request('/members/' + id, { method: 'DELETE' }),
  putPayment: (memberId, month, amt) => request('/payments', { method: 'PUT', body: { memberId, month, amt } }),
  delPayment: (memberId, month) => request(`/payments/${memberId}/${month}`, { method: 'DELETE' }),
  addExpense: (month, description, amt) => request('/expenses', { method: 'POST', body: { month, description, amt } }),
  delExpense: (id) => request('/expenses/' + id, { method: 'DELETE' }),
  saveSettings: (patch) => request('/settings', { method: 'PUT', body: patch }),
  backup: () => request('/backup'),
  restore: (data) => request('/restore', { method: 'POST', body: data }),
  excel: (path) => request(path, { raw: true }),
};

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
