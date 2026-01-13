import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';

function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            setLoading(true);
            api.get(`/User/search/${query}`)
                .then(res => {
                    setResults(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [query]);

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <h2>Search Results for "{query}"</h2>
            {loading && <p>Loading...</p>}
            {!loading && results.length === 0 && <p>No users found.</p>}

            <div style={{ marginTop: '1rem' }}>
                {results.map(user => (
                    <div key={user.user_id} className="card" style={{ marginBottom: '1rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img
                            src={user.avatarUrl ? `${api.defaults.baseURL}${user.avatarUrl}` : '/default-avatar.png'}
                            alt={user.username}
                            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                            <Link to={`/profile/${user.user_id}`} style={{ fontWeight: 'bold', fontSize: '1.1rem', textDecoration: 'none', color: 'var(--text-color)' }}>
                                @{user.username}
                            </Link>
                            {user.bio && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user.bio}</div>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {user.follower_count} followers
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SearchPage;
