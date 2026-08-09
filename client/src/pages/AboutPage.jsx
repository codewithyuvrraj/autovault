import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function AboutPage() {
  const [stats, setStats] = useState({ cars: 0, categories: 0, cities: 0 });

  useEffect(() => {
    api.listCars({ sort: 'newest' }).then((cars) => {
      setStats({
        cars: cars.length,
        categories: 10,
        cities: new Set(cars.map((c) => c.city).filter(Boolean)).size,
      });
    }).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero" style={{ padding: '76px 0 70px' }}>
        <div className="container hero-inner">
          <span className="hero-badge reveal">🏁 About AutoVault</span>
          <h1 className="reveal" style={{ animationDelay: '80ms' }}>
            Built for <span className="grad">Car Lovers</span>
          </h1>
          <p className="reveal" style={{ animationDelay: '160ms' }}>
            AutoVault is a modern, full-stack marketplace for publishing and discovering
            cars — powered by React, Node.js and MySQL.
          </p>
          <div className="hero-stats reveal" style={{ animationDelay: '240ms' }}>
            <div className="hero-stat"><strong>{stats.cars}+</strong><span>Live listings</span></div>
            <div className="hero-stat"><strong>{stats.categories}</strong><span>Categories</span></div>
            <div className="hero-stat"><strong>{stats.cities}+</strong><span>Cities covered</span></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="accent-line" />
              <h2>Why AutoVault?</h2>
              <p className="sub">Everything you need to buy and sell with confidence.</p>
            </div>
          </div>
          <div className="feature-grid">
            {[
              ['📸', 'Rich photo galleries', 'Every listing supports up to 8 photos with a cover image, thumbnails and full-screen browsing on the detail page.'],
              ['🗂️', 'Smart categories', 'Sports, Sedan, SUV, Luxury, Hatchback, Coupe, Convertible, Electric, Truck and Classic — add your own anytime.'],
              ['🔍', 'Powerful search & filters', 'Filter by category, price range, fuel type, transmission and condition, then sort by price, year or popularity.'],
              ['⚡', 'Real-time publishing', 'Submit the form and your car is live in the marketplace immediately — no approval queues.'],
              ['📊', 'Structured MySQL data', 'A clean relational schema with categories, cars and images keeps everything fast and queryable.'],
              ['📱', 'Beautiful on every screen', 'A responsive dark theme tuned for desktop, tablet and phone, with smooth micro-interactions throughout.'],
            ].map(([icon, title, desc], i) => (
              <div className="feature-card reveal" key={title} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="f-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container">
          <div
            style={{
              textAlign: 'center', padding: '50px 30px', borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, rgba(255,90,31,0.14), rgba(255,122,61,0.05)), var(--bg-card)',
              border: '1px solid rgba(255,90,31,0.3)',
            }}
          >
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, letterSpacing: '-1px' }}>
              Ready to join the garage?
            </h2>
            <p style={{ color: 'var(--text-dim)', margin: '10px auto 24px', maxWidth: 460 }}>
              Start browsing the lot or put your own car up for sale — it takes two minutes.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/browse" className="btn btn-ghost btn-lg">Browse cars</Link>
              <Link to="/publish" className="btn btn-primary btn-lg">+ Publish a car</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
