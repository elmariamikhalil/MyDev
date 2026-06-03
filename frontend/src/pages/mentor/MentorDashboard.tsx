import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ followers: 0, totalStudents: 0, totalCourses: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          api.get('/mentor/stats'),
          api.get('/mentor/courses')
        ]);
        setStats(statsRes.data);
        setCourses(coursesRes.data);
      } catch (error) {
        console.error('Failed to fetch mentor data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout rightPanel={false}>
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
            Mentor Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Welcome back, {user?.username}! Here's how your courses are performing.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(108,92,231,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👥</div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Followers</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{loading ? '-' : stats.followers}</div>
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(0,184,148,0.1)', color: '#00b894', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎓</div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Students</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{loading ? '-' : stats.totalStudents}</div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(253,203,110,0.1)', color: '#fdcb6e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📚</div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Courses Authored</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{loading ? '-' : stats.totalCourses}</div>
            </div>
          </div>
        </div>

        {/* My Courses Section */}
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>My Published Courses</h3>
          
          {loading ? (
            <p>Loading your courses...</p>
          ) : courses.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: 24, border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No courses yet</h4>
              <p style={{ color: 'var(--text-muted)' }}>You haven't published any courses yet. Contact an admin to set one up!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {courses.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                  <div style={{ height: 160, position: 'relative' }}>
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary-soft) 0%, rgba(108,92,231,0.2) 100%)' }} />
                    )}
                    <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                      {c.category}
                    </div>
                  </div>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>{c.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <span>🎓 {c.total_students} Students</span>
                      <span>📖 {c.total_lessons} Lessons</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default MentorDashboard;
