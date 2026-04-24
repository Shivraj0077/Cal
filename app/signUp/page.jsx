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
          <span className="auth-logo-text">BookWise</span>
        </div>

        <div className="auth-card">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join thousands of others scheduling with ease.</p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSignup}>
            <div className="field">
              <label className="label">Username</label>
              <input className="input input-full" placeholder="Enter username" value={username}
                onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input input-full" type="password" placeholder="Min. 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>

            <div className="field">
              <label className="label">I am a...</label>
              <div className="role-selection-grid">
                {[
                  { val: 'HOST', lbl: 'Host', sub: 'I share my calendar' },
                  { val: 'BOOKER', lbl: 'Booker', sub: 'I book meetings' }
                ].map((item) => (
                  <button 
                    key={item.val} 
                    type="button" 
                    className={`role-button ${role === item.val ? 'active' : ''}`}
                    onClick={() => setRole(item.val)}
                  >
                    <div className="role-button-title">{item.lbl}</div>
                    <div className="role-button-desc">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="label">Timezone</label>
              <select className="input input-full" value={timezone} onChange={e => setTimezone(e.target.value)} disabled={!mounted}>
                {allTimezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Already have an account?
          <button onClick={() => router.push('/signIn')}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
