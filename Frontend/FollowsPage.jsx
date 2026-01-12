import React from 'react';

function FollowsPage() {
  // DANE PRZYKŁADOWE (Generic)
  const follows = [
    { id: 1, follower_name: "Anna Nowak", followed_name: "Jan Kowalski", date: "2026-01-10" },
    { id: 2, follower_name: "Piotr Zieliński", followed_name: "Anna Nowak", date: "2026-01-11" },
    { id: 3, follower_name: "Admin Systemu", followed_name: "Jan Kowalski", date: "2026-01-09" },
    { id: 4, follower_name: "Kasia_Design", followed_name: "Piotr Zieliński", date: "2026-01-08" },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Lista Obserwacji</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Użytkownicy, których obserwujesz:</p>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {follows.map((follow) => (
          <li key={follow.id} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{follow.follower_name}</span>
              <span style={{ margin: '0 8px', color: '#888', fontSize: '0.9em' }}>obserwuje</span>
              <span style={{ fontWeight: 'bold', color: '#007bff' }}>{follow.followed_name}</span>
            </div>
            <div style={{ fontSize: '0.75em', color: '#aaa' }}>
              {follow.date}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FollowsPage;