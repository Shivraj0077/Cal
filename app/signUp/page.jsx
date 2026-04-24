'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllTimezones } from '@/lib/timezone';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('HOST');
  const [mounted, setMounted] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const detectedTimezone = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const allTimezones = mounted ? getAllTimezones() : ['UTC'];
  useEffect(() => { if (mounted && timezone === 'UTC') setTimezone(detectedTimezone); }, [mounted, detectedTimezone, timezone]);

  async function handleSignup(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/signUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role, timezone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Signup failed'); return; }
    localStorage.setItem('token', data.token);
    router.push('/signIn');
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">📅</div>
          <span className="auth-logo-text">BookWise</span>
        </div>

        <div className="auth-card">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start accepting bookings in minutes</p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSignup}>
            <div className="field">
              <label className="label">Username</label>
              <input className="input input-full" placeholder="your_username" value={username}
                onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input input-full" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>

            {/* Role */}
            <div className="field">
              <label className="label">I am a…</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['HOST', '🗓', 'Host', 'I share my calendar'], ['BOOKER', '🔍', 'Booker', 'I book meetings']].map(([val, icon, lbl, sub]) => (
                  <button key={val} type="button" onClick={() => setRole(val)} style={{
                    padding: '10px 12px', textAlign: 'left', borderRadius: 6, cursor: 'pointer',
                    background: role === val ? '#eff6ff' : '#f9fafb',
                    border: `1px solid ${role === val ? '#2563eb' : '#e5e7eb'}`,
                  }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: 3 }}>{icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: role === val ? '#2563eb' : '#111827' }}>{lbl}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="label">Timezone {mounted && <span style={{ color: '#9ca3af', fontWeight: 400 }}>· auto-detected</span>}</label>
              <select className="input input-full" value={timezone} onChange={e => setTimezone(e.target.value)} disabled={!mounted}>
                {allTimezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Already have an account?{' '}
          <button onClick={() => router.push('/signIn')}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
