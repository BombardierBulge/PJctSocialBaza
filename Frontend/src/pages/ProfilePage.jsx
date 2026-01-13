import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function ProfilePage() {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  // Obsługa różnic w nazewnictwie id/user_id
  const currentUserId = currentUser ? (currentUser.id || currentUser.user_id) : null;
  const isOwnProfile = currentUser && (currentUserId == userId);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    bio: '',
    location: '',
    website: ''
  });

  // Synchronizacja danych edycji po załadowaniu
  useEffect(() => {
    // Synchronizuj tylko jeśli nie edytujemy, aby nie nadpisywać danych użytkownika
    if (profileData?.profile && !editingProfile) {
      setEditFormData({
        bio: profileData.profile.bio || '',
        location: profileData.profile.location || '',
        website: profileData.profile.website || ''
      });
    }
  }, [profileData, editingProfile]);

  // Obsługa zmian w formularzu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Zapis profilu
  const saveProfile = async () => {
    try {
      await api.put('/UserProfile', editFormData, {
        headers: { 'x-user-id': currentUserId }
      });
      setEditingProfile(false);
      setProfileData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          bio: editFormData.bio,
          location: editFormData.location,
          website: editFormData.website
        }
      }));
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    }
  };

  // Pobieranie danych profilu
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log(`Fetching profile for userId: ${userId}`);
        const response = await api.get(`/UserProfile/${userId}`);
        console.log('Profile data received:', response.data);
        setProfileData(response.data);

        if (currentUserId) {
          const followsRes = await api.get('/Follow');
          const amIFollowing = followsRes.data.some(f =>
            (f.follower_id === currentUserId && f.followed_id == userId)
          );
          setFollowing(amIFollowing);
        }

      } catch (err) {
        console.error("Failed to fetch profile", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUserId]);

  const handleFollowToggle = async () => {
    if (!currentUser) { alert("Login to follow"); return; }
    if (isOwnProfile) return;

    setFollowLoading(true);
    try {
      const res = await api.post('/Follow/toggle', {
        follower_id: currentUserId,
        followed_id: userId
      });
      if (res.data.following !== undefined) {
        setFollowing(res.data.following);
      }
    } catch (err) {
      console.error(err);
      alert("Action failed");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    if (!isOwnProfile || !e.target.files[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.put('/UserProfile/avatar', formData, {
        headers: { 'x-user-id': currentUserId }
      });
      alert("Avatar updated!");
      setProfileData(prev => ({
        ...prev,
        profile: { ...prev.profile, avatarUrl: routerSafeUrl(res.data.avatarUrl) }
      }));
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    }
  };

  // Helper URL
  const routerSafeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${api.defaults.baseURL}${url}`;
  };

  // Renderowanie treści (bezpieczne)
  const renderContent = (content) => {
    if (!content) return null;
    try {
      const parts = content.split(/(!\[Image\]\((.*?)\))/g);
      return parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('http') || part.startsWith('/')) {
          const src = routerSafeUrl(part);
          return <img key={i} src={src} alt="Attachment" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} />;
        }
        if (part.startsWith('![Image](')) return null;
        if (part === '![Image](' || part === ')') return null;
        return <span key={i}>{part}</span>;
      });
    } catch (e) {
      console.error("Render error", e);
      return <span>{content}</span>;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Ładowanie profilu...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--danger)' }}>{error}</div>;
  if (!profileData || !profileData.user) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Nie znaleziono użytkownika.</div>;

  const { user, profile } = profileData;
  const userPosts = user.posts || [];
  // Sortowanie bezpieczne
  userPosts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Cover Image Placeholder */}
      <div style={{
        height: '200px',
        background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        marginBottom: '-60px'
      }}></div>

      {/* Karta Profilu */}
      <div className="card" style={{ padding: '0 2rem 2rem 2rem', marginBottom: '2rem', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={profile?.avatarUrl ? routerSafeUrl(profile.avatarUrl) : `/default-avatar.png`}
                alt="Avatar"
                onClick={() => isOwnProfile && document.getElementById('avatarInput').click()}
                style={{
                  width: '130px', height: '130px',
                  borderRadius: '50%', objectFit: 'cover',
                  border: '4px solid white',
                  marginRight: '1.5rem',
                  backgroundColor: '#fff',
                  cursor: isOwnProfile ? 'pointer' : 'default'
                }}
              />
              {isOwnProfile && <input id="avatarInput" type="file" hidden onChange={handleAvatarUpload} />}
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1 }}>{user.username}</h1>
              <span style={{ color: 'var(--text-muted)' }}>@{user.username}</span>
            </div>
          </div>

          <div style={{ paddingBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
            {!isOwnProfile && (
              <button
                className={`btn ${following ? '' : 'btn-primary'}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
                style={following ? { border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' } : {}}
              >
                {following ? 'Przestań obserwować' : 'Obserwuj'}
              </button>
            )}
            {currentUser && currentUser.is_admin && user.user_id !== currentUserId && (
              <button
                className="btn"
                style={{ background: user.is_admin ? '#ef4444' : '#7c3aed', color: '#fff', marginLeft: '0.5rem' }}
                onClick={async () => {
                  try {
                    await api.post('/Admin/toggle', { target_user_id: user.user_id }, {
                      headers: { 'x-user-id': currentUserId }
                    });
                    window.location.reload();
                  } catch (e) {
                    console.error('Failed to change admin status', e);
                  }
                }}
              >
                {user.is_admin ? 'Odbierz Admina' : 'Nadaj Admina'}
              </button>
            )}
          </div>
        </div>

        <div style={{ paddingLeft: 'calc(130px + 1.5rem)' }}>
          {isOwnProfile ? (
            <div style={{ marginBottom: '1rem' }}>
              {!editingProfile ? (
                <>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                    {profile?.bio || 'Brak wpisu.'}
                  </p>
                  <button
                    onClick={() => setEditingProfile(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                  >
                    Edytuj Profil
                  </button>
                </>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Bio</label>
                    <textarea
                      className="input-field"
                      name="bio"
                      value={editFormData.bio}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Lokalizacja</label>
                    <input
                      type="text"
                      className="input-field"
                      name="location"
                      value={editFormData.location}
                      onChange={handleChange}
                      placeholder="np. Warszawa, Polska"
                    />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Strona WWW</label>
                    <input
                      type="text"
                      className="input-field"
                      name="website"
                      value={editFormData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={saveProfile}>Zapisz</button>
                    <button className="btn" onClick={() => setEditingProfile(false)} style={{ background: '#e5e7eb', color: '#333' }}>Anuluj</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              {profile?.bio || 'Brak wpisu.'}
            </p>
          )}

          <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {profile?.location && <span>📍 {profile.location}</span>}
            {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>🔗 Strona WWW</a>}
            <span>📅 Dołączono {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Statystyki */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userPosts.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Posty</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.follower_count || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Obserwujący</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.following_count || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Obserwuje</div>
        </div>
      </div>

      {/* Posty Użytkownika */}
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Posty użytkownika {user.username}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {userPosts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
            Brak postów.
          </div>
        ) : (
          userPosts.map(post => (
            <div key={post.post_id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {new Date(post.created_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>{renderContent(post.content)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProfilePage;