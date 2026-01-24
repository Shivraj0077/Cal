'use client';

import { useEffect, useState, use } from 'react';
import { getAllTimezones } from '@/lib/timezone';

export default function BookingPage({ params }) {
    const { hostId } = use(params);
    const [eventTypes, setEventTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [date, setDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [timezone, setTimezone] = useState('UTC');

    // Booking form state
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [bookingStatus, setBookingStatus] = useState(null); // 'loading' | 'success' | 'error'
    const [bookingError, setBookingError] = useState('');
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    function formatSlotTime(timeStr) {
        const [hour, minute] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hour);
        date.setMinutes(minute);
        return date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    useEffect(() => {
        setMounted(true);
    }, []);

    const detectedTimezone = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const allTimezones = mounted ? getAllTimezones() : ['UTC']; // we keep utc as default until user dont put their timezone
    //for safe fallback
    useEffect(() => {
        if (mounted && timezone === 'UTC') {
            setTimezone(detectedTimezone);
        }
    }, [mounted, detectedTimezone, timezone]);

    // Fetch event types available for this host
    useEffect(() => {
        async function fetchTypes() {
            const res = await fetch(`/api/event-types?hostId=${hostId}`);
            const data = await res.json();
            setEventTypes(data || []);
        }
        fetchTypes();
    }, [hostId]);

    // Fetch slots based on selected date AND event type settings
    async function fetchSlots(selectedDate, eventTypeId, targetTz) {
        if (!selectedDate || !eventTypeId) return;
        setLoading(true);
        setSelectedSlot(null); // Reset slot selection when date changes
        const res = await fetch(
            `/api/availability/slots?hostId=${hostId}&date=${selectedDate}&eventTypeId=${eventTypeId}&timezone=${targetTz || timezone}`
        );
        const data = await res.json();
        setSlots(data.slots || []);
        setLoading(false);
    }

    // Handle booking submission
    async function handleBooking() {
        if (!selectedSlot || !guestName || !guestEmail) {
            setBookingError('Please fill in all fields');
            return;
        }

        setBookingStatus('loading');
        setBookingError('');

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostId,
                    eventTypeId: selectedType.id,
                    guestName,
                    guestEmail,
                    startTimeUTC: selectedSlot.start_utc,
                    bookerTimezone: timezone
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setBookingStatus('error');
                setBookingError(data.error || 'Booking failed');
                return;
            }

            setBookingStatus('success');
            setConfirmedBooking(data.booking);
        } catch (err) {
            setBookingStatus('error');
            setBookingError(err.message);
        }
    }

    // Reset booking form
    function resetBooking() {
        setSelectedSlot(null);
        setGuestName('');
        setGuestEmail('');
        setBookingStatus(null);
        setBookingError('');
        setConfirmedBooking(null);
    }

    return (
        <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
            {bookingStatus === 'success' ? (
                // Success confirmation
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <h2 style={{ color: '#22c55e' }}>✓ Booking Confirmed!</h2>
                    <p><strong>{selectedType.title}</strong></p>
                    <p>{date} at {formatSlotTime(selectedSlot.start)}</p>
                    <p>Timezone: {timezone}</p>
                    <p style={{ marginTop: 20 }}>
                        Confirmation sent to: <strong>{guestEmail}</strong>
                    </p>
                    <button
                        onClick={() => {
                            resetBooking();
                            setSelectedType(null);
                            setSlots([]);
                            setDate('');
                        }}
                        style={{ marginTop: 20, padding: '10px 20px' }}
                    >
                        Book Another Meeting
                    </button>
                </div>
            ) : !selectedType ? (
                // Step 1: Select Event Type
                <div>
                    <h2>Choose a meeting type</h2>
                    {eventTypes.length === 0 && <p>No event types available for this host.</p>}
                    {eventTypes.map(type => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type)}
                            style={{
                                display: 'block',
                                margin: '10px 0',
                                padding: '20px',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            <strong>{type.title}</strong><br />
                            {type.duration} mins
                            {type.description && <><br /><small>{type.description}</small></>}
                        </button>
                    ))}
                </div>
            ) : selectedSlot ? (
                // Step 3: Booking Form
                <div>
                    <button onClick={() => setSelectedSlot(null)} style={{ marginBottom: 20 }}>
                        ← Change Time
                    </button>

                    <h2>Complete Your Booking</h2>

                    <div style={{
                        background: '#f3f4f6',
                        padding: 15,
                        borderRadius: 8,
                        marginBottom: 20
                    }}>
                        <strong>{selectedType.title}</strong> ({selectedType.duration} mins)<br />
                        <span>{date} at {formatSlotTime(selectedSlot.start)}</span><br />
                        <small>Timezone: {timezone}</small>
                    </div>

                    <div style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', marginBottom: 5 }}>Your Name *</label>
                        <input
                            type="text"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            placeholder="John Doe"
                            style={{ width: '100%', padding: 10 }}
                        />
                    </div>

                    <div style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', marginBottom: 5 }}>Your Email *</label>
                        <input
                            type="email"
                            value={guestEmail}
                            onChange={e => setGuestEmail(e.target.value)}
                            placeholder="john@example.com"
                            style={{ width: '100%', padding: 10 }}
                        />
                    </div>

                    {bookingError && (
                        <p style={{ color: '#ef4444', marginBottom: 15 }}>{bookingError}</p>
                    )}

                    <button
                        onClick={handleBooking}
                        disabled={bookingStatus === 'loading'}
                        style={{
                            width: '100%',
                            padding: 15,
                            background: bookingStatus === 'loading' ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: bookingStatus === 'loading' ? 'not-allowed' : 'pointer',
                            fontSize: 16
                        }}
                    >
                        {bookingStatus === 'loading' ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                </div>
            ) : (
                // Step 2: Select Date & Slot
                <div>
                    <button onClick={() => { setSelectedType(null); setSlots([]); setDate(''); }}>
                        ← Back
                    </button>
                    <h2>Booking: {selectedType.title} ({selectedType.duration} mins)</h2>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Select Date</label>
                            <input
                                type="date"
                                value={date}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={e => {
                                    setDate(e.target.value);
                                    fetchSlots(e.target.value, selectedType.id);
                                }}
                                style={{ padding: '8px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>Your Timezone</label>
                            <select
                                value={timezone}
                                onChange={e => {
                                    setTimezone(e.target.value);
                                    fetchSlots(date, selectedType.id, e.target.value);
                                }}
                                style={{ padding: '8px' }}
                                disabled={!mounted}
                            >
                                {allTimezones.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && <p>Searching available times...</p>}

                    <div style={{ marginTop: 20 }}>
                        <h3>Available Times</h3>
                        {!loading && slots.length === 0 && date && (
                            <p style={{ color: '#6b7280' }}>No slots available for this day.</p>
                        )}
                        {!loading && !date && (
                            <p style={{ color: '#6b7280' }}>Please select a date to see available times.</p>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {slots.map((slot, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedSlot(slot)}
                                    style={{
                                        padding: '10px 15px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 6,
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {formatSlotTime(slot.start)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}