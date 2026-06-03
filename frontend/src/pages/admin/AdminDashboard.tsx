import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <Layout rightPanel={false}><p>Loading stats...</p></Layout>;

  return (
    <Layout rightPanel={false}>
      <div style={{ marginBottom: '3rem', animation: 'fadeIn 0.4s ease-out' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Overview of platform statistics and key metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', animation: 'fadeInUp 0.5s ease-out' }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#6c5ce7', bg: 'linear-gradient(135deg, rgba(108,92,231,0.1) 0%, rgba(108,92,231,0.05) 100%)' },
          { label: 'Mentors', value: stats.totalMentors, icon: '🎓', color: '#0984e3', bg: 'linear-gradient(135deg, rgba(9,132,227,0.1) 0%, rgba(9,132,227,0.05) 100%)' },
          { label: 'Total Courses', value: stats.totalCourses, icon: '📚', color: '#00b894', bg: 'linear-gradient(135deg, rgba(0,184,148,0.1) 0%, rgba(0,184,148,0.05) 100%)' },
          { label: 'Total Enrollments', value: stats.totalEnrollments, icon: '🔥', color: '#e17055', bg: 'linear-gradient(135deg, rgba(225,112,85,0.1) 0%, rgba(225,112,85,0.05) 100%)' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '2rem', background: 'white', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.08)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.03)'; }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '1.5rem', border: `1px solid ${s.color}20` }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1, marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>{s.value}</div>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
