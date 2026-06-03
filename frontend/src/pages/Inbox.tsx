import React, { useEffect, useState } from 'react';
import Layout, { ColorAvatar } from '../components/Layout';
import api from '../services/api';

interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  body: string;
  read: number;
  created_at: string;
  from_username: string;
}

const Inbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    api.get('/users/inbox').then(res => setMessages(res.data)).catch(() => {});
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem' }}>Inbox</h2>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {messages.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Your inbox is empty.
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={msg.id} style={{ display: 'flex', gap: '1.25rem', padding: '1.5rem', borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none', background: msg.read ? 'transparent' : 'rgba(108,92,231,0.03)' }}>
              <ColorAvatar name={msg.from_username} size={42} idx={msg.from_user_id} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{msg.from_username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {msg.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Inbox;
