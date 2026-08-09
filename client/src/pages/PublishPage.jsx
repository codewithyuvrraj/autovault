import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, asArray, API_BASE } from '../api.js';
import { useAuth } from '../auth.jsx';

const EMPTY = {
  make: '', model: '', year: '', price: '', category_id: '', condition: 'Used',
  mileage: '', fuel_type: '', transmission: '', color: '', engine_size: '',
  horsepower: '', seats: '', description: '', seller_name: '', seller_email: '',
  seller_phone: '', city: '', featured: false,
};

export default function PublishPage() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);       // File objects selected
  const [previews, setPreviews] = useState([]); // object URLs
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.listCategories().then((d) => setCategories(asArray(d))).catch(() => {});
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Prefill seller info from the signed-in Google account
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      seller_name: f.seller_name || user.name || '',
      seller_email: f.seller_email || user.email || '',
    }));
  }, [user]);

  function addFiles(list) {
    const accepted = Array.from(list).filter((f) => f.type.startsWith('image/'));
    const room = 8 - files.length;
    if (accepted.length > room) accepted.length = room;
    if (!accepted.length) return;
    setFiles((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.make || !form.model || !form.year || !form.price || !form.category_id || !form.seller_name) {
      setError('Please fill all required fields (marked with *).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== false) fd.append(k, v);
    });
    files.forEach((f) => fd.append('images', f));

    setSubmitting(true);
    try {
      const result = await api.createCar(fd);
      setSuccess(`${result.message} Redirecting…`);
      setTimeout(() => nav(`/cars/${result.id}`), 1200);
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  const year = new Date().getFullYear();

  return (
    <section className="section" style={{ paddingTop: 44 }}>
      <div className="container">
        <div className="crumbs">
          <Link to="/">Home</Link> <span className="sep">›</span> <span>Publish a Car</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <span className="accent-line" style={{ display: 'inline-block' }} />
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px' }}>
            Publish Your Car
          </h1>
          <p style={{ color: 'var(--text-dim)', marginTop: 8 }}>
            Fill in the details, upload up to 8 photos, and go live in seconds.
          </p>
        </div>

        {!user && (
          <div className="form-card" style={{ marginBottom: 20, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>👤 <strong style={{ color: 'var(--text)' }}>Pro tip:</strong> sign in with Google to auto-fill your seller name &amp; email.</span>
            <a href={`${API_BASE}/auth/google`} className="btn btn-google btn-sm">Sign in with Google</a>
          </div>
        )}

        <form className="form-card" onSubmit={handleSubmit}>
          {error && <div className="alert error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}
          {success && <div className="alert success" style={{ marginBottom: 20 }}>✅ {success}</div>}

          <div className="form-grid">
            {/* Car identity */}
            <div className="form-field">
              <label>Make <b>*</b></label>
              <input className="input" placeholder="e.g. Ferrari" value={form.make} onChange={(e) => set('make', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Model <b>*</b></label>
              <input className="input" placeholder="e.g. F8 Tributo" value={form.model} onChange={(e) => set('model', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Year <b>*</b></label>
              <input className="input" type="number" min="1900" max={year + 1} placeholder="e.g. 2023" value={form.year} onChange={(e) => set('year', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Price (USD) <b>*</b></label>
              <input className="input" type="number" min="0" step="500" placeholder="e.g. 45000" value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>

            {/* Category + condition */}
            <div className="form-field">
              <label>Category <b>*</b></label>
              <select className="select" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Condition</label>
              <select className="select" value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                <option>New</option>
                <option>Used</option>
                <option>Certified Pre-Owned</option>
              </select>
            </div>

            {/* Specs */}
            <div className="form-field">
              <label>Mileage</label>
              <input className="input" type="number" min="0" placeholder="e.g. 12000" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Fuel type</label>
              <select className="select" value={form.fuel_type} onChange={(e) => set('fuel_type', e.target.value)}>
                <option value="">Select…</option>
                {['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Hydrogen'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Transmission</label>
              <select className="select" value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                <option value="">Select…</option>
                <option>Automatic</option>
                <option>Manual</option>
                <option>Semi-Automatic</option>
              </select>
            </div>
            <div className="form-field">
              <label>Color</label>
              <input className="input" placeholder="e.g. Rosso Corsa" value={form.color} onChange={(e) => set('color', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Engine size</label>
              <input className="input" placeholder="e.g. 3.9L V8 Twin-Turbo" value={form.engine_size} onChange={(e) => set('engine_size', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Horsepower</label>
              <input className="input" type="number" min="0" placeholder="e.g. 710" value={form.horsepower} onChange={(e) => set('horsepower', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Seats</label>
              <input className="input" type="number" min="1" max="9" placeholder="e.g. 4" value={form.seats} onChange={(e) => set('seats', e.target.value)} />
            </div>
            <div className="form-field">
              <label>City</label>
              <input className="input" placeholder="e.g. Miami, FL" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>

            {/* Description */}
            <div className="form-field full">
              <label>Description</label>
              <textarea
                className="textarea"
                placeholder="Tell buyers about your car — service history, extras, condition, upgrades…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>

            {/* Images */}
            <div className="form-field full">
              <label>Photos (up to 8 · first photo is the cover)</label>
              <div
                className={`upload-zone ${drag ? 'drag' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
              >
                <div className="big">📷</div>
                <strong>Click to upload or drag &amp; drop</strong>
                <p style={{ marginTop: 4, fontSize: 13 }}>JPG, PNG, WEBP, AVIF · up to 8MB each</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                />
              </div>
              {previews.length > 0 && (
                <div className="upload-previews">
                  {previews.map((src, i) => (
                    <div className="preview" key={i}>
                      <img src={src} alt={`preview ${i + 1}`} />
                      {i === 0 && <span className="primary-tag">Cover</span>}
                      <button type="button" className="rm" onClick={() => removeFile(i)} title="Remove">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seller */}
            <div className="form-field">
              <label>Your name <b>*</b></label>
              <input className="input" placeholder="e.g. John Carter" value={form.seller_name} onChange={(e) => set('seller_name', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Phone</label>
              <input className="input" placeholder="e.g. +1 555 010 2030" value={form.seller_phone} onChange={(e) => set('seller_phone', e.target.value)} />
            </div>
            <div className="form-field full">
              <label>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.seller_email} onChange={(e) => set('seller_email', e.target.value)} />
            </div>

            <label className="check-row full" style={{ padding: '6px 2px' }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              ⭐ Feature this listing (show it on the home page)
            </label>

            <div className="form-field full">
              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting}>
                {submitting ? 'Publishing…' : '🚀 Publish Car'}
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, marginTop: 10 }}>
                Your listing goes live instantly and appears in the marketplace.
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
