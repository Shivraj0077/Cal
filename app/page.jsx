'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className="auth-page">
      <div className="auth-box" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">📅</div>
          <span className="auth-logo-text">BookWise</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
          Scheduling, simplified
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
          Conflict-free, timezone-safe booking. Share your link. Done.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '9px 20px' }} onClick={() => router.push('/signUp')}>Get started</button>
          <button className="btn btn-secondary" style={{ padding: '9px 20px' }} onClick={() => router.push('/signIn')}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
