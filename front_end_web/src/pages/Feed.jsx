import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Config } from '../config';
import { Sparkles, Bookmark, MessageSquare, Send, AlertCircle, RefreshCw, LogIn } from 'lucide-react';

export default function Feed() {
  const navigate = useNavigate();
  const phone = localStorage.getItem('phone_stored');

  const [dialogs, setDialogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  
  const [summarizingId, setSummarizingId] = useState(null);
  const [activeSummary, setActiveSummary] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Chatting state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!phone) return;
    setIsLoading(true);
    setError('');
    setIsSessionExpired(false);

    try {
      const res = await axios.get(`${Config.apiBaseUrl}/teleswift/dialogs/${phone}`);
      setDialogs(res.data || []);
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      const isAuth = err.response?.status === 401 ||
                     detail.toLowerCase().includes("session") ||
                     detail.toLowerCase().includes("unauthorized") ||
                     detail.toLowerCase().includes("unregistered") ||
                     detail.toLowerCase().includes("auth_key");

      if (isAuth) {
        setIsSessionExpired(true);
        setError("Your Telegram session has expired or is invalid. Please sign in again.");
      } else if (!err.response || err.code === 'ERR_NETWORK') {
        setError(`Unable to connect to the backend server (${Config.apiBaseUrl}). Please verify that your backend server is running.`);
      } else {
        setError(detail || "Failed to load chats from Telegram. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // If there is no phone stored in localStorage, redirect immediately to login
  if (!phone) {
    return <Navigate to="/login" replace />;
  }

  const handleRelogin = () => {
    localStorage.removeItem('phone_stored');
    navigate('/login', { replace: true });
  };

  const handleSummarize = async (chat) => {
    setSummarizingId(chat.id);
    setActiveSummary(null);
    setIsSaved(false);
    try {
      const res = await axios.post(`${Config.apiBaseUrl}/teleswift/summarize/${phone}`, {
        chatId: chat.id,
        chatName: chat.name
      });
      setActiveSummary({ chatName: chat.name, text: res.data.summary, originalLength: res.data.originalLength });
    } catch (err) {
      if (err.response?.status === 401) {
        handleRelogin();
      } else {
        alert(err.response?.data?.detail || "Failed to summarize.");
      }
    } finally {
      setSummarizingId(null);
    }
  };

  const handleSaveSummary = async () => {
    if (!activeSummary) return;
    setIsSaving(true);
    try {
      await axios.post(`${Config.apiBaseUrl}/teleswift/save-summary/${phone}`, {
        chatName: activeSummary.chatName,
        originalLength: activeSummary.originalLength,
        summaryText: activeSummary.text
      });
      setIsSaved(true);
    } catch (err) {
      alert("Failed to save summary.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async (chatId) => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      await axios.post(`${Config.apiBaseUrl}/teleswift/send-message/${phone}`, {
        chatId,
        text: replyText
      });
      setReplyText('');
      setReplyingToId(null);
      alert("Message sent successfully!");
    } catch (err) {
      if (err.response?.status === 401) {
        handleRelogin();
      } else {
        alert(err.response?.data?.detail || "Failed to send message.");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your Telegram chats...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in" style={{ padding: '20px 0' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Your Feed</h1>
        <div className="card glass-panel" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', padding: '32px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '16px' }}>
            <AlertCircle size={40} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'white' }}>Unable to Load Chats</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={fetchChats}
              className="btn-secondary"
              style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <button
              onClick={handleRelogin}
              className="btn-primary"
              style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: isSessionExpired ? '#ef4444' : 'var(--primary)' }}
            >
              <LogIn size={16} />
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Your Feed</h1>
        <button
          onClick={fetchChats}
          className="btn-secondary"
          style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
      
      {activeSummary && (
        <div className="card" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))', borderColor: 'var(--primary)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles color="var(--primary)" />
            <h2 style={{ fontSize: '1.2rem' }}>AI Summary: {activeSummary.chatName}</h2>
          </div>
          <p style={{ lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{activeSummary.text}</p>
          <button 
            onClick={handleSaveSummary}
            disabled={isSaving || isSaved}
            className="btn-primary"
            style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: isSaved ? '#10b981' : 'var(--primary)', color: 'white' }}
          >
            <Bookmark size={16} />
            {isSaved ? 'Saved to History' : isSaving ? 'Saving...' : 'Save Summary'}
          </button>
        </div>
      )}

      {dialogs.length === 0 ? (
        <div className="card glass-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '16px' }}>
            No recent chats or groups found on this Telegram account.
          </p>
          <button
            onClick={fetchChats}
            className="btn-primary"
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <RefreshCw size={16} />
            Check Again
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {dialogs.map(chat => (
            <div key={chat.id} className="card" style={{ padding: '16px 24px', margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {chat.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {chat.message || "No recent messages"}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setReplyingToId(replyingToId === chat.id ? null : chat.id)}
                    className="btn-secondary" 
                    style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <MessageSquare size={16} />
                    Reply
                  </button>
                  <button 
                    onClick={() => handleSummarize(chat)}
                    disabled={summarizingId === chat.id}
                    className="btn-primary" 
                    style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Sparkles size={16} />
                    {summarizingId === chat.id ? 'Summarizing...' : 'Summarize'}
                  </button>
                </div>
              </div>

              {/* Quick Reply Dropdown */}
              {replyingToId === chat.id && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Message ${chat.name}...`}
                    className="input-field"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage(chat.id);
                    }}
                  />
                  <button 
                    onClick={() => handleSendMessage(chat.id)}
                    disabled={isSending || !replyText.trim()}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981' }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
