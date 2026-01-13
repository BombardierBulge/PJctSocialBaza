import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

function FollowsPage() {
  const [follows, setFollows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) return;

    api.get(`/Follow?follower_id=${user.id || user.user_id}`)
      .then(res => {
        setFollows(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load follows.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading follows...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Your Follows</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>People you are following:</p>

      {follows.length === 0 ? (
        <p>You are not following anyone yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {follows.map((follow) => (
            <li key={follow.follow_id || Math.random()} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={follow.followed_avatar ? (follow.followed_avatar.startsWith('http') ? follow.followed_avatar : `${api.defaults.baseURL}${follow.followed_avatar}`) : `/default-avatar.png`}
                alt={follow.followed_name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <Link to={`/profile/${follow.followed_id}`} style={{ fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none', fontSize: '1.1rem' }}>
                  @{follow.followed_name}
                </Link>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                  Followed since {follow.created_at ? new Date(follow.created_at).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FollowsPage;