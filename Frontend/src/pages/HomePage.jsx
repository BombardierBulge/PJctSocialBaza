import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Stan użytkownika
  const user = JSON.parse(localStorage.getItem('user'));
  // Obsługa różnic w nazewnictwie id/user_id
  const currentUserId = user ? (user.id || user.user_id) : null;

  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Stan komentarzy i edycji
  const [commentState, setCommentState] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');

  const fetchPosts = async () => {
    try {
      const response = await api.get('/Post');
      // Sortowanie postów: Najnowsze na górze
      const sortedPosts = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sortedPosts);
    } catch (err) {
      console.error("Failed to fetch posts", err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if ((!newPostContent.trim() && !selectedFile) || !user) return;

    setUploading(true);
    try {
      let contentToPost = newPostContent;

      // Prześlij plik jeśli istnieje
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/upload', formData);
        if (uploadRes.data.path) {
          contentToPost += `\n![Image](${api.defaults.baseURL}${uploadRes.data.path})`;
        }
      }

      await api.post('/Post', {
        user_id: currentUserId,
        content: contentToPost
      });

      setNewPostContent('');
      setSelectedFile(null);
      fetchPosts();
    } catch (err) {
      alert(`Failed to create post: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // --- Handlery Interakcji ---

  const handleLike = async (postId) => {
    if (!user) return;
    try {
      await api.post('/Like/toggle', {
        post_id: postId,
        user_id: currentUserId
      });
      fetchPosts(); // Odśwież widok
    } catch (e) {
      console.error("Like error", e);
    }
  };

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
      // Reset pola
      setCommentState(prev => ({
        ...prev,
        [postId]: { ...prev[postId], content: '' }
      }));
      fetchPosts();
    } catch (e) {
      console.error("Comment submit error", e);
    }
  };

  const startEditing = (post) => {
    setEditingPostId(post.post_id);
    setEditPostContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditPostContent('');
  };

  const saveEdit = async (postId) => {
    try {
      await api.put(`/Post/${postId}`, {
        content: editPostContent
      }, {
        headers: { 'x-user-id': currentUserId }
      });
      setEditingPostId(null);
      fetchPosts();
    } catch (err) {
      alert("Failed to update post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete post?")) return;
    try {
      await api.delete(`/Post/${postId}`, {
        headers: { 'x-user-id': currentUserId }
      });
      fetchPosts();
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  // Komentarze - Edycja/Usuwanie
  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/Comment/${commentId}`, {
        headers: { 'x-user-id': currentUserId }
      });
      fetchPosts();
    } catch (e) {
      console.error(e);
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
      fetchPosts();
    } catch (e) {
      console.error(e);
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
          return <img key={i} src={src} alt="Post attachment" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} />;
        }
        if (part.startsWith('![Image](')) return null;
        if (part === '![Image](' || part === ')') return null;
        return <span key={i}>{part}</span>;
      });
    } catch (e) {
      console.error(e);
      return <span>{content}</span>;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Loading feed...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--danger)' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Widget tworzenia posta */}
      {user && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '50%', background: 'var(--primary)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0, overflow: 'hidden'
            }}>
              <img
                src={user.avatarUrl ? routerSafeUrl(user.avatarUrl) : "/default-avatar.png"}
                alt="Me"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                className="input-field"
                rows="3"
                placeholder={`What's on your mind, ${user.username}?`}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                style={{ resize: 'none', marginBottom: '1rem', border: 'none', background: '#f9fafb' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ fontSize: '0.9rem' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleCreatePost}
                  disabled={uploading || (!newPostContent.trim() && !selectedFile)}
                  style={{ opacity: (uploading) ? 0.7 : 1 }}
                >
                  {uploading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista postów */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {posts.map(post => {
          const isMyPost = user && (post.user_id === currentUserId);
          const isAdmin = user && user.is_admin;
          const commentSection = commentState[post.post_id] || {};
          const isEditing = editingPostId === post.post_id;

          const postComments = post.comments || [];

          return (
            <div key={post.post_id} className="card" style={{ padding: '0' }}>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        width: '48px', height: '48px',
                        borderRadius: '50%', background: '#e5e7eb',
                        marginRight: '1rem', overflow: 'hidden'
                      }}>
                        <img
                          src={post.user?.avatarUrl ? routerSafeUrl(post.user.avatarUrl) : `/default-avatar.png`}
                          alt="Avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </Link>
                    <div>
                      <Link to={`/profile/${post.user_id}`} style={{ fontWeight: '600', color: 'var(--text-main)', textDecoration: 'none' }}>
                        {post.user?.username || 'Unknown User'}
                      </Link>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isMyPost && !isEditing && (
                      <button
                        onClick={() => startEditing(post)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        Edit
                      </button>
                    )}
                    {(isMyPost || isAdmin) && (
                      <button
                        onClick={() => handleDeletePost(post.post_id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      className="input-field"
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      rows="3"
                      style={{ marginBottom: '1rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={cancelEditing} style={{ background: '#e5e7eb', color: '#333' }}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => saveEdit(post.post_id)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '1rem', color: 'var(--text-main)' }}>
                    {renderContent(post.content)}
                  </div>
                )}
              </div>

              <div style={{
                borderTop: '1px solid var(--border-color)',
                padding: '0.75rem 1.5rem',
                background: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                {(() => {
                  const isLiked = post.likes && user && post.likes.some(l => l.user_id == currentUserId);
                  return (
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
                  );
                })()}

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
                  <span>{postComments.length} Comments</span>
                </button>
              </div>

              {/* Sekcja komentarzy */}
              {commentSection.show && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: '#fff' }}>
                  {postComments.map(c => {
                    const isCommentOwner = user && (currentUserId == c.user_id);
                    const isEditingComment = editingCommentId === c.comment_id;

                    return (
                      <div key={c.comment_id} style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <strong>{c.user?.username || 'Unknown'}:</strong>
                            {isEditingComment ? (
                              <div style={{ marginTop: '0.4rem' }}>
                                <input
                                  className="input-field"
                                  value={editCommentContent}
                                  onChange={(e) => setEditCommentContent(e.target.value)}
                                />
                                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                                  <button className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => saveCommentEdit(c.comment_id)}>Save</button>
                                  <button className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', background: '#e5e7eb', color: '#333' }} onClick={() => setEditingCommentId(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <span> {c.content}</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginLeft: '1rem' }}>
                            {isCommentOwner && !isEditingComment && (
                              <button
                                onClick={() => startEditingComment(c)}
                                style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Edit
                              </button>
                            )}
                            {(isAdmin || isCommentOwner) && (
                              <button
                                onClick={() => handleDeleteComment(c.comment_id)}
                                style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Delete
                              </button>
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
        })}
      </div>
    </div>
  );
}

export default HomePage;