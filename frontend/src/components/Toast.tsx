import React from 'react';
import { useApp } from '../context/AppContext';

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const colors: Record<string, string> = {
  success: '#00b894',
  error:   '#e17055',
  warning: '#fdcb6e',
  info:    '#6c5ce7',
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.625rem',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.125rem',
            background: 'white',
            border: `1px solid ${colors[t.type]}30`,
            borderLeft: `4px solid ${colors[t.type]}`,
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: '260px',
            maxWidth: '380px',
            pointerEvents: 'all',
            animation: 'slideInRight 0.3s ease',
          }}
        >
          <span style={{
            width: '22px', height: '22px',
            borderRadius: '50%',
            background: `${colors[t.type]}15`,
            color: colors[t.type],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
          }}>
            {icons[t.type]}
          </span>
          <span style={{ flex: 1, fontSize: '0.875rem', color: '#1a1a2e', fontWeight: 500 }}>
            {t.message}
          </span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a0a3b1', fontSize: '1rem', padding: '0', lineHeight: 1,
            }}
          >×</button>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
