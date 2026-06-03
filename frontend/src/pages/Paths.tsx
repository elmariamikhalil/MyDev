import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

const Paths: React.FC = () => {
  const [paths, setPaths] = useState<any[]>([]);

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      const res = await api.get('/paths');
      setPaths(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem', letterSpacing: '-0.04em' }}>Learning Paths</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Follow carefully curated sequences of courses to master specific disciplines</p>
        </div>
      </div>

      <div className="course-cards-grid">
        {paths.map(p => (
          <Link key={p.id} to={`/paths/${p.id}`} className="course-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
            <div className="course-card-thumb">
              {p.thumbnail_url ? (
                <img src={p.thumbnail_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-soft) 0%, rgba(108,92,231,0.2) 100%)', color: 'var(--primary)', fontSize: '4rem' }}>
                  ✦
                </div>
              )}
            </div>
            <div className="course-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span className="course-category-tag purple">{p.total_courses} Courses</span>
              </div>
              <div className="course-card-title" style={{ flex: 1 }}>{p.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>
              
              <div className="course-card-divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>View Path →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default Paths;
