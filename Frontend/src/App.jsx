import React from 'react';
// Upewnij się, że te importy pasują do nazw Twoich plików w folderze pages!
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import FollowsPage from './pages/FollowsPage';

function App() {
  return (
    <Router>
      {/* Pasek nawigacji widoczny zawsze na górze */}
      <nav style={{ padding: '15px', background: '#333', color: 'white', marginBottom: '20px' }}>
        <Link to="/" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Strona Główna</Link>
        <Link to="/profile/1" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Mój Profil</Link>
        <Link to="/follows" style={{ color: 'white', marginRight: '15px', textDecoration: 'none' }}>Followy</Link>
        <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Logowanie</Link>
      </nav>

      {/* Tu wyświetlają się podstrony */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/follows" element={<FollowsPage />} />
      </Routes>
    </Router>
  );
}

export default App;