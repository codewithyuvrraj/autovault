import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, asArray, API_BASE, formatPrice, formatMileage } from './api.js';

const realFetch = global.fetch;

function mockFetch(impl) {
  global.fetch = impl;
}
function restoreFetch() {
  global.fetch = realFetch;
}
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}
function htmlResponse(status = 200) {
  return new Response('<!doctype html><html>SPA fallback</html>', {
    status,
    headers: { 'Content-Type': 'text/html' },
  });
}

// ---------- asArray ----------
test('asArray passes real arrays through unchanged', () => {
  const arr = [{ id: 1 }, { id: 2 }];
  assert.equal(asArray(arr), arr);
});

test('asArray converts non-arrays to [] (the crash that used to happen)', () => {
  assert.deepEqual(asArray({ error: 'boom' }), []);
  assert.deepEqual(asArray('html'), []);
  assert.deepEqual(asArray(null), []);
  assert.deepEqual(asArray(undefined), []);
  assert.deepEqual(asArray(42), []);
});

// ---------- handle(): success paths ----------
test('listCars resolves with the parsed array on a normal 200', async () => {
  mockFetch(async () => jsonResponse([{ id: 1, make: 'Ferrari' }]));
  const cars = await api.listCars();
  assert.equal(cars.length, 1);
  assert.equal(cars[0].make, 'Ferrari');
  restoreFetch();
});

test('listCars drops empty params from the query string', async () => {
  let captured = '';
  mockFetch(async (url) => {
    captured = String(url);
    return jsonResponse([]);
  });
  await api.listCars({ category: '', q: '', minPrice: '5000', sort: 'newest' });
  assert.ok(captured.includes('/api/cars?'), `url was: ${captured}`);
  assert.ok(captured.includes('minPrice=5000'), `url was: ${captured}`);
  assert.ok(captured.includes('sort=newest'), `url was: ${captured}`);
  assert.ok(!captured.includes('category='), `empty params must be dropped: ${captured}`);
  assert.ok(!captured.includes('q='), `empty params must be dropped: ${captured}`);
  restoreFetch();
});

// ---------- handle(): the exact Netlify crash scenario ----------
test('non-JSON body with HTTP 200 (SPA fallback) rejects instead of resolving {}', async () => {
  mockFetch(async () => htmlResponse(200)); // old Netlify: index.html + 200
  await assert.rejects(() => api.listCategories(), /Unexpected response/);
  restoreFetch();
});

test('listCategories never resolves a non-array after a broken response', async () => {
  mockFetch(async () => htmlResponse(200));
  let resolved = 'unset';
  let rejected = false;
  await api.listCategories().then(
    (d) => { resolved = JSON.stringify(d); },
    () => { rejected = true; }
  );
  assert.equal(rejected, true, 'broken responses must reject, not resolve');
  assert.equal(resolved, 'unset');
  restoreFetch();
});

// ---------- handle(): error responses ----------
test('error response surfaces the server error message', async () => {
  mockFetch(async () => jsonResponse({ error: 'Car not found' }, 404));
  await assert.rejects(() => api.getCar(999), /Car not found/);
  restoreFetch();
});

test('error response without a JSON body falls back to a status message', async () => {
  mockFetch(async () => htmlResponse(500));
  await assert.rejects(() => api.listCars(), /Request failed \(500\)/);
  restoreFetch();
});

test('unauthenticated /me rejects (401) so the auth context can clear the user', async () => {
  mockFetch(async () => jsonResponse({ user: null }, 401));
  await assert.rejects(() => api.me(), /Request failed \(401\)/);
  restoreFetch();
});

// ---------- base / credentials ----------
test('API_BASE defaults to /api (relative) when VITE_API_URL is unset', () => {
  assert.equal(API_BASE, '/api');
});

test('logout sends credentials same-origin for the relative base', async () => {
  let opts = null;
  mockFetch(async (url, o) => {
    opts = o;
    return jsonResponse({ ok: true });
  });
  await api.logout();
  assert.equal(opts.credentials, 'same-origin');
  assert.equal(opts.method, 'POST');
  restoreFetch();
});

// ---------- formatters ----------
test('formatPrice formats USD with no decimals', () => {
  assert.equal(formatPrice(295000), '$295,000');
  assert.equal(formatPrice('89000'), '$89,000');
  assert.equal(formatPrice(undefined), '$0');
});

test('formatMileage adds thousands separators and mi suffix', () => {
  assert.equal(formatMileage(8200), '8,200 mi');
  assert.equal(formatMileage(0), '0 mi');
});
