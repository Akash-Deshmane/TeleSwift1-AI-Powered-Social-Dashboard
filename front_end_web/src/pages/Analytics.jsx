import { useState, useEffect } from 'react';
import axios from 'axios';
import { Config } from '../config';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Analytics() {
  const phone = localStorage.getItem('phone_stored');
  const [data, setData] = useState({ totalSummaries: 0, topChats: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${Config.apiBaseUrl}/teleswift/analytics/${phone}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [phone]);

  if (isLoading) return <div style={{ padding: '40px' }}>Loading analytics...</div>;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '8px' }}>{data.totalSummaries}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Total Summaries Generated</p>
        </div>
        
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: '#10b981', marginBottom: '8px' }}>{(data.totalSummaries * 0.05).toFixed(2)}s</h2>
          <p style={{ color: 'var(--text-muted)' }}>Estimated Time Saved (Hours)</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Most Summarized Chats</h2>
        {data.topChats.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No data yet.</p>
        ) : (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topChats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="chat_name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
