import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { ColorAvatar } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/auth/profile').then(r => setProfile(r.data)).catch(() => {});
    api.get('/users/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const statCard = (label: string, value: string | number, icon: string) => (
    <div style={{ flex: 1, background: 'var(--primary-soft)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--primary)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header card */}
        <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
          <ColorAvatar name={user?.username || 'U'} url={user?.avatarUrl} size={80} idx={0} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.375rem', marginBottom: '0.25rem' }}>{profile?.username || user?.username}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
              {profile?.role || 'Student'} · {profile?.target_language || 'JavaScript'}
            </div>
            {profile?.bio && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{profile.bio}</p>}
            {profile?.email && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>✉ {profile.email}</p>}
          </div>
          <Link to="/settings" className="btn btn-secondary" style={{ flexShrink: 0 }}>Edit Profile</Link>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            {statCard('Overall Progress', `${stats.overallPercent}%`, '📈')}
            {statCard('Day Streak', `${stats.streak} 🔥`, '⚡')}
            {statCard('Weekly XP', `${stats.weeklyXp}`, '⭐')}
            {statCard('Courses', `${stats.enrolledCourses}`, '📚')}
          </div>
        )}

        {/* Joined date */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🗓</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Member since</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
