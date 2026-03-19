const API_BASE = import.meta.env.VITE_API_BASE || 'https://starquest-production.up.railway.app';
const tg = window.Telegram?.WebApp;

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (tg?.initData) h['X-Init-Data'] = tg.initData;
  return h;
}

function uidParam() {
  const uid = tg?.initDataUnsafe?.user?.id;
  return uid ? `?user_id=${uid}` : '';
}

export async function fetchUser() {
  const r = await fetch(`${API_BASE}/api/user${uidParam()}`, { headers: headers() });
  return r.json();
}

export async function checkTask(channelId) {
  const r = await fetch(`${API_BASE}/api/check_task${uidParam()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ channel_id: channelId, user_id: tg?.initDataUnsafe?.user?.id }),
  });
  return r.json();
}

export async function submitWithdraw(amount, wallet, method = 'stars') {
  const r = await fetch(`${API_BASE}/api/withdraw${uidParam()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ amount, wallet, method, user_id: tg?.initDataUnsafe?.user?.id }),
  });
  return r.json();
}

export async function fetchWithdrawals() {
  const r = await fetch(`${API_BASE}/api/withdrawals${uidParam()}`, { headers: headers() });
  return r.json();
}

export async function spinWheel() {
  const r = await fetch(`${API_BASE}/api/wheel_spin${uidParam()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ user_id: tg?.initDataUnsafe?.user?.id }),
  });
  return r.json();
}

export async function buyMysteryBox(cost = 10) {
  const r = await fetch(`${API_BASE}/api/nft/mystery_box${uidParam()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ cost, user_id: tg?.initDataUnsafe?.user?.id }),
  });
  return r.json();
}

export async function fetchVersion() {
  const r = await fetch(`${API_BASE}/api/version`);
  return r.json();
}
