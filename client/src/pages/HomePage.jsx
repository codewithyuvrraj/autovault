import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, asArray } from '../api.js';
import CarCard from '../components/CarCard.jsx';

export default function HomePage() {
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [stats, setStats] = useState({ cars: 0, categories: 0, cities: 0 });
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const failures = [];
    const fail = () => failures.push(true);
    api.listCategories().then((d) => mounted && setCategories(asArray(d))).catch(fail);
    api.listCars({ featured: '1', sort: 'popular' }).then((d) => mounted && setFeatured(asArray(d))).catch(fail);
    api.listCars({ sort: 'newest' }).then((d) => mounted && setLatest(asArray(d))).catch(fail);
    // If the API is unreachable (e.g. this static site has no backend), tell the user
    // instead of leaving endless spinners.
    const t = setTimeout(() => {
      if (mounted && failures.length) setOffline(true);
    }, 2000);
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (latest.length) {
      setStats({
        cars: latest.length,
        categories: categories.length,
        cities: new Set(latest.map((c) => c.city).filter(Boolean)).size,
      });
    }
  }, [latest, categories]);

  function submitSearch(e) {
    e.preventDefault();
    if (search.trim()) nav(`/browse?q=${encodeURIComponent(search.trim())}`);
    else nav('/browse');
  }

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="container hero-inner">
          <span className="hero-badge reveal"><span className="dot" /> Live marketplace · 15+ cars listed</span>
          <h1 className="reveal" style={{ animationDelay: '80ms' }}>
            Find Your Next <span className="grad">Dream Car</span>
          </h1>
          <p className="reveal" style={{ animationDelay: '160ms' }}>
            Browse sports, sedans, SUVs, luxury rides and more. Publish your own car
            with photos and full details in under two minutes.
          </p>

          <form className="hero-search reveal" style={{ animationDelay: '240ms' }} onSubmit={submitSearch}>
            <input
              placeholder="Search by make, model or city — e.g. Ferrari, Model 3, Miami…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">🔍 Search</button>
          </form>

          <div className="hero-stats reveal" style={{ animationDelay: '320ms' }}>
            <div className="hero-stat"><strong>{stats.cars}+</strong><span>Listings</span></div>
            <div className="hero-stat"><strong>{stats.categories}</strong><span>Categories</span></div>
            <div className="hero-stat"><strong>{stats.cities}+</strong><span>Cities</span></div>
          </div>
        </div>
      </section>

      {offline && (
        <div className="container" style={{ marginTop: 26 }}>
          <div className="alert error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
            <span>⚠️ <strong>Live demo mode:</strong> the API server isn't reachable from this static site, so listings can't load here. Run the app locally or connect the backend to see cars.</span>
            <button
              type="button"
              aria-label="Dismiss notice"
              onClick={() => setOffline(false)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: 4, lineHeight: 1 }}
            >✕</button>
          </div>
        </div>
      )}

      {/* ================= CATEGORIES ================= */}
      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="accent-line" />
              <h2>Browse by Category</h2>
              <p className="sub">From adrenaline-packed sports cars to family SUVs.</p>
            </div>
            <Link to="/categories" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="chips">
            {categories.slice(0, 10).map((c) => (
              <Link key={c.id} to={`/browse?category=${c.slug}`} className="chip">
                <span>{c.icon}</span> {c.name}
                <span style={{ opacity: 0.6, fontWeight: 400 }}>({c.car_count})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="accent-line" />
              <h2>Featured Rides</h2>
              <p className="sub">Hand-picked, show-stopping machines.</p>
            </div>
            <Link to="/browse" className="btn btn-ghost btn-sm">Browse all →</Link>
          </div>
          {featured.length ? (
            <div className="car-grid">
              {featured.map((car, i) => <CarCard key={car.id} car={car} index={i} />)}
            </div>
          ) : (
            <div className="spinner" />
          )}
        </div>
      </section>

      {/* ================= LATEST ================= */}
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="accent-line" />
              <h2>Fresh Listings</h2>
              <p className="sub">Just rolled onto the lot.</p>
            </div>
          </div>
          {latest.length ? (
            <div className="car-grid">
              {latest.slice(0, 8).map((car, i) => <CarCard key={car.id} car={car} index={i} />)}
            </div>
          ) : (
            <div className="spinner" />
          )}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="sec-head" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <span className="accent-line" style={{ marginInline: 'auto', display: 'block' }} />
              <h2>How AutoVault Works</h2>
              <p className="sub">Listing your car takes less time than washing it.</p>
            </div>
          </div>
          <div className="feature-grid">
            {[
              ['📸', 'Snap & Upload', 'Add up to 8 high-quality photos. We store them safely and serve them fast.'],
              ['🗂️', 'Pick a Category', 'Sports, Sedan, SUV, Luxury, Electric and more — your car finds its home instantly.'],
              ['📝', 'Fill the Details', 'Year, mileage, fuel type, transmission, engine, horsepower — specs buyers actually want.'],
              ['🚀', 'Publish in Seconds', 'Your listing goes live immediately for everyone browsing the marketplace.'],
              ['📞', 'Get Contacted', 'Buyers reach you directly through the phone and email on your listing.'],
              ['✨', 'Sell & Move On', 'Deal done? Delete your listing in one click and keep the platform clean.'],
            ].map(([icon, title, desc], i) => (
              <div className="feature-card reveal" key={title} style={{ animationDelay: `${i * 70}ms` }}>
                <div className="f-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div
            style={{
              textAlign: 'center', padding: '54px 30px', borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, rgba(255,90,31,0.14), rgba(255,122,61,0.05)), var(--bg-card)',
              border: '1px solid rgba(255,90,31,0.3)',
            }}
          >
            <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, letterSpacing: '-1px' }}>
              Got a car to sell?
            </h2>
            <p style={{ color: 'var(--text-dim)', margin: '10px auto 26px', maxWidth: 480 }}>
              List it on AutoVault and put it in front of thousands of enthusiasts today.
            </p>
            <Link to="/publish" className="btn btn-primary btn-lg">+ Publish Your Car</Link>
          </div>
        </div>
      </section>
    </>
  );
}
