import React from 'react';

const shimmer = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

const base: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0f1f8 25%, #e8e9f4 50%, #f0f1f8 75%)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.4s ease infinite',
  borderRadius: '8px',
};

export const SkeletonLine: React.FC<{ width?: string; height?: string; style?: React.CSSProperties }> = ({
  width = '100%', height = '14px', style,
}) => (
  <>
    <style>{shimmer}</style>
    <div style={{ ...base, width, height, ...style }} />
  </>
);

export const SkeletonCard: React.FC = () => (
  <div style={{ background: 'white', border: '1px solid #e8e9f0', borderRadius: '16px', overflow: 'hidden' }}>
    <style>{shimmer}</style>
    <div style={{ ...base, height: '140px', borderRadius: 0 }} />
    <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ ...base, height: '12px', width: '40%' }} />
      <div style={{ ...base, height: '14px', width: '100%' }} />
      <div style={{ ...base, height: '14px', width: '80%' }} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <div style={{ ...base, width: '24px', height: '24px', borderRadius: '50%' }} />
        <div style={{ ...base, height: '12px', width: '40%', marginTop: '6px' }} />
      </div>
    </div>
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', borderBottom: '1px solid #e8e9f0' }}>
    <style>{shimmer}</style>
    <div style={{ ...base, width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ ...base, height: '12px', width: '30%' }} />
      <div style={{ ...base, height: '10px', width: '50%' }} />
    </div>
    <div style={{ ...base, height: '12px', width: '15%' }} />
  </div>
);
