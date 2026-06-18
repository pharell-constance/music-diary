import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/profile';
import ArtistPage from './pages/ArtistPage';
import AdminDashboard from './pages/AdminDashboard';

// --- LE GARDIEN DE ROUTE (Protected Route) ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// --- GARDIEN POUR LES PAGES PUBLIQUES (Public Only Route) ---
const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// --- GARDIEN POUR LES PAGES ADMIN (Admin Only Route) ---
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!token || !user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    // Initialisation de Lenis pour un smooth scroll performant
    const lenis = new Lenis();

    // Synchronisation de Lenis avec le ticker de GSAP
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Désactiver l'ajustement du lag de GSAP pour une meilleure fluidité avec Lenis
    gsap.ticker.lagSmoothing(0);

    // Nettoyage à la destruction du composant
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <BrowserRouter>
        <Routes>
          {/* L'accueil : présente le site si non connecté, et affiche le journal si connecté */}
          <Route path="/" element={<Home />} />

          {/* Routes d'authentification réservées aux visiteurs non connectés */}
          <Route path="/register" element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          } />
          <Route path="/login" element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/artist/:artistId" element={
            <ProtectedRoute>
              <ArtistPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* Si l'URL n'existe pas, on redirige vers l'accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;