import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useApp();
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [form, setForm] = useState({ username: '', email: '', bio: '', password: '' });

  useEffect(() => {
    if (user) {
      api.get('/auth/profile').then(res => {
        setForm({ username: res.data.username || '', email: res.data.email || '', bio: res.data.bio || '', password: '' });
      }).catch(() => {});
    }
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', form);
      addToast('Profile updated successfully', 'success');
      setForm(prev => ({ ...prev, password: '' })); // clear pass
    } catch {
      addToast('Failed to update profile', 'error');
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem' }}>Settings</h2>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Appearance</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Dark Mode</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Switch between light and dark themes.</div>
            </div>
            <button 
              onClick={toggleTheme} 
              style={{ background: theme === 'dark' ? 'var(--primary)' : 'var(--bg-element)', color: theme === 'dark' ? 'white' : 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: 20, border: 'none', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            >
              {theme === 'dark' ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Edit Profile</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Username</label>
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="form-input" placeholder="Tell us about yourself..." style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>New Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep current)</span></label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-main)' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem' }}>Save Changes</button>
          </form>
        </div>

      </div>
    </Layout>
  );
};

export default Settings;
