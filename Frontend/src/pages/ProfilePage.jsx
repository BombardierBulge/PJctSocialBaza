import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function ProfilePage() {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? (currentUser.id || currentUser.user_id) : null;
  const isOwnProfile = currentUser && (currentUserId == userId);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    bio: '',
    location: '',
    website: ''
  });

  // Sekcja interakcji
  const [commentState, setCommentState] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');

  // Synchronizacja formularza edycji
  useEffect(() => {
    if (profileData?.profile && !editingProfile) {
      setEditFormData({
        bio: profileData.profile.bio || '',
        location: profileData.profile.location || '',
        website: profileData.profile.website || ''
      });
    }
  }, [profileData, editingProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    try {
      await api.put('/UserProfile', editFormData, {
        headers: { 'x-user-id': currentUserId }
      });
      setEditingProfile(false);
      fetchProfile(); // Odśwież dane
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    }
  };

  // Logika Pobierania Profilu
  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get(`/UserProfile/${userId}`);
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
  }, [userId, currentUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Handlery Interakcji ---

  const handleFollowToggle = async () => {
    if (!currentUser) { alert("Log in to follow"); return; }
    if (isOwnProfile) return;

    setFollowLoading(true);
    try {
      const res = await api.post('/Follow/toggle', {
        follower_id: currentUserId,
        followed_id: userId
      });
      if (res.data.following !== undefined) {
        setFollowing(res.data.following);
        fetchProfile(); // Odśwież liczniki
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle follow status");
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
      await api.put('/UserProfile/avatar', formData, {
        headers: { 'x-user-id': currentUserId }
      });
      alert("Avatar updated!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Avatar upload failed");
    }
  };

  // Polubienia
  const handleLike = async (postId) => {
    try {
      await api.post('/Like/toggle', {
        post_id: postId,
        user_id: currentUserId
      });
      fetchProfile(); // Odśwież posty (liczniki like)
    } catch (e) {
      console.error("Like error", e);
    }
  };

  // Komentarze
  const toggleCommentSection = (postId) => {
    setCommentState(prev => ({
      ...prev,
      [postId]: { ...prev[postId], show: !prev[postId]?.show }
    }));
  };

  const handleCommentChange = (postId, value) => {
    setCommentState(prev => ({
      ...prev,
      [postId]: { ...prev[postId], content: value }
    }));
  };

  const submitComment = async (postId) => {
    const content = commentState[postId]?.content;
    if (!content || !content.trim()) return;

    try {
      await api.post('/Comment', {
        post_id: postId,
        user_id: currentUserId,
        content: content
      });
      // Reset wejść comments
      setCommentState(prev => ({
        ...prev,
        [postId]: { ...prev[postId], content: '' }
      }));
      fetchProfile();
    } catch (e) {
      console.error("Comment submit error", e);
      alert("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/Comment/${commentId}`, {
        headers: { 'x-user-id': currentUserId }
      });
      fetchProfile();
    } catch (e) {
      console.error("Delete comment error", e);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.comment_id);
    setEditCommentContent(comment.content);
  };

  const saveCommentEdit = async (commentId) => {
    try {
      await api.put(`/Comment/${commentId}`, { content: editCommentContent }, {
        headers: { 'x-user-id': currentUserId }
      });
      setEditingCommentId(null);
      fetchProfile();
    } catch (e) {
      console.error("Edit comment error", e);
      alert("Failed to edit comment");
    }
  };

  // Post Actions (Edit/Delete) - dla Właściciela Profilu (lub Admina)
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/Post/${postId}`, {
        headers: { 'x-user-id': currentUserId }
      });
      fetchProfile();
    } catch (e) {
      alert("Failed to delete post");
    }
  };

  const startEditingPost = (post) => {
    setEditingPostId(post.post_id);
    setEditPostContent(post.content);
  };

  const savePostEdit = async (postId) => {
    try {
      await api.put(`/Post/${postId}`, { content: editPostContent }, {
        headers: { 'x-user-id': currentUserId }
      });
      setEditingPostId(null);
      fetchProfile();
    } catch (e) {
      alert("Post edit error");
    }
  };


  // Funkcje pomocnicze
  const routerSafeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${api.defaults.baseURL}${url}`;
  };

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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Loading profile...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--danger)' }}>{error}</div>;
  if (!profileData || !profileData.user) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>User not found.</div>;

  const { user, profile } = profileData;
  const userPosts = user.posts || [];
  userPosts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Zdjęcie w tle */}
      <div style={{
        height: '200px',
        background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        marginBottom: '-60px'
      }}></div>

      {/* Karta informacyjna */}
      <div className="card" style={{ padding: '0 2rem 2rem 2rem', marginBottom: '2rem', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {/* Header Row */}
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
                {following ? 'Unfollow' : 'Follow'}
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
                    console.error(e);
                  }
                }}
              >
                {user.is_admin ? 'Revoke Admin' : 'Grant Admin'}
              </button>
            )}
          </div>
        </div>

        {/* Details Row */}
        <div style={{ paddingLeft: 'calc(130px + 1.5rem)' }}>
          {isOwnProfile ? (
            <div style={{ marginBottom: '1rem' }}>
              {!editingProfile ? (
                <>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                    {profile?.bio || 'No bio provided.'}
                  </p>
                  <button
                    onClick={() => setEditingProfile(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                  >
                    Edit Profile
                  </button>
                </>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Bio</label>
                    <textarea className="input-field" name="bio" value={editFormData.bio} onChange={handleChange} rows="3" />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Location</label>
                    <input type="text" className="input-field" name="location" value={editFormData.location} onChange={handleChange} placeholder="e.g. Warsaw" />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Website</label>
                    <input type="text" className="input-field" name="website" value={editFormData.website} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={saveProfile}>Save</button>
                    <button className="btn" onClick={() => setEditingProfile(false)} style={{ background: '#e5e7eb', color: '#333' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              {profile?.bio || 'No bio provided.'}
            </p>
          )}

          <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {profile?.location && <span>📍 {profile.location}</span>}
            {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>🔗 Website</a>}
            <span>📅 Joined {new Date(user.created_at || Date.now()).toLocaleDateString('en-US')}</span>
          </div>
        </div>
      </div>

      {/* Statystyki */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userPosts.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Posts</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.follower_count || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Followers</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.following_count || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Following</div>
        </div>
      </div>

      {/* Lista postów użytkownika */}
      <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Posts by {user.username}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {userPosts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
            User has no posts yet.
          </div>
        ) : (
          userPosts.map(post => {
            const isLiked = post.likes && post.likes.some(l => l.user_id == currentUserId);
            const commentSection = commentState[post.post_id] || {};
            const isEditingPost = editingPostId === post.post_id;

            return (
              <div key={post.post_id} className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(post.created_at).toLocaleDateString('en-US')}
                    </div>
                    {/* Edit/Delete Buttons */}
                    {(isOwnProfile || (currentUser && currentUser.is_admin)) && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isOwnProfile && !isEditingPost && (
                          <button onClick={() => startEditingPost(post)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}>Edit</button>
                        )}
                        <button onClick={() => handleDeletePost(post.post_id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}>Delete</button>
                      </div>
                    )}
                  </div>

                  {isEditingPost ? (
                    <div>
                      <textarea className="input-field" value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} rows="3" />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={() => savePostEdit(post.post_id)}>Save</button>
                        <button className="btn" onClick={() => setEditingPostId(null)} style={{ background: '#e5e7eb', color: '#333' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>{renderContent(post.content)}</div>
                  )}
                </div>

                {/* Interakcje */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  padding: '0.75rem 1.5rem',
                  background: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <button
                    onClick={() => handleLike(post.post_id)}
                    style={{
                      background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: isLiked ? '#ef4444' : 'var(--text-muted)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      fontWeight: isLiked ? 'bold' : 'normal'
                    }}
                  >
                    <span>{isLiked ? '❤️' : '🤍'}</span>
                    <span>{post.likes ? post.likes.length : 0} Likes</span>
                  </button>

                  <button
                    onClick={() => toggleCommentSection(post.post_id)}
                    style={{
                      background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: 'var(--text-muted)', fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span>💬</span>
                    <span>{post.comments ? post.comments.length : 0} Comments</span>
                  </button>
                </div>

                {/* Sekcja Komentarzy */}
                {commentSection.show && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: '#fff' }}>
                    {post.comments && post.comments.map(c => {
                      const isCommentOwner = currentUserId && (currentUserId == c.user_id);
                      const isEditingComment = editingCommentId === c.comment_id;

                      return (
                        <div key={c.comment_id} style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <strong>{c.user?.username || 'User'}:</strong>
                              {isEditingComment ? (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <input className="input-field" value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} />
                                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => saveCommentEdit(c.comment_id)}>Save</button>
                                    <button className="btn" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', background: '#ccc', color: '#333' }} onClick={() => setEditingCommentId(null)}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <span> {c.content}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                              {isCommentOwner && !isEditingComment && (
                                <button onClick={() => startEditingComment(c)} style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                              )}
                              {(isCommentOwner || (currentUser && currentUser.is_admin)) && (
                                <button onClick={() => handleDeleteComment(c.comment_id)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ display: 'flex', marginTop: '1rem' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Write a comment..."
                        value={commentSection.content || ''}
                        onChange={(e) => handleCommentChange(post.post_id, e.target.value)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <button className="btn btn-primary" onClick={() => submitComment(post.post_id)}>Send</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProfilePage;