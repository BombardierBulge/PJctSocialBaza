import React from 'react';
import { useParams } from 'react-router-dom';

function ProfilePage() {
  const { userId } = useParams();

  // DANE PRZYKŁADOWE (Generic)
  const profile = {
    user_id: userId,
    first_name: "Jan",
    last_name: "Kowalski",
    bio: "Pasjonat fotografii i nowych technologii. Lubię pizzę i dobre filmy.",
    location: "Warszawa, Polska",
    website_url: "https://example.com", // Bezpieczny, ogólny link
    avatar_url: "https://via.placeholder.com/150/007bff/ffffff?text=JK", // Generuje obrazek z inicjałami
    last_activity: "2026-01-11T20:00:00"
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      {/* Karta Profilu */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <img 
          src={profile.avatar_url} 
          alt="Avatar" 
          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginRight: '30px', border: '4px solid #f0f0f0' }} 
        />
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem' }}>{profile.first_name} {profile.last_name}</h1>
          <p style={{ color: '#666', marginBottom: '15px' }}>@{profile.user_id} • {profile.location}</p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.4' }}>{profile.bio}</p>
          
          <div style={{ marginTop: '15px' }}>
             <a href={profile.website_url} target="_blank" rel="noreferrer" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
               🌐 Strona WWW
             </a>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Status aktywności</h3>
        <p style={{ marginBottom: 0 }}>Ostatnio widziany: {new Date(profile.last_activity).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default ProfilePage;