import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { ColorAvatar } from '../../components/Layout';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const { addToast } = useApp();

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      addToast(`Role updated to ${role}`, 'success');
    } catch {
      addToast('Failed to update role', 'error');
    }
  };

  return (
    <Layout rightPanel={false}>
      <h2 style={{ marginBottom: '2rem' }}>Manage Users</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-element)' }}>
            <tr>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>USER</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>EMAIL</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>JOINED</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ROLE</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <ColorAvatar name={u.username} size={36} idx={i} />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{u.username}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email || '—'}</td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AdminUsers;
