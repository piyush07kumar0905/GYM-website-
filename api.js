

const API_BASE = 'http://localhost:5000/api';


const getToken = () => localStorage.getItem('gymToken');
const setToken = (t) => localStorage.setItem('gymToken', t);
const setUser = (u) => localStorage.setItem('gymUser', JSON.stringify(u));
const getUser = () => { try { return JSON.parse(localStorage.getItem('gymUser')); } catch { return null; } };
const clearAuth = () => { localStorage.removeItem('gymToken'); localStorage.removeItem('gymUser'); };
const isLoggedIn = () => !!getToken();


async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}


async function apiRegister({ name, email, phone, password }) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password }),
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

async function apiLogin({ email, password }) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

function apiLogout() {
  clearAuth();
  window.location.href = 'Login.html';
}

async function apiMe() {
  return apiFetch('/auth/me');
}


async function apiPlaceOrder(orderData) {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

async function apiMyOrders() {
  return apiFetch('/orders/my');
}


async function apiSubscribe({ plan, billing, paymentMethod }) {
  return apiFetch('/membership', {
    method: 'POST',
    body: JSON.stringify({ plan, billing, paymentMethod }),
  });
}

async function apiMyMembership() {
  return apiFetch('/membership/my');
}

async function apiCancelMembership() {
  return apiFetch('/membership/cancel', { method: 'DELETE' });
}


function updateNavAuthState() {
  const user = getUser();

  const btn = document.getElementById('navAuthBtn');
  if (!btn) return;
  if (user) {
    btn.textContent = `👤 ${user.name.split(' ')[0]}`;
    btn.onclick = () => {
      if (confirm(`Log out, ${user.name}?`)) apiLogout();
    };
  } else {
    btn.textContent = 'Login / Sign Up';
    btn.onclick = () => { window.location.href = 'Login.html'; };
  }
}


document.addEventListener('DOMContentLoaded', updateNavAuthState);
