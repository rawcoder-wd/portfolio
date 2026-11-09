import { useState, useEffect } from 'react';
import Home from './pages/Home';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import './App.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('admin_token'));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // If path starts with /admin
  if (currentPath.startsWith('/admin')) {
    if (!adminToken) {
      return (
        <AdminLogin
          onLoginSuccess={() => setAdminToken(localStorage.getItem('admin_token'))}
          onBackToHome={() => navigateTo('/')}
        />
      );
    }
    return (
      <AdminDashboard
        onLogout={() => {
          localStorage.removeItem('admin_token');
          setAdminToken(null);
        }}
        onBackToHome={() => navigateTo('/')}
      />
    );
  }

  return <Home />;
}

export default App;
