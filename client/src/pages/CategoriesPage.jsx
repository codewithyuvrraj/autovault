import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚗');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const ICON_CHOICES = ['🚗', '🏎️', '🚙', '👑', '🚘', '🏁', '🌤️', '⚡', '🛻', '📻', '🚜', '🏍️', '🚌', '✈️', '🚀', '🎯'];

  function load() {
    setLoading(true);
    api.listCategories().then(setCategories).catch(() => setCategories([])).finally(() => setLoading(false));
  }

  useEffect(() => {
    load(); // wrapped in a block so the effect doesn't return load()'s Promise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCategory(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!name.trim()) return setError('Category name is required.');
    try {
      await api.createCategory({ name: name.trim(), icon, description: description.trim() });
      setMessage(`Category “${name.trim()}” added!`);
      setName('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCategory(id, name_) {
    if (!window.confirm(`Delete the “${name_}” category? Categories that still have cars can't be deleted.`)) return;
    setError('');
    setMessage('');
    try {
      await api.deleteCategory(id);
      setMessage(`Category deleted.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="section" style={{ paddingTop: 44 }}>
      <div className="container">
        <div className="crumbs">
          <Link to="/">Home</Link> <span className="sep">›</span> <span>Categories</span>
        </div>

        <div className="sec-head">
          <div>
            <span className="accent-line" />
            <h2>Car Categories</h2>
            <p className="sub">Explore every category — or add a new one to the platform.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Category'}
          </button>
        </div>

        {showForm && (
          <form className="form-card" style={{ marginBottom: 34 }} onSubmit={addCategory}>
            <h3 style={{ marginBottom: 18 }}>New category</h3>
            {error && <div className="alert error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
            <div className="form-grid">
              <div className="form-field">
                <label>Name <b>*</b></label>
                <input className="input" placeholder="e.g. Supercar" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Icon</label>
                <div className="chips">
                  {ICON_CHOICES.map((i) => (
                    <button
                      key={i} type="button" className={`chip ${icon === i ? 'active' : ''}`}
                      style={{ padding: '8px 12px', fontSize: 18 }} onClick={() => setIcon(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-field full">
                <label>Description</label>
                <input className="input" placeholder="What makes this category special?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="form-field full">
                <button className="btn btn-primary" type="submit">+ Add category</button>
              </div>
            </div>
          </form>
        )}

        {message && <div className="alert success" style={{ marginBottom: 20 }}>✅ {message}</div>}
        {error && !showForm && <div className="alert error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="cat-grid">
            {categories.map((c, i) => (
              <div className="cat-card reveal" key={c.id} style={{ animationDelay: `${i * 50}ms` }}>
                <Link to={`/browse?category=${c.slug}`} style={{ display: 'block' }}>
                  <span className="icon">{c.icon}</span>
                  <h3>{c.name}</h3>
                  <div className="count">
                    {c.car_count} {c.car_count === 1 ? 'car' : 'cars'} · {c.description || 'Browse listings'}
                  </div>
                  <span className="arrow">→</span>
                </Link>
                {Number(c.car_count) === 0 && (
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: 14, width: '100%' }}
                    onClick={() => removeCategory(c.id, c.name)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
