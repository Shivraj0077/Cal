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
        <div className="page-wrap-v2">

          {/* Header */}
          <div className="topbar-v2">
            <div>
              <h1 className="title-v2">Event types</h1>
              <p className="desc-v2">Manage booking configurations</p>
            </div>

            <div className="actions-v2">
              <button className="btn-primary-v2" onClick={() => setShowForm(v => !v)}>
                + New Event
              </button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="form-card-v2">
              <div className="form-header">
                <span>Create new event</span>
                <button onClick={() => setShowForm(false)}>✕</button>
              </div>

              <form onSubmit={create} className="form-grid-v2">

                <input
                  placeholder="Event title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />

                <input
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />

                <div className="duration-row">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      className={form.duration === d ? "active" : ""}
                      onClick={() => setForm({ ...form, duration: d })}
                    >
                      {d}m
                    </button>
                  ))}
                </div>

                <div className="grid-2">
                  <input
                    type="number"
                    placeholder="Buffer before"
                    value={form.bufferBefore}
                    onChange={e => setForm({ ...form, bufferBefore: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Buffer after"
                    value={form.bufferAfter}
                    onChange={e => setForm({ ...form, bufferAfter: e.target.value })}
                  />
                </div>

                <input
                  type="number"
                  placeholder="Minimum notice (mins)"
                  value={form.minNotice}
                  onChange={e => setForm({ ...form, minNotice: e.target.value })}
                />

                <div className="form-actions">
                  <button type="submit" className="btn-primary-v2" disabled={saving}>
                    {saving ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="card-v2 center">Loading...</div>
          ) : eventTypes.length === 0 && !showForm ? (
            <div className="card-v2 center">
              <h3 style={{ marginBottom: 12 }}>No events yet</h3>
              <button className="btn-primary-v2" onClick={() => setShowForm(true)}>
                Create first
              </button>
            </div>
          ) : (
            <div className="list-v2">
              {eventTypes.map(type => (
                <div key={type.id} className="event-row-v2">

                  <div className="event-left">
                    <div className="event-title">{type.title}</div>
                    <div className="event-meta">
                      {type.duration}m
                      {type.buffer_before_min > 0 && ` · ${type.buffer_before_min}m before`}
                      {type.buffer_after_min > 0 && ` · ${type.buffer_after_min}m after`}
                    </div>
                  </div>

                  <div className="event-actions">
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span />
                    </label>
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

