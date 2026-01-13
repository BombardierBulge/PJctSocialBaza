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
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Stan komentarzy: { [postId]: { show: boolean, content: string } }
  const [commentState, setCommentState] = useState({});

  const fetchPosts = async () => {
    try {
      const response = await api.get('/Post');
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
        // Dodaj obraz lub ścieżkę do treści
        if (uploadRes.data.path) {
          contentToPost += `\n![Image](${api.defaults.baseURL}${uploadRes.data.path})`;
        }
      }

      await api.post('/Post', {
        user_id: user.id || user.user_id,
        content: contentToPost
      });

      setNewPostContent('');
      setSelectedFile(null);
      fetchPosts();
    } catch (err) {
      alert(`Failed to create post: ${err.message}`);
      console.error("Post creation failed:", err.response ? err.response.data : err);
    } finally {
      setUploading(false);
    }
  };

  // ...

  // Stan edycji komentarza
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // ...

  const handleDeleteComment = async (commentId) => {
    // Usunięto window.confirm
    try {
      await api.delete(`/Comment/${commentId}`, {
        headers: { 'x-user-id': user.id || user.user_id }
      });
      fetchPosts();
    } catch (err) {
      console.error("Failed to delete comment");
    }
  };

  // Stan edycji (Post)
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const startEditing = (post) => {
    setEditingPostId(post.post_id);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const saveEdit = async (postId) => {
    try {
      await api.put(`/Post/${postId}`, {
        content: editContent
      }, {
        headers: { 'x-user-id': user.id || user.user_id }
      });
      setEditingPostId(null);
      fetchPosts();
    } catch (err) {
      alert("Failed to update post");
    }
  };

  const handleDeletePost = async (postId) => {
    // Removed window.confirm
    try {
      await api.delete(`/Post/${postId}`, {
        headers: { 'x-user-id': user.id || user.user_id }
      });
      fetchPosts();
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  // Helper do renderowania treści z obrazami
  const renderContent = (content) => {
    const parts = content.split(/(!\[Image\]\((.*?)\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('http') || part.startsWith('/')) {
        const src = part.startsWith('http') ? part : `${api.defaults.baseURL}${part}`;
        return <img key={i} src={src} alt="Post attachment" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} />;
      }
      if (part === '![Image](' || part === ')') return null;

      // Zwróć null dla samej składni markdowna
      if (part.startsWith('![Image](')) return null;

      return <span key={i}>{part}</span>;
    });
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Loading feed...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--danger)' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>

      {/* Create Post Widget */}
      {user && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '50%', background: 'var(--primary)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0, overflow: 'hidden'
            }}>
              {user.avatarUrl ? (
                <img src={`${api.defaults.baseURL}${user.avatarUrl}`} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src="/default-avatar.png" alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
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

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {posts.map(post => {
          const isMyPost = user && (post.user_id === (user.id || user.user_id));
          const isAdmin = user && user.is_admin;
          const commentSection = commentState[post.post_id] || {};
          const isEditing = editingPostId === post.post_id;

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
                          src={post.user?.avatarUrl ? `${api.defaults.baseURL}${post.user.avatarUrl}` : `/default-avatar.png`}
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
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
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
                  const isLiked = post.likes && user && post.likes.some(l => l.user_id == (user.id || user.user_id));
                  return (
                    <button
                      onClick={() => handleLike(post.post_id)}
                      style={{
                        background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: isLiked ? '#ef4444' : 'var(--text-muted)', // Red if liked
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
                  <span>{post.comments ? post.comments.length : 0} Comments</span>
                </button>
              </div>

              {/* Comment Section */}
              {commentSection.show && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: '#fff' }}>
                  {post.comments && post.comments.map(c => {
                    const isCommentOwner = user && (user.id == c.user_id || user.user_id == c.user_id);
                    // Admin can Delete any comment (but not edit)
                    // Owner can Delete AND Edit

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
                            {/* Edit Button: Only Owner */}
                            {isCommentOwner && !isEditingComment && (
                              <button
                                onClick={() => startEditingComment(c)}
                                style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Edit
                              </button>
                            )}

                            {/* Delete Button: Owner OR Admin */}
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