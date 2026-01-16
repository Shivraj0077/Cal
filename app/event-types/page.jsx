'use client';

import React from 'react';
import { useEffect, useState } from 'react';

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    duration: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    minNotice: 0
  });

  /* =========================
     Fetch existing event types
     ========================= */
  async function fetchEventTypes() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/event-types`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      console.log('event types response:', data);

      if (Array.isArray(data)) {
        setEventTypes(data);
      } else {
        setEventTypes([]);
      }
    } catch (err) {
      console.error('Error fetching event types:', err);
      setEventTypes([]);
    }
  }

  useEffect(() => {
    (async () => {
      await fetchEventTypes()
    }) ();
  }, [])

  /* =========================
     Create event type
     ========================= */
  async function createEventType(e) {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');

    const res = await fetch('/api/event-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: form.title,
        duration: Number(form.duration),
        bufferBefore: Number(form.bufferBefore),
        bufferAfter: Number(form.bufferAfter),
        minNoticeMins: Number(form.minNotice)
      })
    });

    if (res.ok) {
      setForm({
        title: '',
        duration: 30,
        bufferBefore: 0,
        bufferAfter: 0,
        minNotice: 0
      });
      fetchEventTypes();
    }

    setLoading(false);
  }



  return (
    <div style={{ padding: 40, maxWidth: 700 }}>
      <h1>Event Types</h1>
      <p>Create different meeting types with their own duration, buffers, and notice window.</p>

      {/* =========================
          Create Event Form
         ========================= */}
      <form onSubmit={createEventType} style={{ marginTop: 30, marginBottom: 50 }}>
        <div style={{ marginBottom: 15 }}>
          <label>Title</label><br />
          <input
            required
            placeholder="e.g. Discovery Call"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Duration</label><br />
          <select
            value={form.duration}
            onChange={e => setForm({ ...form, duration: e.target.value })}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value="custom">Custom</option>
          </select>

          {form.duration === 'custom' && (
            <input
              type="number"
              min={5}
              step={5}
              placeholder="Custom duration (mins)"
              onChange={e =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
              required
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Buffer Before (mins)</label><br />
          <input
            type="number"
            min={0}
            value={form.bufferBefore}
            onChange={e =>
              setForm({ ...form, bufferBefore: Number(e.target.value) })
            }
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Buffer After (mins)</label><br />
          <input
            type="number"
            min={0}
            value={form.bufferAfter}
            onChange={e =>
              setForm({ ...form, bufferAfter: Number(e.target.value) })
            }
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Minimum Notice (mins)</label><br />
          <input
            type="number"
            min={0}
            value={form.minNotice}
            onChange={e =>
              setForm({ ...form, minNotice: Number(e.target.value) })
            }
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Event Type'}
        </button>
      </form>

      {/* =========================
          Existing Event Types
         ========================= */}
      <h2>Your Event Types</h2>

      {Array.isArray(eventTypes) && eventTypes.length === 0 && (<p>No event types yet.</p>)}

      <div style={{ display: 'grid', gap: 12 }}>
        {eventTypes.map(type => (
          <div
            key={type.id}
            style={{
              border: '1px solid #ddd',
              padding: 16,
              borderRadius: 8
            }}
          >
            <h3>{type.title}</h3>
            <p>Duration: {type.duration} mins</p>
            <p>
              Buffer before: {type.buffer_before_min} mins
              <br />
              Buffer after: {type.buffer_after_min} mins
            </p>
            <p>Minimum notice: {type.min_notice_mins} mins</p>
          </div>
        ))}
      </div>
    </div>
  );
}
