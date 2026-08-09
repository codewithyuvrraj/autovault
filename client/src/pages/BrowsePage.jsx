import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, asArray } from '../api.js';
import CarCard from '../components/CarCard.jsx';

const SORTS = [
  ['newest', 'Newest first'],
  ['popular', 'Most viewed'],
  ['price_asc', 'Price: low → high'],
  ['price_desc', 'Price: high → low'],
  ['year_desc', 'Year: newest'],
  ['year_asc', 'Year: oldest'],
];

const FUELS = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const CONDITIONS = ['New', 'Used', 'Certified Pre-Owned'];

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const fuel = params.get('fuel') || '';
  const transmission = params.get('transmission') || '';
  const condition = params.get('condition') || '';
  const featuredOnly = params.get('featured') === '1';
  const sort = params.get('sort') || 'newest';

  useEffect(() => {
    api.listCategories().then((d) => setCategories(asArray(d))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .listCars({ category, q, minPrice, maxPrice, fuel, transmission, condition, featured: featuredOnly ? '1' : '', sort })
      .then((d) => setCars(asArray(d)))
      .catch(() => setCars([]))
      .finally(() => setLoading(false));
  }, [category, q, minPrice, maxPrice, fuel, transmission, condition, featuredOnly, sort]);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value === '' || value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  function clearAll() {
    setParams({}, { replace: true });
  }

  const hasFilters = useMemo(
    () => !!(category || q || minPrice || maxPrice || fuel || transmission || condition || featuredOnly),
    [category, q, minPrice, maxPrice, fuel, transmission, condition, featuredOnly]
  );

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <section className="section" style={{ paddingTop: 44 }}>
      <div className="container">
        <div className="crumbs">
          <a href="/">Home</a> <span className="sep">›</span> <span>Browse Cars</span>
        </div>

        <div className="browse-layout">
          {/* ============ SIDEBAR FILTERS ============ */}
          <aside className="filters">
            <div>
              <h4>Category</h4>
              <div className="filter-group">
                <select className="select" value={category} onChange={(e) => update('category', e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.icon} {c.name} ({c.car_count})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h4>Price range ($)</h4>
              <div className="range-row">
                <input
                  className="input"
                  type="number" min="0" step="1000" placeholder="Min"
                  value={minPrice} onChange={(e) => update('minPrice', e.target.value)}
                />
                <span style={{ color: 'var(--text-faint)' }}>–</span>
                <input
                  className="input"
                  type="number" min="0" step="1000" placeholder="Max"
                  value={maxPrice} onChange={(e) => update('maxPrice', e.target.value)}
                />
              </div>
            </div>

            <div>
              <h4>Fuel type</h4>
              <div className="filter-group">
                {FUELS.map((f) => (
                  <label key={f} className="check-row">
                    <input type="checkbox" checked={fuel === f} onChange={() => update('fuel', fuel === f ? '' : f)} />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4>Transmission</h4>
              <div className="filter-group">
                {TRANSMISSIONS.map((t) => (
                  <label key={t} className="check-row">
                    <input type="checkbox" checked={transmission === t} onChange={() => update('transmission', transmission === t ? '' : t)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4>Condition</h4>
              <div className="filter-group">
                {CONDITIONS.map((c) => (
                  <label key={c} className="check-row">
                    <input type="checkbox" checked={condition === c} onChange={() => update('condition', condition === c ? '' : c)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <label className="check-row" style={{ paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              <input type="checkbox" checked={featuredOnly} onChange={(e) => update('featured', e.target.checked ? '1' : '')} />
              ★ Featured only
            </label>

            {hasFilters && (
              <button className="btn btn-ghost btn-sm btn-block" onClick={clearAll}>✕ Clear all filters</button>
            )}
          </aside>

          {/* ============ RESULTS ============ */}
          <div>
            <div className="sort-bar">
              <div className="count">
                {loading ? 'Loading…' : (
                  <>
                    <strong>{cars.length}</strong> {cars.length === 1 ? 'car' : 'cars'} found
                    {activeCategory ? <> in <strong>{activeCategory.name}</strong></> : null}
                    {q ? <> for “<strong>{q}</strong>”</> : null}
                  </>
                )}
              </div>
              <select className="select sort-select" value={sort} onChange={(e) => update('sort', e.target.value)}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : cars.length === 0 ? (
              <div className="empty">
                <div className="icon">🔍</div>
                <h3>No cars match your filters</h3>
                <p>Try widening your price range or clearing a filter or two.</p>
                <div style={{ marginTop: 18 }}>
                  <button className="btn btn-primary btn-sm" onClick={clearAll}>Clear filters</button>
                </div>
              </div>
            ) : (
              <div className="car-grid">
                {cars.map((car, i) => <CarCard key={car.id} car={car} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
