import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', fontFamily: 'var(--font-main)' }}>
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem', lineHeight: 1 }}>🌌</div>
      <h1 style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '2rem', maxWidth: 360, margin: '0 auto 2rem' }}>
        Looks like this page took an unexpected detour. Let's get you back on track.
      </p>
      <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>← Go to Dashboard</Link>
    </div>
  </div>
);

export default NotFound;
