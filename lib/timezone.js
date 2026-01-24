// Converts a date and time string in a specific timezone to a UTC Date object.
// Uses an iterative refinement loop to handle DST and complex offsets safely.
export function zonedTimeToUTC(dateStr, timeStr, timeZone) {
    const [h, m] = timeStr.split(':').map(Number);

    // 1. Create a "nominal" UTC date (as if wall clock was UTC)
    const nominal = new Date(`${dateStr}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00Z`);

    // 2. We need to find the offset (Wall - UTC) for this timezone at this specific wall time.
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    let utcTs = nominal.getTime();
    // 2-step refinement handles all edge cases including DST shifts
    for (let i = 0; i < 2; i++) {
        const d = new Date(utcTs);
        const parts = formatter.formatToParts(d);
        const map = Object.fromEntries(parts.map(p => [p.type, p.value]));

        // Construct the 'Wall Clock' timestamp as if it were UTC
        const wallTs = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);

        // Offset = Wall - UTC
        const offset = wallTs - utcTs;

        // Correct the UTC timestamp: UTC = Wall - Offset
        utcTs = nominal.getTime() - offset;
    }

    return new Date(utcTs);
}

// Returns the UTC range [start, end] for a 24-hour period (YYYY-MM-DD) in a specific timezone.
export function getDayBoundsInUTC(dateStr, timeZone) {
    const start = zonedTimeToUTC(dateStr, "00:00", timeZone);
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    const nextDayStr = d.toISOString().split('T')[0];
    const end = zonedTimeToUTC(nextDayStr, "00:00", timeZone);
    return { start: start.getTime(), end: end.getTime() };
}

// Formats a UTC Date object into a 'HH:mm' string for a specific timezone.
export function formatInTimezone(date, timeZone) {
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone
    });
}

// Basic auto-detection of the environment's timezone.
export function detectTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Returns a list of all IANA timezones supported by the environment.
export function getAllTimezones() {
    return Intl.supportedValuesOf('timeZone');
}