import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import confetti from 'canvas-confetti';

const PathCertificate: React.FC = () => {
  const { pathId } = useParams();
  const [cert, setCert] = useState<any>(null);
  const [path, setPath] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchPathDetails = async () => {
      try {
        const res = await api.get(`/paths/${pathId}`);
        const userStr = localStorage.getItem('user');
        if (userStr) setUserName(JSON.parse(userStr).username);

        if (res.data.certificate) {
          setCert(res.data.certificate);
          setPath(res.data.path);
          
          // Trigger confetti!
          var duration = 3 * 1000;
          var animationEnd = Date.now() + duration;
          var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
          
          var interval: any = setInterval(function() {
            var timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            var particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
          }, 250);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPathDetails();
  }, [pathId]);

  if (!cert || !path) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎓</div>
        <h2>Verifying your path completion...</h2>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '4rem 1rem' }}>
      
      <div className="no-print" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button onClick={() => window.print()} className="btn btn-primary" style={{ background: '#d4af37', color: '#000', border: 'none', fontWeight: 800 }}>
          Download / Print Certificate
        </button>
        <Link to={`/paths/${pathId}`} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
          Back to Path
        </Link>
      </div>

      <div className="certificate-inner" style={{ 
        margin: '0 auto',
        maxWidth: '1050px',
        padding: '10px',
        background: 'linear-gradient(135deg, #d4af37 0%, #aa8529 100%)', // Gold border
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          background: '#fff',
          minHeight: '700px',
          padding: '80px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          backgroundImage: 'radial-gradient(circle at 2px 2px, #f1f5f9 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}>
          
          {/* Corner Decor */}
          <div style={{ position: 'absolute', top: 30, left: 30, width: 80, height: 80, borderTop: '4px solid #d4af37', borderLeft: '4px solid #d4af37' }}></div>
          <div style={{ position: 'absolute', top: 30, right: 30, width: 80, height: 80, borderTop: '4px solid #d4af37', borderRight: '4px solid #d4af37' }}></div>
          <div style={{ position: 'absolute', bottom: 30, left: 30, width: 80, height: 80, borderBottom: '4px solid #d4af37', borderLeft: '4px solid #d4af37' }}></div>
          <div style={{ position: 'absolute', bottom: 30, right: 30, width: 80, height: 80, borderBottom: '4px solid #d4af37', borderRight: '4px solid #d4af37' }}></div>

          <div style={{ position: 'absolute', top: '50px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              <span style={{ color: '#d4af37' }}>✦</span> Coursue
            </div>
          </div>
          
          <header style={{ marginBottom: '3rem', marginTop: '3rem' }}>
            <h1 style={{ fontSize: '3rem', color: '#0f172a', letterSpacing: '0.1em', marginBottom: '0.5rem', fontFamily: 'serif', textTransform: 'uppercase' }}>Certificate of Mastery</h1>
            <h2 style={{ fontSize: '1rem', color: '#d4af37', fontWeight: '700', letterSpacing: '0.3em' }}>LEARNING PATH COMPLETION</h2>
          </header>

          <section style={{ width: '100%' }}>
            <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '2rem', fontStyle: 'italic' }}>This prestigious certificate is proudly presented to</p>
            <h2 style={{ 
              fontSize: '4.5rem', 
              margin: '1.5rem 0', 
              color: '#0f172a', 
              fontFamily: 'serif',
              borderBottom: '2px solid #e2e8f0',
              display: 'inline-block',
              padding: '0 4rem',
              lineHeight: '1.2'
            }}>
              {userName}
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#64748b', marginTop: '2rem', maxWidth: '700px', margin: '2rem auto' }}>
              for successfully completing all rigorous coursework, assessments, and projects in the comprehensive Learning Path:
            </p>
            <h3 style={{ fontSize: '2.5rem', color: '#0f172a', fontWeight: '800' }}>{path.title}</h3>
          </section>
          
          <footer style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', padding: '0 40px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 700, letterSpacing: '0.1em' }}>DATE OF ISSUANCE</p>
                <p style={{ fontWeight: '700', fontSize: '1.125rem', color: '#0f172a' }}>{new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 700, letterSpacing: '0.1em' }}>CREDENTIAL ID</p>
                <p style={{ fontWeight: '700', fontSize: '1rem', color: '#d4af37' }}>{cert.certificate_code}</p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 120, height: 120, border: '8px solid #d4af37', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <span style={{ fontSize: '2.5rem' }}>🏆</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ borderTop: '2px solid #0f172a', paddingTop: '1rem', width: '250px' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Khalil Elmariami</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', letterSpacing: '0.1em' }}>LEAD INSTRUCTOR</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .certificate-inner, .certificate-inner * { visibility: visible; }
          .certificate-inner { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PathCertificate;
