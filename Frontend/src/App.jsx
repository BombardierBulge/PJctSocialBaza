import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import FollowsPage from './pages/FollowsPage';
import AdminPage from './pages/AdminPage';

// Component for the navigation content to use useNavigate hook
function Navigation() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login'; // Force reload to clear state and prevent white screen
  };

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px'
      }}>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>
          SocialBaza
        </Link>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Search Input */}
          <form onSubmit={(e) => {
            e.preventDefault();
            const q = e.target.search.value;
            if (q) navigate(`/search?q=${q}`);
          }}>
            <input
              name="search"
              placeholder="Search users..."
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </form>

          <Link to="/" style={{ fontWeight: '500' }}>Feed</Link>
          <Link to="/follows" style={{ fontWeight: '500' }}>Follows</Link>

          {user ? (
            <>
              <Link to={`/profile/${user.user_id || user.id}`} style={{ fontWeight: '500' }}>
                @{user.username}
              </Link>
              {user.is_admin && <Link to="/admin" style={{ fontWeight: '500', color: '#7c3aed' }}>Admin Panel</Link>}
              <button
                onClick={handleLogout}
                className="btn"
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  padding: '0.4rem 0.8rem'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ color: 'white' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// Helper to check auth
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Navigation />

      <div className="container" style={{ marginTop: '2rem', paddingBottom: '2rem' }}>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/follows" element={
            <ProtectedRoute>
              <FollowsPage />
            </ProtectedRoute>
          } />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;