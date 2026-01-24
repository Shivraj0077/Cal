// app/api/availability/slots/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { zonedTimeToUTC, formatInTimezone, getDayBoundsInUTC } from '@/lib/timezone';

/**
 * Merge overlapping or adjacent intervals into a single sorted list
 * Preserves originalStart for slot alignment purposes
 */
function mergeIntervals(intervals) {
    if (intervals.length === 0) return [];

    const sorted = intervals.sort((a, b) => a.start - b.start);
    const merged = [{ ...sorted[0] }];

    for (let i = 1; i < sorted.length; i++) {
        const last = merged[merged.length - 1];
        const current = sorted[i];

        if (current.start <= last.end) {
            // Overlapping or adjacent: merge, keeping earlier originalStart
            last.end = Math.max(last.end, current.end);
            if (current.originalStart && (!last.originalStart || current.originalStart < last.originalStart)) {
                last.originalStart = current.originalStart;
            }
        } else {
            // Gap: add as new interval
            merged.push({ ...current });
        }
    }

    return merged;
}

/**
 * Remove a booking interval from a list of available intervals
 * Handles partial and complete overlaps correctly
 * Preserves originalStart for slot alignment purposes
 */
function subtractInterval(intervals, booking) {
    const result = [];

    for (const interval of intervals) {
        // No overlap: keep the entire interval
        if (booking.end <= interval.start || booking.start >= interval.end) {
            result.push(interval);
            continue;
        }

        // Partial or complete overlap: split the interval
        // Keep the part before the booking (preserves originalStart)
        if (booking.start > interval.start) {
            result.push({
                originalStart: interval.originalStart,
                start: interval.start,
                end: booking.start
            });
        }

        // Keep the part after the booking (originalStart still applies)
        if (booking.end < interval.end) {
            result.push({
                originalStart: interval.originalStart,
                start: booking.end,
                end: interval.end
            });
        }
    }

    return result;
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // Booker's requested date (YYYY-MM-DD)
    const eventTypeId = searchParams.get('eventTypeId');
    const hostId = searchParams.get('hostId');
    const bookerTz = searchParams.get('timezone');

    if (!date || !eventTypeId || !hostId || !bookerTz) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Fetch Event Type and Host Timezone
    const { data: eventType, error: eventTypeError } = await supabase
        .from('event_types')
        .select('*, users(timezone)')
        .eq('id', eventTypeId)
        .single();

    if (eventTypeError || !eventType) {
        return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }

    const hostTz = eventType.users.timezone;
    const { duration, buffer_before_min, buffer_after_min, min_notice_mins } = eventType;

    // 2. Define the Search Window in UTC
    // Convert booker's calendar date (in their timezone) to UTC boundaries
    const { start: searchStart, end: searchEnd } = getDayBoundsInUTC(date, bookerTz);

    // 3. Find which host calendar day corresponds to the booker's selected date
    // Use the midpoint of the booker's day to determine the "primary" host date
    const getHostDay = (utcTs) => {
        const d = new Date(utcTs);
        const s = d.toLocaleString('en-US', {
            timeZone: hostTz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/');
        return `${s[2]}-${s[0]}-${s[1]}`;
    };

    // Use midpoint of booker's day to find the primary corresponding host date
    // This ensures we only show slots from "the same day" in the host's timezone
    const midPoint = (searchStart + searchEnd) / 2;
    const primaryHostDate = getHostDay(midPoint);
    const sortedDates = [primaryHostDate];

    // 4. Fetch Rules, Overrides, and Bookings for all relevant host dates
    const weekdays = sortedDates.map(d => new Date(d).getDay());

    const [rulesRes, overridesRes, bookingsRes] = await Promise.all([
        supabase
            .from('availability_rules')
            .select('*')
            .eq('host_id', hostId)
            .in('day_of_week', weekdays),
        supabase
            .from('date_overrides')
            .select('*')
            .eq('host_id', hostId)
            .in('date', sortedDates),
        supabase
            .from('bookings')
            .select('*, event_types(buffer_before_min, buffer_after_min)')
            .eq('host_id', hostId)
            .in('date', sortedDates)
            .eq('status', 'confirmed')
    ]);

    if (rulesRes.error || overridesRes.error || bookingsRes.error) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 5. Build UTC Availability Intervals
    let availableIntervals = [];

    for (const hostDate of sortedDates) {
        const dayOfWeek = new Date(hostDate).getDay();
        const dailyOverrides = overridesRes.data.filter(o => o.date === hostDate);

        let dayWindows = [];

        if (dailyOverrides.length > 0) {
            // Use overrides for this specific date
            const activeOverrides = dailyOverrides.filter(o => o.is_available);
            dayWindows = activeOverrides.map(o => ({
                start: zonedTimeToUTC(hostDate, o.start_time_utc, hostTz).getTime(),
                end: zonedTimeToUTC(hostDate, o.end_time_utc, hostTz).getTime()
            }));
        } else {
            // Use weekly rules for this weekday
            const dailyRules = rulesRes.data.filter(r => r.day_of_week === dayOfWeek);
            dayWindows = dailyRules.map(r => ({
                start: zonedTimeToUTC(hostDate, r.start_time_utc, hostTz).getTime(),
                end: zonedTimeToUTC(hostDate, r.end_time_utc, hostTz).getTime()
            }));
        }

        // Store intervals with BOTH original start (for slot alignment) 
        // and clipped bounds (for filtering)
        for (const interval of dayWindows) {
            const clippedStart = Math.max(interval.start, searchStart);
            const clippedEnd = Math.min(interval.end, searchEnd);
            if (clippedStart < clippedEnd) {
                availableIntervals.push({
                    originalStart: interval.start,  // For slot stepping alignment
                    start: clippedStart,            // Clipped for filtering
                    end: clippedEnd
                });
            }
        }
    }

    // Merge overlapping intervals to create a clean availability window
    availableIntervals = mergeIntervals(availableIntervals);

    // 6. Subtract Bookings (with buffers) from available intervals
    for (const booking of bookingsRes.data) {
        const bBufferBefore = (booking.event_types?.buffer_before_min || 0) * 60000;
        const bBufferAfter = (booking.event_types?.buffer_after_min || 0) * 60000;

        // Parse booking times in UTC
        // Bookings are stored as YYYY-MM-DD and HH:mm in UTC
        const bStart = new Date(`${booking.date}T${booking.start_time_utc}Z`).getTime() - bBufferBefore;
        const bEnd = new Date(`${booking.date}T${booking.end_time_utc}Z`).getTime() + bBufferAfter;

        availableIntervals = subtractInterval(availableIntervals, { start: bStart, end: bEnd });
    }

    // 7. Generate Slots
    const slots = [];
    const nowMs = Date.now();
    const minNoticeMs = min_notice_mins * 60000;

    // CRITICAL: earliestAllowed is in real UTC time, not booker's wall-clock time
    const earliestAllowedMs = nowMs + minNoticeMs;

    const slotDurationMs = duration * 60000;
    const bufferBeforeMs = buffer_before_min * 60000;
    const bufferAfterMs = buffer_after_min * 60000;
    const totalSlotBlock = slotDurationMs + bufferBeforeMs + bufferAfterMs;

    for (const interval of availableIntervals) {
        // Calculate slot stepping from the ORIGINAL start (host's actual availability)
        // This ensures slots stay aligned even when we clip to booker's date window
        const originalStart = interval.originalStart || interval.start;

        // First potential slot starts at originalStart + buffer_before
        let cursor = originalStart + bufferBeforeMs;

        // Skip slots until we reach one that's >= clipped interval start
        while (cursor + slotDurationMs + bufferAfterMs <= interval.end && cursor < interval.start) {
            cursor += totalSlotBlock;
        }

        // Generate slots within the clipped interval
        while (cursor + slotDurationMs + bufferAfterMs <= interval.end) {
            const sStart = cursor;  // Meeting starts at cursor
            const sEnd = cursor + slotDurationMs;  // Meeting ends after duration

            // Filter: only include slots on the booker's selected calendar date
            const slotLocalDate =
                new Date(sStart).toLocaleDateString('en-CA', { timeZone: bookerTz });

            if (slotLocalDate !== date) {
                cursor += totalSlotBlock;
                continue;
            }

            // CRITICAL: Compare slot start time against current UTC time (nowMs + min_notice)
            // NOT against booker's wall-clock time
            if (sStart >= earliestAllowedMs) {
                slots.push({
                    start: formatInTimezone(new Date(sStart), bookerTz),
                    end: formatInTimezone(new Date(sEnd), bookerTz),
                    start_utc: new Date(sStart).toISOString()
                });
            }

            // Move cursor to next potential slot
            cursor += totalSlotBlock;
        }
    }

    return NextResponse.json({ date, slots });
}