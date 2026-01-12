import React, { useState } from 'react';

function HomePage() {
  // DANE PRZYKŁADOWE (Generic)
  const [posts] = useState([
    {
      post_id: 1,
      user_id: 101,
      username: "CoffeeLover",
      content: "Dzień dobry! Nie ma to jak poranna kawa na dobry start tygodnia. ☕ #morning #coffee",
      created_at: "2026-01-11T08:30:00",
      likes: 42
    },
    {
      post_id: 2,
      user_id: 102,
      username: "TechGuru",
      content: "Właśnie testuję nową bibliotekę w React. Zapowiada się obiecująco! Ktoś już używał?",
      created_at: "2026-01-11T14:15:00",
      likes: 15
    },
    {
      post_id: 3,
      user_id: 103,
      username: "Podróżnik_PL",
      content: "Pozdrowienia z gór! Pogoda idealna na trekking. 🏔️",
      created_at: "2026-01-10T16:00:00",
      likes: 128
    }
  ]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Tablica Postów</h1>
      
      {posts.map(post => (
        <div key={post.post_id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '30px', height: '30px', background: '#eee', borderRadius: '50%', marginRight: '10px' }}></div>
            @{post.username}
          </div>
          <p style={{ fontSize: '1.1em', margin: '10px 0', lineHeight: '1.5' }}>
            {post.content}
          </p>
          <div style={{ fontSize: '0.8em', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <span style={{ cursor: 'pointer' }}>❤️ {post.likes}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default HomePage;