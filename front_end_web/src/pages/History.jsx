import { useState, useEffect } from 'react';
import axios from 'axios';
import { Config } from '../config';

export default function History() {
  const phone = localStorage.getItem('phone_stored');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${Config.apiBaseUrl}/teleswift/history/${phone}`);
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [phone]);

  if (isLoading) return <div style={{ padding: '40px' }}>Loading history...</div>;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Saved Summaries</h1>
      
      {history.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No summaries saved yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {history.map(item => (
            <div key={item.id} className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.chat_name}</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{item.summary_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
