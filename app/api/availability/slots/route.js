import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { zonedTimeToUTC, formatInTimezone, getDayBoundsInUTC } from '@/lib/timezone';

function mergeIntervals(intervals) {
    if (intervals.length === 0) return [];

    intervals.sort((a, b) => a.start - b.start);

    const merged = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length - 1];
        const curr = intervals[i];

        if (curr.start <= last.end) {
            last.end = Math.max(last.end, curr.end);
        } else {
            merged.push(curr);
        }
    }

    return merged;
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);

    const date = searchParams.get('date');
    const hostId = searchParams.get('hostId');
    const eventTypeId = searchParams.get('eventTypeId');
    const bookerTz = searchParams.get('timezone');

    if (!date || !hostId || !eventTypeId || !bookerTz) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: eventType } = await supabase
        .from('event_types')
        .select('*, users(timezone)')
        .eq('id', eventTypeId)
        .single();

    if (!eventType) {
        return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    const hostTz = eventType.users.timezone;

    const {
        duration,
        buffer_before_min,
        buffer_after_min,
        min_notice_mins
    } = eventType;

    const { start: dayStartUTC, end: dayEndUTC } =
        getDayBoundsInUTC(date, bookerTz);

    const hostDay = new Date(
        new Date(date + 'T12:00:00Z').toLocaleString('en-US', { timeZone: hostTz })
    ).getDay();

    const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('host_id', hostId)
        .eq('day_of_week', hostDay);

    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, event_types(buffer_before_min, buffer_after_min)')
        .eq('host_id', hostId)
        .eq('status', 'confirmed');

    /* ===========================
       Build availability windows
       =========================== */

    let availability = [];

    for (const rule of rules) {
        const startUTC = zonedTimeToUTC(date, rule.start_time_utc, hostTz).getTime();
        const endUTC = zonedTimeToUTC(date, rule.end_time_utc, hostTz).getTime();

        const clippedStart = Math.max(startUTC, dayStartUTC);
        const clippedEnd = Math.min(endUTC, dayEndUTC);

        if (clippedStart < clippedEnd) {
            availability.push({ start: clippedStart, end: clippedEnd });
        }
    }

    /* ===========================
       Build busy intervals first
       =========================== */

    const busyIntervals = [];

    for (const booking of bookings) {
        const before = (booking.event_types?.buffer_before_min || 0) * 60000;
        const after = (booking.event_types?.buffer_after_min || 0) * 60000;

        const start =
            new Date(`${booking.date}T${booking.start_time_utc}Z`).getTime() - before;

        const end =
            new Date(`${booking.date}T${booking.end_time_utc}Z`).getTime() + after;

        // Only consider bookings overlapping requested window
        if (end > dayStartUTC && start < dayEndUTC) {
            busyIntervals.push({
                start: Math.max(start, dayStartUTC),
                end: Math.min(end, dayEndUTC)
            });
        }
    }

    const mergedBusy = mergeIntervals(busyIntervals);

    /* ===========================
       Subtract busy from availability
       =========================== */

    for (const busy of mergedBusy) {
        availability = availability.flatMap(interval => {
            if (busy.end <= interval.start || busy.start >= interval.end) {
                return [interval];
            }

            const res = [];

            if (busy.start > interval.start) {
                res.push({ start: interval.start, end: busy.start });
            }

            if (busy.end < interval.end) {
                res.push({ start: busy.end, end: interval.end });
            }

            return res;
        });
    }

    /* ===========================
       Slot generation
       =========================== */

    const slots = [];
    const now = Date.now();
    const earliest = now + min_notice_mins * 60000;

    const durationMs = duration * 60000;
    const step =
        durationMs +
        buffer_before_min * 60000 +
        buffer_after_min * 60000;

    for (const interval of availability) {
        let cursor = interval.start + buffer_before_min * 60000;

        while (cursor + durationMs <= interval.end) {
            if (cursor >= earliest) {
                slots.push({
                    start: formatInTimezone(new Date(cursor), bookerTz),
                    end: formatInTimezone(new Date(cursor + durationMs), bookerTz),
                    start_utc: new Date(cursor).toISOString()
                });
            }

            cursor += step;
        }
    }

    return NextResponse.json({ date, slots });
}
