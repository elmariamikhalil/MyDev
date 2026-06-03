import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true); setError('');
    try {
      const response = await api.post('/auth/register', { username, password, targetLanguage });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setIsLoading(false); }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ['#ddd', '#e17055', '#fdcb6e', '#00b894'][strength];
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f6fa 0%, #ede9fe 100%)', padding: '2rem', fontFamily: 'var(--font-main)' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(108,92,231,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-120px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(108,92,231,0.05)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', marginBottom: '1rem' }}>✦</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>Join Coursue</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Start your high-growth learning journey today</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 8px 32px rgba(108,92,231,0.08), 0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--border)' }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#e17055', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.875rem', border: '1px solid #fee2e2' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Username</label>
              <input id="reg-username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a unique name" required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= strength ? strengthColor : '#e8e9f0', transition: 'background 0.3s' }} />)}
                  <span style={{ fontSize: '0.7rem', color: strengthColor, fontWeight: 700, marginLeft: '0.5rem', minWidth: 40 }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Target Language</label>
              <select id="reg-language" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} required>
                <option value="" disabled>Select a programming language</option>
                <optgroup label="Frontend">
                  <option value="HTML/CSS">HTML/CSS</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="React">React</option>
                  <option value="Vue">Vue</option>
                  <option value="Angular">Angular</option>
                </optgroup>
                <optgroup label="Backend">
                  <option value="Node.js">Node.js</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C#">C#</option>
                  <option value="Go">Go</option>
                  <option value="Ruby">Ruby</option>
                  <option value="PHP">PHP</option>
                  <option value="Rust">Rust</option>
                </optgroup>
              </select>
            </div>

            <button id="reg-submit" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }} disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
