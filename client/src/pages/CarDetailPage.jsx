import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatPrice, formatMileage, timeAgo } from '../api.js';

export default function CarDetailPage() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setCar(null);
    setError('');
    setActiveImg(0);
    api
      .getCar(id)
      .then((c) => {
        setCar(c);
        setActiveImg(0);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <div className="icon">😕</div>
            <h3>Car not found</h3>
            <p>{error}</p>
            <div style={{ marginTop: 18 }}>
              <Link to="/browse" className="btn btn-primary btn-sm">← Back to browse</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!car) return <div className="spinner" />;

  const images = car.images?.length ? car.images : [{ image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80' }];
  const specs = [
    ['Year', car.year],
    ['Mileage', car.mileage != null ? formatMileage(car.mileage) : '—'],
    ['Fuel', car.fuel_type],
    ['Transmission', car.transmission],
    ['Engine', car.engine_size],
    ['Horsepower', car.horsepower ? `${car.horsepower} HP` : '—'],
    ['Seats', car.seats],
    ['Color', car.color],
    ['Condition', car.condition],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <section className="section" style={{ paddingTop: 44 }}>
      <div className="container">
        <div className="crumbs">
          <Link to="/">Home</Link> <span className="sep">›</span>
          <Link to="/browse">Browse</Link> <span className="sep">›</span>
          <span>{car.year} {car.make} {car.model}</span>
        </div>

        <div className="detail-grid">
          {/* ============ GALLERY ============ */}
          <div className="gallery">
            <div className="gallery-main">
              <img
                src={images[activeImg]?.image_url}
                alt={`${car.make} ${car.model}`}
                style={{ animation: 'fadeIn 0.3s ease' }}
              />
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={i === activeImg ? 'active' : ''}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img.image_url} alt={`Photo ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ============ INFO ============ */}
          <div className="detail-info">
            <span className="badge cat" style={{ marginBottom: 12 }}>{car.category_icon} {car.category_name}</span>
            <h1>{car.year} {car.make} {car.model}</h1>
            <div className="detail-price">{formatPrice(car.price)}</div>
            <div className="subline">📍 {car.city || 'Unknown location'} · listed {timeAgo(car.created_at)} · 👁 {car.views || 0} views</div>

            <div className="specs">
              {specs.map(([k, v]) => (
                <div className="spec" key={k}>
                  <div className="k">{k}</div>
                  <div className="v">{v}</div>
                </div>
              ))}
            </div>

            {car.description && (
              <div className="detail-desc">
                <h3 style={{ color: 'var(--text)', marginBottom: 10, fontSize: 18 }}>Description</h3>
                {car.description}
              </div>
            )}
          </div>
        </div>

        {/* ============ SELLER ============ */}
        <div style={{ marginTop: 30 }}>
          <div className="seller-card">
            <h3>Seller information</h3>
            <div className="seller-row">
              <div className="ic">🧑‍💼</div>
              <div>
                <div className="lbl">Seller</div>
                <div className="val">{car.seller_name}</div>
              </div>
            </div>
            {car.seller_email && (
              <div className="seller-row">
                <div className="ic">✉️</div>
                <div>
                  <div className="lbl">Email</div>
                  <div className="val">
                    <a href={`mailto:${car.seller_email}`} style={{ color: 'var(--accent-strong)' }}>{car.seller_email}</a>
                  </div>
                </div>
              </div>
            )}
            {car.seller_phone && (
              <div className="seller-row">
                <div className="ic">📞</div>
                <div>
                  <div className="lbl">Phone</div>
                  <div className="val">{car.seller_phone}</div>
                </div>
              </div>
            )}
            {car.city && (
              <div className="seller-row">
                <div className="ic">📍</div>
                <div>
                  <div className="lbl">City</div>
                  <div className="val">{car.city}</div>
                </div>
              </div>
            )}
            <div className="verified">✓ Verified listing on AutoVault</div>
          </div>
        </div>

        <div style={{ marginTop: 34, textAlign: 'center' }}>
          <Link to="/browse" className="btn btn-ghost">← Back to all cars</Link>
        </div>
      </div>
    </section>
  );
}
