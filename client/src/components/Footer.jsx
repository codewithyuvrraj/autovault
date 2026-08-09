import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand">
              <span className="logo">🏎️</span>
              <span>Auto<em>Vault</em></span>
            </Link>
            <p className="about-txt" style={{ marginTop: 14 }}>
              The modern marketplace for buying and selling cars. Publish your ride in
              minutes, reach real buyers, and browse a curated collection by category.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/browse">Browse all cars</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/publish">Publish a car</Link>
          </div>
          <div>
            <h4>Categories</h4>
            <Link to="/browse?category=sports">Sports</Link>
            <Link to="/browse?category=suv">SUV</Link>
            <Link to="/browse?category=luxury">Luxury</Link>
            <Link to="/browse?category=electric">Electric</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About us</Link>
            <Link to="/about">How it works</Link>
            <Link to="/publish">Sell your car</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AutoVault. Built with React + Node + MySQL.</span>
          <span>Drive safe, drive fast. 🏁</span>
        </div>
      </div>
    </footer>
  );
}
