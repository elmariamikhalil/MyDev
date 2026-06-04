import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../services/api';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

const PathDetails: React.FC = () => {
  const { pathId } = useParams();
  const { addToast } = useApp();
  const [data, setData] = useState<any>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    fetchPath();
  }, [pathId]);

  const fetchPath = async () => {
    try {
      const res = await api.get(`/paths/${pathId}`);
      setData(res.data);
      if (res.data.pathCompleted && res.data.certificate) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6c5ce7', '#a29bfe', '#f1c40f', '#00b894']
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      await api.post(`/paths/${pathId}/enroll`);
      addToast('Enrolled in the learning path!', 'success');
      fetchPath();
    } catch (e) {
      addToast('Error enrolling in path', 'error');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (!data) return <Layout><div style={{ padding: '3rem', textAlign: 'center' }}>Loading path...</div></Layout>;

  const { path, courses, pathCompleted, certEligible, certificate } = data;
  const isEnrolledInAny = courses.some((c: any) => c.is_enrolled);
  
  // Calculate completed courses
  // Since we only get `is_enrolled`, we might not know if a course is fully completed from this endpoint unless we added that.
  // We can just rely on `pathCompleted` to show the final certificate!

  return (
    <Layout>
      <div style={{ padding: '2rem 3rem', maxWidth: 1000, margin: '0 auto' }}>
        <Link to="/paths" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, display: 'inline-block', marginBottom: '2rem' }}>
          ← Back to Paths
        </Link>
        
        {/* Hero */}
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', marginBottom: '4rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1rem', color: 'var(--text-main)' }}>
              {path.title}
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              {path.description}
            </p>
            {!isEnrolledInAny ? (
              <button onClick={handleEnroll} disabled={isEnrolling} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
                {isEnrolling ? 'Enrolling...' : 'Start Learning Path'}
              </button>
            ) : pathCompleted && certificate ? (
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)', fontWeight: 800, fontSize: '1.125rem', padding: '1rem 2rem', background: 'rgba(0,184,148,0.1)', borderRadius: 16, border: '1px solid rgba(0,184,148,0.2)' }}>
                  🎉 Path Completed!
                </div>
                <Link to={`/paths/${path.id}/certificate`} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)', color: '#fff', border: 'none', padding: '1rem 2rem', fontSize: '1.125rem', justifyContent: 'center' }}>
                  🎓 View Certificate
                </Link>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: 800, fontSize: '1.125rem', padding: '1rem 2rem', background: 'var(--primary-soft)', borderRadius: 16 }}>
                🚀 Path in Progress
              </div>
            )}
          </div>
          <div style={{ flex: '0 0 350px' }}>
            <div style={{ aspectRatio: '1/1', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
              {path.thumbnail_url ? (
                <img src={path.thumbnail_url} alt={path.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary-soft) 0%, rgba(108,92,231,0.2) 100%)' }} />
              )}
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Course Sequence</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {courses.map((c: any, i: number) => {
              const isLocked = c.locked;
              return (
              <Link 
                key={c.id} 
                to={isLocked ? '#' : `/course/${c.id}?pathId=${path.id}`} 
                onClick={(e) => { if(isLocked) e.preventDefault(); }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', 
                  background: isLocked ? 'var(--bg-element)' : 'white', 
                  borderRadius: 20, border: '1px solid var(--border)', 
                  textDecoration: 'none', color: 'inherit', 
                  transition: 'transform 0.2s, box-shadow 0.2s', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  opacity: isLocked ? 0.7 : 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer'
                }} 
                onMouseOver={e => !isLocked && (e.currentTarget.style.transform = 'translateY(-2px)')} 
                onMouseOut={e => !isLocked && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: isLocked ? 'transparent' : 'var(--bg-element)', border: isLocked ? '2px dashed var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  {isLocked ? '🔒' : i + 1}
                </div>
                <div style={{ width: 120, height: 80, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-element)', flexShrink: 0, filter: isLocked ? 'grayscale(100%)' : 'none' }}>
                  {c.thumbnail_url && <img src={c.thumbnail_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-main)' }}>{c.title}</h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{c.difficulty} • {c.language}</div>
                </div>
                <div>
                  {isLocked ? (
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', background: 'transparent', padding: '0.5rem 1rem', borderRadius: 8, border: '1px dashed var(--border)' }}>Locked</span>
                  ) : c.is_enrolled ? (
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '0.5rem 1rem', borderRadius: 8 }}>Continue</span>
                  ) : (
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: 8 }}>View Details</span>
                  )}
                </div>
              </Link>
            )})}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PathDetails;
