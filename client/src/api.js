// API base. Defaults to the relative /api path (proxied to the backend in dev).
// For a deployed frontend pointed at a hosted API, build with:
//   VITE_API_URL=https://your-api.example.com/api npm run build
//   (include the /api suffix — every request appends /cars, /categories, etc.)
// NOTE: cross-origin auth needs the server to allow the frontend origin with
// credentials (Access-Control-Allow-Credentials) — see server CORS config.
export const API_BASE = (import.meta.env?.VITE_API_URL || '/api').replace(/\/+$/, '');
const CROSS_ORIGIN = API_BASE.startsWith('http');

async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Non-JSON body — e.g. a static host's SPA fallback serving index.html with
    // HTTP 200 for /api/*. Never silently resolve as {}: that turns array
    // responses into objects and crashes pages that call .slice()/.map().
  }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  // Intentional: a 2xx with an empty/non-JSON body is a broken response (HTML
  // fallback, bad proxy) — reject loudly instead of handing pages junk.
  if (data === null) throw new Error(`Unexpected response from server (HTTP ${res.status})`);
  return data;
}

// Static hosts (Netlify/GitHub Pages), proxies and errors can hand back non-array
// bodies for list endpoints. Guarantee arrays so pages can never crash on .map()/.slice().
export const asArray = (data) => (Array.isArray(data) ? data : []);

export const api = {
  // Cars
  listCars(params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return fetch(`${API_BASE}/cars${qs ? `?${qs}` : ''}`).then(handle);
  },
  getCar(id) {
    return fetch(`${API_BASE}/cars/${id}`).then(handle);
  },
  createCar(formData) {
    return fetch(`${API_BASE}/cars`, { method: 'POST', body: formData }).then(handle);
  },
  deleteCar(id) {
    return fetch(`${API_BASE}/cars/${id}`, { method: 'DELETE' }).then(handle);
  },

  // Categories
  listCategories() {
    return fetch(`${API_BASE}/categories`).then(handle);
  },
  createCategory(payload) {
    return fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle);
  },
  deleteCategory(id) {
    return fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' }).then(handle);
  },

  // Auth (Google OAuth session lives in an httpOnly cookie)
  me() {
    return fetch(`${API_BASE}/auth/me`, { credentials: CROSS_ORIGIN ? 'include' : 'same-origin' }).then(handle);
  },
  logout() {
    return fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: CROSS_ORIGIN ? 'include' : 'same-origin' }).then(handle);
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
