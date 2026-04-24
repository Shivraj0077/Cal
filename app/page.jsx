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
          <div className="sidebar-logo" style={{ justifyContent: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 32 }}>📅</span> <span>BookWise</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>
            Scheduling, simplified
          </h1>
          <p style={{ color: '#6e6e73', marginBottom: 32, lineHeight: 1.6, fontSize: 16 }}>
            Conflict-free, timezone-safe booking. Share your link. Done.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => router.push('/signUp')}>Get started</button>
            <button className="btn" style={{ padding: '12px 24px' }} onClick={() => router.push('/signIn')}>Sign in</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="breadcrumb">
          🏠 <span>/</span> Directory <span>/</span> <span>All Hosts</span>
        </div>

        <div className="page-header">
            <h1 className="page-title">Find a Host</h1>
            <div style={{ fontSize: 13, color: '#6e6e73' }}>Showing {hosts.length} available hosts</div>
        </div>

        <div className="calendar-layout">
          <div className="mini-cal" style={{ gridColumn: 'span 2' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6e6e73' }}>Loading directory...</div>
            ) : hosts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No hosts found</div>
                <div style={{ fontSize: 13, color: '#6e6e73' }}>Try inviting a team member to get started.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {hosts.map((host) => (
                  <div key={host.id} style={{ 
                    padding: 24, 
                    background: '#fff', 
                    borderRadius: 12, 
                    border: '1px solid #eaecef',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    textAlign: 'center'
                  }}>
                    <div className="sidebar-avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
                      {host.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{host.username}</div>
                      <div style={{ fontSize: 13, color: '#6e6e73' }}>🌍 {host.timezone}</div>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: 8 }}
                      onClick={() => router.push(`/book/${host.id}`)}
                    >
                      Book a Meeting
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
