'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';

const DURATIONS = [15, 30, 45, 60];

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration: 30, bufferBefore: 0, bufferAfter: 0, minNotice: 0 });

  async function load() {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetch('/api/event-types', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setEventTypes(Array.isArray(data) ? data : []);
    } catch { setEventTypes([]); }
    setLoading(false);
  }

  useEffect(() => {
    async function fetchEventTypes() {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetch('/api/event-types', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setEventTypes(Array.isArray(data) ? data : []);
      } catch { setEventTypes([]); }
      setLoading(false);
    }
    fetchEventTypes();
  }, []);

  async function create(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setSaving(true);
    await fetch('/api/event-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: form.title, description: form.description,
        duration: Number(form.duration),
        bufferBefore: Number(form.bufferBefore), bufferAfter: Number(form.bufferAfter),
        minNoticeMins: Number(form.minNotice),
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: '', description: '', duration: 30, bufferBefore: 0, bufferAfter: 0, minNotice: 0 });
    load();
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page-wrap">
          {/* Page header */}
          <div className="page-topbar">
            <div>
              <div className="page-title">Event types</div>
              <div className="page-desc">Configure different events for people to book on your calendar.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="input" placeholder="🔍  Search" style={{ width: 180 }} />
              <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>+ New</button>
            </div>
          </div>

          {/* Create form */}
          {showForm && (
            <div className="card" style={{ marginBottom: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>New event type</span>
                <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
              </div>
              <form onSubmit={create}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <div className="field" style={{ gridColumn: '1/-1' }}>
                    <label className="label">Title *</label>
                    <input className="input input-full" placeholder="e.g. 30 Min Meeting" value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus />
                  </div>
                  <div className="field" style={{ gridColumn: '1/-1' }}>
                    <label className="label">Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>· optional</span></label>
                    <input className="input input-full" placeholder="Brief description for bookers" value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>

                  {/* Duration presets */}
                  <div className="field" style={{ gridColumn: '1/-1' }}>
                    <label className="label">Duration</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DURATIONS.map(d => (
                        <button key={d} type="button" onClick={() => setForm({ ...form, duration: d })} style={{
                          padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          background: form.duration === d ? '#111827' : '#f9fafb',
                          color: form.duration === d ? '#fff' : '#374151',
                          border: `1px solid ${form.duration === d ? '#111827' : '#e5e7eb'}`,
                        }}>
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Buffer before (min)</label>
                    <input className="input input-full" type="number" min={0} value={form.bufferBefore}
                      onChange={e => setForm({ ...form, bufferBefore: e.target.value })} />
                  </div>
                  <div className="field">
                    <label className="label">Buffer after (min)</label>
                    <input className="input input-full" type="number" min={0} value={form.bufferAfter}
                      onChange={e => setForm({ ...form, bufferAfter: e.target.value })} />
                  </div>
                  <div className="field" style={{ gridColumn: '1/-1' }}>
                    <label className="label">Minimum notice (min)</label>
                    <input className="input" style={{ width: 200 }} type="number" min={0} value={form.minNotice}
                      onChange={e => setForm({ ...form, minNotice: e.target.value })} />
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>e.g. 120 = bookers must book ≥2h in advance</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="card"><div className="empty"><div className="empty-desc">Loading…</div></div></div>
          ) : eventTypes.length === 0 && !showForm ? (
            <div className="card">
              <div className="empty">
                <div className="empty-title">No event types yet</div>
                <div className="empty-desc" style={{ marginBottom: 14 }}>Create your first to start accepting bookings</div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New event type</button>
              </div>
            </div>
          ) : (
            <div className="card">
              {eventTypes.map((type, i) => (
                <div key={type.id} className="list-row">
                  {/* Left: info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{type.title}</span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>/book/</span>
                    </div>
                    <div style={{ display: 'flex', align: 'center', gap: 6 }}>
                      <span className="badge badge-gray">
                        <span style={{ fontSize: 10 }}>⏱</span> {type.duration}m
                      </span>
                      {type.buffer_before_min > 0 && <span className="badge badge-gray">{type.buffer_before_min}m before</span>}
                      {type.buffer_after_min > 0 && <span className="badge badge-gray">{type.buffer_after_min}m after</span>}
                    </div>
                  </div>

                  {/* Right: toggle + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                    </label>
                    <button className="btn-icon" title="External link">↗</button>
                    <button className="btn-icon" title="Copy link">⎘</button>
                    <button className="btn-icon" title="More">•••</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
