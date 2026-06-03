import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const Certificate: React.FC = () => {
  const { courseId } = useParams();
  const [cert, setCert] = useState<any>(null);

  useEffect(() => {
    const fetchCert = async () => {
      const res = await api.get(`/courses/${courseId}/certificate`);
      if (res.data.eligible) {
        setCert(res.data.certificate);
      }
    };
    fetchCert();
  }, [courseId]);

  if (!cert) return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Verifying your completion status...</div>;

  return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <div className="no-print" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button onClick={() => window.print()} className="btn btn-primary">
          Download PDF / Print
        </button>
        <Link to="/dashboard" className="btn btn-outline" style={{ borderColor: '#e2e8f0', color: 'var(--text-main)' }}>
          Back to Dashboard
        </Link>
      </div>

      <div className="certificate-inner" style={{ 
        margin: '0 auto',
        maxWidth: '1000px',
        padding: '80px', 
        border: '20px solid #f8fafc', 
        outline: '2px solid var(--primary)',
        outlineOffset: '-40px',
        backgroundColor: '#fff',
        position: 'relative',
        minHeight: '700px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        backgroundImage: 'radial-gradient(circle at 2px 2px, #f1f5f9 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}>
        <div style={{ position: 'absolute', top: '60px', left: '60px' }}>
          <div className="logo" style={{ fontSize: '2rem' }}>MyDev</div>
        </div>

        <div style={{ position: 'absolute', bottom: '60px', right: '60px', opacity: 0.1 }}>
          {/* Large decorative icon/seal */}
          <div style={{ width: '150px', height: '150px', border: '15px solid var(--primary)', borderRadius: '50%' }}></div>
        </div>
        
        <header style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '4rem', color: '#0f172a', letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>CERTIFICATE</h1>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: '600', letterSpacing: '0.2em' }}>OF COMPLETION</h2>
        </header>

        <section>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>THIS IS TO CERTIFY THAT</p>
          <h2 style={{ 
            fontSize: '4.5rem', 
            margin: '1.5rem 0', 
            color: '#0f172a', 
            fontFamily: 'serif',
            borderBottom: '2px solid #e2e8f0',
            display: 'inline-block',
            padding: '0 4rem'
          }}>
            {cert.userName}
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '2.5rem', maxWidth: '600px', margin: '2.5rem auto' }}>
            has successfully fulfilled all requirements and demonstrated mastery in the professional curriculum of
          </p>
          <h3 style={{ fontSize: '2.5rem', color: '#0f172a', fontWeight: '800', fontStyle: 'italic' }}>{cert.courseName}</h3>
        </section>
        
        <footer style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ISSUED ON</p>
              <p style={{ fontWeight: '700', fontSize: '1.125rem' }}>{new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>VERIFICATION ID</p>
              <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>{cert.certificate_code}</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ borderTop: '2px solid #0f172a', paddingTop: '1rem', width: '250px' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>MyDev Academy</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600' }}>ACADEMIC DIRECTOR</p>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .certificate-inner { 
            box-shadow: none !important; 
            border: none !important; 
            outline-offset: -30px !important;
            min-height: 100vh !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Certificate;
