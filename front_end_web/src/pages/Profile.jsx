import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, User, Phone } from 'lucide-react';
import { Config } from '../config';

export default function Profile() {
  const navigate = useNavigate();
  const phone = localStorage.getItem('phone_stored');

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');

  if (!phone) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${Config.apiBaseUrl}/teleswift/profile/${phone}`);
        setProfile(response.data);
      } catch (err) {
        setError("Unable to load profile. Session might have expired.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [phone]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axios.post(`${Config.apiBaseUrl}/auth/logout/${phone}`);
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      localStorage.removeItem('phone_stored');
      navigate('/login', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ alignItems: 'center' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-container" style={{ alignItems: 'center' }}>
        <p className="error-text" style={{ fontSize: '1.1rem', marginBottom: '24px' }}>{error}</p>
        <button className="btn-primary" onClick={handleLogout} style={{ width: 'auto' }}>Return to Login</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <div style={{ flex: 1 }}>
        <div style={{ 
          background: 'linear-gradient(to bottom, var(--primary), var(--bg-surface))', 
          padding: '40px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            width: '120px', height: '120px', 
            borderRadius: '50%', 
            background: 'var(--bg-dark)', 
            border: '4px solid white',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            {profile.photo ? (
              <img src={`data:image/jpeg;base64,${profile.photo}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={48} color="var(--primary)" />
            )}
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{profile.username || profile.first_name}</h2>
          
          <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            {profile.subscription_tier} PLAN
          </div>
        </div>

        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <User size={24} color="var(--primary)" />
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>First Name</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{profile.first_name}</p>
            </div>
          </div>
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: 'none' }}>
            <Phone size={24} color="var(--primary)" />
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Phone</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{profile.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
