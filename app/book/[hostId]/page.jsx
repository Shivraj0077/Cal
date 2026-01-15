'use client';

import { useEffect, useState, use } from 'react';

export default function BookingPage({ params }) {
    const { hostId } = use(params);
    const [eventTypes, setEventTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [date, setDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch event types available for this host
    useEffect(() => {
        async function fetchTypes() {
            const res = await fetch(`/api/event-types?hostId=${hostId}`);
            const data = await res.json();
            setEventTypes(data || []);
        }
        fetchTypes();
    }, [hostId]);

    // 2. Fetch slots based on selected date AND event type settings
    async function fetchSlots(selectedDate, eventTypeId) {
        setLoading(true);
        const res = await fetch(
            `/api/availability/slots?hostId=${hostId}&date=${selectedDate}&eventTypeId=${eventTypeId}`
        );
        const data = await res.json();
        setSlots(data.slots || []);
        setLoading(false);
    }

    return (
        <div style={{ padding: 24 }}>
            {!selectedType ? (
                // Step 1: Select Event Type
                <div>
                    <h2>Choose a meeting type</h2>
                    {eventTypes.map(type => (
                        <button key={type.id} onClick={() => setSelectedType(type)} style={{ display: 'block', margin: '10px 0', padding: '20px', width: '200px' }}>
                            <strong>{type.title}</strong><br />
                            {type.duration} mins
                        </button>
                    ))}
                </div>
            ) : (
                // Step 2: Select Date & Slot
                <div>
                    <button onClick={() => { setSelectedType(null); setSlots([]); }}>← Back</button>
                    <h2>Booking: {selectedType.title} ({selectedType.duration} mins)</h2>

                    <input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={e => {
                            setDate(e.target.value);
                            fetchSlots(e.target.value, selectedType.id);
                        }}
                    />

                    {loading && <p>Searching available times...</p>}

                    <div style={{ marginTop: 20 }}>
                        {slots.map((slot, i) => (
                            <button key={i} style={{ margin: 5 }}>
                                {slot.start}
                            </button>
                        ))}
                    </div>
                    <div>
                        {slots.length == 0 && (<p>
                            No slots available for this day!
                        </p>)}
                        </div>
                </div>
            )}
        </div>
    );
}