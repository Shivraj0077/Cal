'use client';
import { useState, useEffect } from 'react';
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
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    async function fetchHosts() {
      try {
        const res = await fetch('/api/hosts');
        const data = await res.json();
        if (data.hosts) setHosts(data.hosts);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    
    fetchHosts();
  }, [mounted]);

  // If no user, show a landing hero
  if (mounted && !user) {
    return (
      <div className="auth-page">
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <div className="sidebar-logo" style={{ justifyContent: 'center', marginBottom: 24 }}>
            <span>BookWise</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12 }}>
            Scheduling, simplified
          </h1>
          <p style={{ color: '#6e6e73', fontSize: 18, marginBottom: 32 }}>
            The open-source alternative to Calendly. 
            Connect your calendar and start booking meetings in seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => router.push('/signUp')}>Get Started</button>
            <button className="btn" onClick={() => router.push('/signIn')}>Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        

        <div className="page-header">
          <div>
            <h1 className="page-title">Book a Host</h1>
            <p className="page-subtitle">Select a team member to see their availability.</p>
          </div>
        </div>

        <div className="directory-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6e6e73' }}>Loading directory...</div>
            ) : hosts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No hosts found</div>
                <div style={{ fontSize: 13, color: '#6e6e73' }}>Try inviting a team member to get started.</div>
              </div>
            ) : (
            hosts.map(host => (
              <div key={host.id} className="card-outer" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="sidebar-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                  {host.username.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{host.username}</div>
                    <div style={{ fontSize: 13, color: '#6e6e73' }}>Timezone: {host.timezone}</div>
                  </div>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => router.push(`/book/${host.id}`)}
                >
                  Book
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
