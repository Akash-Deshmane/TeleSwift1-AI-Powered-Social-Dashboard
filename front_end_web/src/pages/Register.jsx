import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Config } from '../config';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (localStorage.getItem('phone_stored')) {
    return <Navigate to="/profile" replace />;
  }

  const handleRegisterStart = async (e) => {
    e.preventDefault();
    if (!username || !email || !phone || phone.length !== 10) {
      setError("Please fill all fields and enter a valid 10-digit phone number");
      return;
    }

    setError('');
    setIsLoading(true);

    const formattedPhone = `+91${phone}`;

    try {
      await axios.post(`${Config.apiBaseUrl}/auth/register-start`, { 
        phone: formattedPhone,
        email,
        username
      });
      navigate('/otp', { state: { phone: formattedPhone } });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 className="title" style={{ fontSize: '2rem' }}>Create an Account</h1>
      <p className="subtitle" style={{ marginBottom: '24px' }}>Join TeleSwift to summarize your chats.</p>

      <form onSubmit={handleRegisterStart} className="glass-panel" style={{ padding: '32px' }}>
        
        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Phone Number</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ padding: '16px', color: 'var(--text-muted)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>+91</span>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              placeholder="Enter your phone number"
              style={{ flex: 1, background: 'transparent', border: 'none', padding: '16px', color: 'white', fontSize: '1.1rem', outline: 'none' }}
            />
          </div>
          {error && <span className="error-text">{error}</span>}
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Sending OTP...' : 'Register'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>Login here</span>
        </p>
      </div>
    </div>
  );
}
