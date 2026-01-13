import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser || !currentUser.is_admin) {
            navigate('/');
            return;
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Używamy podstawowego routingu użytkownika. Upewnij się, że zwraca is_admin.
            const res = await api.get('/User');
            setUsers(res.data);
        } catch (err) {
            alert('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAdmin = async (user) => {
        // Usunięto potwierdzenie walidacji
        try {
            await api.post('/Admin/toggle', { target_user_id: user.user_id }, {
                headers: { 'x-user-id': currentUser.id || currentUser.user_id }
            });
            fetchUsers();
        } catch (err) {
            console.error('Failed to toggle admin status', err);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={{ padding: '2rem' }}>Loading Admin Panel...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h2>Admin Panel</h2>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="card" style={{ padding: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '0.5rem' }}>ID</th>
                            <th style={{ padding: '0.5rem' }}>Username</th>
                            <th style={{ padding: '0.5rem' }}>Email</th>
                            <th style={{ padding: '0.5rem' }}>Admin?</th>
                            <th style={{ padding: '0.5rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.user_id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={{ padding: '0.5rem' }}>{u.user_id}</td>
                                <td style={{ padding: '0.5rem' }}>{u.username}</td>
                                <td style={{ padding: '0.5rem' }}>{u.email}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    {u.is_admin ? <span style={{ color: 'green', fontWeight: 'bold' }}>YES</span> : 'No'}
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    {u.user_id !== (currentUser.id || currentUser.user_id) && (
                                        <button
                                            className="btn"
                                            onClick={() => handleToggleAdmin(u)}
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            Toggle
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminPage;
