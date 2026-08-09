import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatMileage } from '../api.js';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80';

export default function CarCard({ car, index = 0 }) {
  const [img, setImg] = useState(car.image_url || FALLBACK_IMG);

  return (
    <Link to={`/cars/${car.id}`} className="car-card reveal" style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}>
      <div className="thumb">
        <img src={img} alt={`${car.make} ${car.model}`} loading="lazy" onError={() => setImg(FALLBACK_IMG)} />
        <div className="badges">
          <span className="badge cat">{car.category_icon} {car.category_name}</span>
          {car.featured ? <span className="badge feat">★ Featured</span> : null}
        </div>
      </div>
      <div className="body">
        <div className="price">{formatPrice(car.price)}</div>
        <div className="title">{car.year} {car.make} {car.model}</div>
        <div className="meta">
          <span>🛞 {car.mileage !== null && car.mileage !== undefined ? formatMileage(car.mileage) : '—'}</span>
          {car.fuel_type ? <span>⛽ {car.fuel_type}</span> : null}
          {car.transmission ? <span>⚙️ {car.transmission}</span> : null}
        </div>
        <div className="foot">
          <span className="location">📍 {car.city || 'Unknown'}</span>
          <span className="badge">{car.condition}</span>
        </div>
      </div>
    </Link>
  );
}
