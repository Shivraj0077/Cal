'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/hosts')
        .then(r => r.json())
        .then(data => {
          setHosts(data.hosts || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch hosts", err);
          setLoading(false);
        });
    } else if (mounted) {
      setLoading(false);
    }
  }, [user, mounted]);

  if (!mounted) return null;

  if (!user) {
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

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-wrap">
          <div className="page-topbar">
            <div>
              <div className="page-title">Find a Host</div>
              <div className="page-desc">Book a meeting with one of our hosts.</div>
            </div>
          </div>

          <div className="card">
            {loading ? (
              <div className="empty"><div className="empty-desc">Loading hosts...</div></div>
            ) : hosts.length === 0 ? (
              <div className="empty">
                <div className="empty-title">No hosts found</div>
                <div className="empty-desc">There are no available hosts to book at the moment.</div>
              </div>
            ) : (
              <div style={{ padding: '0 20px' }}>
                {hosts.map((host) => (
                  <div key={host.id} className="list-row" style={{ padding: '20px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="sidebar-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                        {host.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{host.username}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>🌍 {host.timezone}</div>
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => router.push(`/book/${host.id}`)}
                    >
                      Book now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
