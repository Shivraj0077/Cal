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
  const [timezone, setTimezone] = useState('UTC'); // Stable default for SSR

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only compute these on the client side
  const detectedTimezone = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const allTimezones = mounted ? getAllTimezones() : ['UTC'];

  // Set detected timezone once mounted
  useEffect(() => {
    if (mounted && timezone === 'UTC') {
      setTimezone(detectedTimezone);
    }
  }, [mounted, detectedTimezone, timezone]);
  //new browsers :: Intl.DateTimeFormat().resolvedOptions().timeZone();
  //older browesers :: new Date().getTimezoneOffset();
  const [error, setError] = useState('');

  async function handleSignup(e) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/signUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        role,
        timezone
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Signup failed');
      return;
    }

    localStorage.setItem('token', data.token);
    router.push('/'); // redirect after signup

    if (res.ok) {
      router.push("/signIn");
    }
  }

  async function handleLogin() {
    router.push("/signIn");
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          placeholder="Email"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="HOST">Host</option>
          <option value="BOOKER">Booker</option>
        </select>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '5px' }}>
            Your Timezone
          </label>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            disabled={!mounted}
          >
            {allTimezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <small style={{ color: '#888' }}>
            {mounted ? 'Auto-detected. Change if needed.' : 'Detecting timezone...'}
          </small>
        </div>

        <button type="submit">Create Account</button>
      </form>

      <button onClick={handleLogin}>SingIn</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}



