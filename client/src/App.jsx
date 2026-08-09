import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './auth.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import CarDetailPage from './pages/CarDetailPage.jsx';
import PublishPage from './pages/PublishPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import AboutPage from './pages/AboutPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    // Block body on purpose: an expression body would RETURN scrollTo's result,
    // which React would then try to call as a cleanup function (destroy error).
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Restore deep links redirected by GitHub Pages' 404.html fallback
    try {
      const redirect = sessionStorage.getItem('autovault:redirect');
      if (redirect && redirect !== pathname) {
        sessionStorage.removeItem('autovault:redirect');
        nav(redirect, { replace: true });
      }
    } catch (e) {
      /* sessionStorage unavailable — ignore */
    }
  }, [pathname]);
  return null;
}

function AuthToast() {
  const { toast } = useAuth();
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed', top: 82, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
        animation: 'reveal 0.3s ease',
      }}
    >
      <div className={`alert ${toast.type}`}>{toast.type === 'success' ? '✅' : '⚠️'} {toast.text}</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <AuthToast />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  );
}
