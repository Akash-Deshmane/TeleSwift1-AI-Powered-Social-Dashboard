import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Config } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If user is already logged in (has phone in storage), redirect to profile.
  // Real app might need a /check_session call here, but we let Profile handle it.
  if (localStorage.getItem('phone_stored')) {
    return <Navigate to="/profile" replace />;
  }

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setError('');
    setIsLoading(true);

    const formattedPhone = `+91${phone}`;

    try {
      await axios.post(`${Config.apiBaseUrl}/auth/start`, { phone: formattedPhone });
      // Pass the phone to the OTP screen via state
      navigate('/otp', { state: { phone: formattedPhone } });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 className="title">Get Message Summaries Swiftly!</h1>
      <p className="subtitle">Sign In to Continue</p>

      <form onSubmit={handleSendOtp} className="glass-panel" style={{ padding: '32px' }}>
        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>
            Phone Number
          </label>
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
          {isLoading ? 'Sending...' : 'Get OTP'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Don't have an account? <span onClick={() => navigate('/register')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>Register here</span>
        </p>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '40px' }}>
        <h3 style={{ fontWeight: 500 }}>Your Chats. Distilled.</h3>
      </div>
    </div>
  );
}
