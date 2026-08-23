import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Config } from '../config';

export default function Otp() {
  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  
  const inputRefs = useRef([]);

  // If no phone is passed, redirect to login
  if (!phone) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value !== '' && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length !== 5) {
      setError("Enter a valid 5-digit OTP");
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await axios.post(`${Config.apiBaseUrl}/auth/verify`, { phone, code });
      localStorage.setItem('phone_stored', phone);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Invalid OTP or server error.");
      setOtp(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError('');
    try {
      await axios.post(`${Config.apiBaseUrl}/auth/start`, { phone });
      setTimeLeft(30);
    } catch (err) {
      setError("Unable to resend OTP.");
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <h1 className="title">Verification Code</h1>
      <p className="subtitle">Enter the OTP sent to your Telegram.</p>

      <form onSubmit={handleVerifyOtp} className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              style={{
                width: '60px',
                height: '65px',
                fontSize: '1.5rem',
                textAlign: 'center',
                background: 'var(--bg-input)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          ))}
        </div>
        
        {error && <span className="error-text" style={{ marginBottom: '16px', display: 'block', textAlign: 'center' }}>{error}</span>}

        <div style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-muted)' }}>
          Didn't receive the OTP?{' '}
          <span 
            onClick={handleResend}
            style={{ 
              color: timeLeft > 0 ? 'var(--text-muted)' : 'var(--primary)',
              cursor: timeLeft > 0 ? 'default' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend'}
          </span>
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading || otp.join('').length !== 5}>
          {isLoading ? 'Verifying...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
