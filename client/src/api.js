const BASE = '/api';

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Cars
  listCars(params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return fetch(`${BASE}/cars${qs ? `?${qs}` : ''}`).then(handle);
  },
  getCar(id) {
    return fetch(`${BASE}/cars/${id}`).then(handle);
  },
  createCar(formData) {
    return fetch(`${BASE}/cars`, { method: 'POST', body: formData }).then(handle);
  },
  deleteCar(id) {
    return fetch(`${BASE}/cars/${id}`, { method: 'DELETE' }).then(handle);
  },

  // Categories
  listCategories() {
    return fetch(`${BASE}/categories`).then(handle);
  },
  createCategory(payload) {
    return fetch(`${BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle);
  },
  deleteCategory(id) {
    return fetch(`${BASE}/categories/${id}`, { method: 'DELETE' }).then(handle);
  },

  // Auth (Google OAuth session lives in an httpOnly cookie)
  me() {
    return fetch(`${BASE}/auth/me`, { credentials: 'same-origin' }).then(handle);
  },
  logout() {
    return fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'same-origin' }).then(handle);
  },
};

export function formatPrice(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

export function formatMileage(n) {
  return `${Number(n || 0).toLocaleString()} mi`;
}

export function timeAgo(dateStr) {
  // MySQL returns 'YYYY-MM-DD HH:MM:SS' (no timezone). Replace the space with 'T'
  // so every browser (including Safari) parses it as a local-time date.
  const parsed = new Date(String(dateStr || '').replace(' ', 'T'));
  const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
