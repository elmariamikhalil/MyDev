import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { ColorAvatar } from '../components/Layout';
import api from '../services/api';
import { SkeletonRow } from '../components/Skeleton';

interface Lesson { id: number; title: string; type: string; completed: number; course_id: number; course_title: string; order_index: number; }

const LessonList: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    // Fetch all enrolled courses then their lessons
    api.get('/courses/enrolled').then(async r => {
      const courses = r.data;
      const allLessons: Lesson[] = [];
      for (const course of courses) {
        const ls = await api.get(`/courses/${course.id}`);
        ls.data.lessons.forEach((l: any) => {
          allLessons.push({ ...l, course_id: course.id, course_title: course.title });
        });
      }
      setLessons(allLessons);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = lessons.filter(l => {
    if (filter === 'pending') return !l.completed;
    if (filter === 'completed') return !!l.completed;
    return true;
  });

  const typeColors: Record<string, string> = { text: '#6c5ce7', video: '#e17055' };
  const typeLabels: Record<string, string> = { text: '📄 Text', video: '🎬 Video' };

  return (
    <Layout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>My Lessons</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {lessons.filter(l => l.completed).length} of {lessons.length} lessons completed
        </p>
      </div>

      {/* Progress */}
      <div className="progress-track" style={{ marginBottom: '1.75rem', height: 6 }}>
        <div className="progress-fill" style={{ width: lessons.length ? `${(lessons.filter(l => l.completed).length / lessons.length) * 100}%` : '0%' }} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-element)', borderRadius: 10, padding: '0.25rem', width: 'fit-content' }}>
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', background: filter === f ? 'white' : 'transparent', color: filter === f ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📖</div>
            <p>No lessons here. <Link to="/courses" style={{ color: 'var(--primary)', fontWeight: 600 }}>Browse courses</Link> to enroll.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Lesson', 'Course', 'Type', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.18s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-element)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{i + 1}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>{l.title}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{l.course_title}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 4, background: `${typeColors[l.type] || '#ddd'}20`, color: typeColors[l.type] || '#666' }}>{typeLabels[l.type] || l.type}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {l.completed
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>✓ Done</span>
                      : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</span>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Link to={`/course/${l.course_id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                      {l.completed ? 'Review' : 'Start →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default LessonList;
