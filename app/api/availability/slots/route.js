// app/api/availability/slots/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const toMinutes = t => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
};

const toTime = m =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const eventTypeId = searchParams.get('eventTypeId');
    const hostId = searchParams.get('hostId');

    if (!date || !eventTypeId || !hostId) {
        return NextResponse.json({ error: 'date, eventTypeId & hostId required' }, { status: 400 });
    }

    // 1. Get event type details
    const { data: eventType, error: eventTypeError } = await supabase
        .from('event_types')
        .select('*')
        .eq('id', eventTypeId)
        .eq('host_id', hostId)
        .single();

    if (eventTypeError) {
        return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    const { duration, buffer_before_min, buffer_after_min, min_notice_mins } = eventType;

    // 2. Check minimum notice window
    const now = new Date();
    const selectedDate = new Date(date + 'T00:00:00');
    const minNoticeMs = min_notice_mins * 60 * 1000;
    const earliestBookingTime = new Date(now.getTime() + minNoticeMs);

    if (selectedDate < new Date(now.toDateString())) {
        return NextResponse.json({ date, slots: [] }); // Past date
    }

    const weekday = selectedDate.getDay();

    // 3. Fetch Rules, Overrides, and Bookings
    const [rulesRes, overridesRes, bookingsRes] = await Promise.all([
        supabase.from('availability_rules').select('*').eq('host_id', hostId).eq('day_of_week', weekday),
        supabase.from('date_overrides').select('*').eq('host_id', hostId).eq('date', date),
        supabase.from('bookings').select('*, event_types(buffer_before_min, buffer_after_min)')
            .eq('host_id', hostId).eq('date', date).eq('status', 'confirmed')
    ]);

    if (rulesRes.error) return NextResponse.json({ error: rulesRes.error.message }, { status: 500 });
    if (overridesRes.error) return NextResponse.json({ error: overridesRes.error.message }, { status: 500 });
    if (bookingsRes.error) return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 });

    const rules = rulesRes.data;
    const overrides = overridesRes.data;
    const bookings = bookingsRes.data;

    let windows = [];

    // 4. Determine base windows
    if (overrides.length > 0) {
        const availableOverride = overrides.filter(o => o.is_available);
        if (availableOverride.length === 0) {
            return NextResponse.json({ date, slots: [] });
        }
        windows = availableOverride.map(o => ({
            start: toMinutes(o.start_time),
            end: toMinutes(o.end_time)
        }));
    } else {
        if (rules.length === 0) {
            return NextResponse.json({ date, slots: [] });
        }
        windows = rules.map(r => ({
            start: toMinutes(r.start_time),
            end: toMinutes(r.end_time)
        }));
    }

    // 5. Subtract bookings with their buffers from windows
    let availableSegments = [...windows];

    for (const booking of bookings) {
        const bookingBufferBefore = booking.event_types?.buffer_before_min || 0;
        const bookingBufferAfter = booking.event_types?.buffer_after_min || 0;

        const bStart = toMinutes(booking.start_time) - bookingBufferBefore;
        const bEnd = toMinutes(booking.end_time) + bookingBufferAfter;

        const nextSegments = [];
        for (const segment of availableSegments) {
            if (bEnd <= segment.start || bStart >= segment.end) {
                nextSegments.push(segment);
            } else {
                if (bStart > segment.start) {
                    nextSegments.push({ start: segment.start, end: bStart });
                }
                if (bEnd < segment.end) {
                    nextSegments.push({ start: bEnd, end: segment.end });
                }
            }
        }
        availableSegments = nextSegments;
    }

    // 6. Generate slots from available segments with buffers
    const slots = [];
    const totalSlotDuration = duration + buffer_before_min + buffer_after_min;

    for (const segment of availableSegments) {
        let cursor = segment.start;
        while (cursor + totalSlotDuration <= segment.end) {
            const slotStartTime = cursor + buffer_before_min; // Actual meeting start
            const slotEndTime = slotStartTime + duration;

            // Create datetime for minimum notice check
            const slotDateTime = new Date(date);
            slotDateTime.setHours(Math.floor(slotStartTime / 60));
            slotDateTime.setMinutes(slotStartTime % 60);

            // Only include slot if it's after minimum notice period
            if (slotDateTime >= earliestBookingTime) {
                slots.push({
                    start: toTime(slotStartTime),
                    end: toTime(slotEndTime)
                });
            }

            cursor += totalSlotDuration; // Move to next slot position (including buffers)
        }
    }

    return NextResponse.json({ date, slots });
}