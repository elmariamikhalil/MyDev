import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { ColorAvatar } from '../components/Layout';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { SkeletonCard } from '../components/Skeleton';

interface Course {
  id: number; title: string; description: string;
  category: string; difficulty: string; thumbnail_url: string;
  author: string; enrolled_count: number; avg_rating: number;
  review_count: number; is_enrolled: number;
}

const CATEGORIES = ['All', 'Front End', 'UI/UX Design', 'Backend', 'Branding', 'General'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <span style={{ color: '#fdcb6e', fontSize: '0.75rem' }}>
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
  </span>
);

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [search, setSearch] = useState('');
  const { addToast } = useApp();

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (course: Course) => {
    if (course.is_enrolled) return;
    try {
      await api.post(`/courses/${course.id}/enroll`);
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_enrolled: 1, enrolled_count: c.enrolled_count + 1 } : c));
      addToast(`Enrolled in "${course.title}" 🎉`, 'success');
    } catch {
      addToast('Failed to enroll', 'error');
    }
  };

  const filtered = courses.filter(c => {
    const matchCat = category === 'All' || c.category === category;
    const matchDiff = difficulty === 'All' || c.difficulty === difficulty;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchDiff && matchSearch;
  });

  const diffColor: Record<string, string> = { Beginner: '#00b894', Intermediate: '#fdcb6e', Advanced: '#e17055' };

  // Find featured course (highest enrolled)
  const featured = courses.length > 0 ? [...courses].sort((a, b) => b.enrolled_count - a.enrolled_count)[0] : null;

  return (
    <Layout>
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem', letterSpacing: '-0.04em' }}>Course Catalogue</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Explore all available courses and enroll to start learning</p>
        </div>
      </div>

      {/* Hero Banner */}
      {!loading && featured && search === '' && category === 'All' && difficulty === 'All' && (
        <div style={{ marginBottom: '2.5rem', background: 'var(--bg-base)', borderRadius: 24, overflow: 'hidden', display: 'flex', gap: '2rem', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(0,0,0,0.03)', position: 'relative' }}>
          <div style={{ flex: '1 1 50%', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: 99, background: 'var(--primary-soft)', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⭐ Featured Course
              </span>
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.03em' }}>{featured.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '2rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {featured.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {featured.is_enrolled ? (
                <Link to={`/course/${featured.id}`} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1.125rem', borderRadius: 12 }}>Continue Learning</Link>
              ) : (
                <button onClick={() => handleEnroll(featured)} className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1.125rem', borderRadius: 12 }}>Enroll Now</button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                <span>🔥 {featured.enrolled_count} Students Enrolled</span>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 50%', position: 'relative', overflow: 'hidden' }}>
            {featured.thumbnail_url ? (
              <img src={featured.thumbnail_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary-soft) 0%, rgba(108,92,231,0.2) 100%)' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--bg-base) 0%, transparent 100%)' }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 220px', maxWidth: 300 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '0.375rem 0.875rem', borderRadius: '999px', border: `1px solid ${category === cat ? 'var(--primary)' : 'var(--border)'}`, background: category === cat ? 'var(--primary)' : 'transparent', color: category === cat ? 'white' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {cat}
            </button>
          ))}
        </div>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontSize: '0.8125rem', cursor: 'pointer', outline: 'none' }}>
          {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="course-cards-grid">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>No courses found. Try different filters.</p>
        </div>
      ) : (
        <div className="course-cards-grid">
          {filtered.map(c => (
            <div key={c.id} className="course-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="course-card-thumb">
                <img src={c.thumbnail_url || '/thumb1.png'} alt={c.title} onError={e => (e.currentTarget.src = '/thumb1.png')} />
                <button className="course-card-fav">♡</button>
              </div>
              <div className="course-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span className="course-category-tag purple">{c.category}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 4, background: `${diffColor[c.difficulty] || '#ddd'}20`, color: diffColor[c.difficulty] || '#666' }}>{c.difficulty}</span>
                </div>
                <div className="course-card-title" style={{ flex: 1 }}>{c.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <StarRating rating={c.avg_rating} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({c.review_count} reviews)</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.enrolled_count} enrolled</span>
                </div>
                <div className="course-card-divider" />
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <ColorAvatar name={c.author || 'M'} size={24} idx={c.id % 5} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, flex: 1 }}>{c.author || 'Instructor'}</span>
                  {c.is_enrolled ? (
                    <Link to={`/course/${c.id}`} className="btn btn-primary" style={{ padding: '0.35rem 0.875rem', fontSize: '0.75rem' }}>Continue</Link>
                  ) : (
                    <button onClick={() => handleEnroll(c)} className="btn btn-primary" style={{ padding: '0.35rem 0.875rem', fontSize: '0.75rem' }}>Enroll</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Courses;
