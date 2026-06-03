import React, { useEffect, useState } from 'react';
import Layout, { ColorAvatar } from '../components/Layout';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { SkeletonRow } from '../components/Skeleton';

interface Mentor { id: number; username: string; bio: string; avatar_url: string | null; follower_count: number; is_following: number; }

const Mentors: React.FC = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useApp();

  useEffect(() => {
    api.get('/users/mentors').then(r => setMentors(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleFollow = async (mentor: Mentor) => {
    try {
      if (mentor.is_following) {
        await api.delete(`/users/mentors/${mentor.id}/follow`);
        setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, is_following: 0, follower_count: m.follower_count - 1 } : m));
        addToast(`Unfollowed ${mentor.username}`, 'info');
      } else {
        await api.post(`/users/mentors/${mentor.id}/follow`);
        setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, is_following: 1, follower_count: m.follower_count + 1 } : m));
        addToast(`Now following ${mentor.username}! 🎉`, 'success');
      }
    } catch { addToast('Action failed', 'error'); }
  };

  return (
    <Layout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Mentors</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Follow expert mentors to stay up to date with new courses</p>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 0 }}>
          {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {mentors.map((m, i) => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', alignItems: 'center', textAlign: 'center', padding: '1.75rem 1.25rem' }}>
              <ColorAvatar name={m.username} size={64} idx={i % 5} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{m.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.625rem' }}>Mentor</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.bio || 'Expert educator passionate about sharing knowledge.'}</p>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{m.follower_count}</div>
                  <div>Followers</div>
                </div>
              </div>
              <button
                onClick={() => toggleFollow(m)}
                className={m.is_following ? 'btn btn-secondary' : 'btn btn-primary'}
                style={{ width: '100%' }}
              >
                {m.is_following ? '✓ Following' : '+ Follow'}
              </button>
            </div>
          ))}
          {mentors.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
              <p>No mentors found yet.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Mentors;
