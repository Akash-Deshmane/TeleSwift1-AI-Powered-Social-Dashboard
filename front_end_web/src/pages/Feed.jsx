import { useState, useEffect } from 'react';
import axios from 'axios';
import { Config } from '../config';
import { Sparkles, Bookmark, MessageSquare, Send } from 'lucide-react';

export default function Feed() {
  const phone = localStorage.getItem('phone_stored');
  const [dialogs, setDialogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [summarizingId, setSummarizingId] = useState(null);
  const [activeSummary, setActiveSummary] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Chatting state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${Config.apiBaseUrl}/teleswift/dialogs/${phone}`);
        setDialogs(res.data);
      } catch (err) {
        if (err.response?.data?.detail?.includes("Session not found") || err.response?.data?.detail?.includes("unauthorized")) {
          localStorage.removeItem('phone_stored');
          window.location.href = '/login';
        } else {
          setError("Failed to load chats.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, [phone]);

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
      alert(err.response?.data?.detail || "Failed to summarize.");
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
      alert(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div style={{ padding: '40px' }}>Loading your chats...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>{error}</div>;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Your Feed</h1>
      
      {activeSummary && (
        <div className="card" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))', borderColor: 'var(--primary)' }}>
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
    </div>
  );
}
