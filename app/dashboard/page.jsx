'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

/* ── HELPERS ── */
const getWeekDays = (relativeDate) => {
    const base = new Date(relativeDate);
    base.setHours(12, 0, 0, 0);
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(base);
    startOfWeek.setDate(diff);
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        d.setHours(0, 0, 0, 0);
        return d;
    });
};

function MiniCalendar({ selectedDate, onSelectDate }) {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = useMemo(() => {
        const res = [];
        for (let i = 0; i < offset; i++) res.push(null);
        for (let d = 1; d <= daysInMonth; d++) res.push(new Date(year, month, d));
        return res;
    }, [month, year, daysInMonth, offset]);
    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    return (
        <div className="mini-cal-widget" style={{ position: 'sticky', top: 0 }}>
            <div className="mini-cal-header">
                <span style={{ fontWeight: 700, fontSize: 15.6 }}>{monthName} {year}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon-xs" onClick={() => setViewDate(new Date(year, month - 1, 1))}>&lt;</button>
                    <button className="btn-icon-xs" onClick={() => setViewDate(new Date(year, month + 1, 1))}>&gt;</button>
                </div>
            </div>
            <div className="mini-cal-grid">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={`${d}-${i}`} className="mini-cal-label">{d}</div>)}
                {days.map((d, i) => (
                    <div key={i} className={`mini-cal-day ${d ? '' : 'empty'} ${d && d.toDateString() === selectedDate.toDateString() ? 'selected' : ''}`} onClick={() => d && onSelectDate(d)}>
                        {d ? d.getDate() : ''}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const scrollRef = useRef(null);
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const HOUR_HEIGHT = 144;

    useEffect(() => {
        setMounted(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (e) {}
        }
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!mounted || !user) {
            if (mounted && !user) setLoading(false);
            return;
        }
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const url = user.role === 'HOST' 
                    ? `/api/bookings?hostId=${user.id}`
                    : `/api/bookings?guestEmail=${user.username.includes('@') ? user.username : user.username + '@example.com'}`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                setBookings(data.bookings || []);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user, mounted]);

    const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
    
    const processedBookings = useMemo(() => {
        return bookings.map(b => {
            const rawTime = b.start_time_utc || '00:00';
            const timeHHmm = rawTime.slice(0, 5);
            const d = new Date(`${b.date}T${timeHHmm}:00.000Z`);
            if (isNaN(d.getTime())) return null;

            const endTimeRaw = b.end_time_utc || '00:00';
            const dEnd = new Date(`${b.date}T${endTimeRaw.slice(0, 5)}:00.000Z`);
            const formatTime = (date) => date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');

            const colors = ['blue', 'purple', 'green', 'orange'];
            const color = colors[Math.abs(b.guest_name?.length || 0) % colors.length];

            return {
                ...b,
                localCompare: d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(),
                localHour: d.getHours(),
                localMin: d.getMinutes(),
                localStartTime: formatTime(d),
                localEndTime: formatTime(dEnd),
                colorClass: `event-block-${color}`
            };
        }).filter(Boolean);
    }, [bookings]);

    const stats = useMemo(() => {
        const now = new Date();
        const upcoming = bookings.filter(b => {
             const t = (b.start_time_utc || '00:00').slice(0, 5);
             return new Date(`${b.date}T${t}:00Z`) >= now;
        });
        return { total: bookings.length, upcoming: upcoming.length, completed: bookings.length - upcoming.length };
    }, [bookings]);

    useEffect(() => {
        if (mounted && scrollRef.current && !loading) {
            const todayCompare = selectedDate.getFullYear() + '-' + selectedDate.getMonth() + '-' + selectedDate.getDate();
            const todayMeetings = processedBookings.filter(b => b.localCompare === todayCompare);
            
            let scrollTargetHour = null;

            if (todayMeetings.length > 0) {
                const earliest = todayMeetings.reduce((min, cur) => cur.localHour < min ? cur.localHour : min, 24);
                scrollTargetHour = earliest;
            } else {
                const hour = currentTime.getHours();
                if (hour >= 7 && hour <= 21) {
                    scrollTargetHour = hour;
                }
            }

            if (scrollTargetHour !== null) {
                const pos = Math.max(0, (scrollTargetHour - 7) * HOUR_HEIGHT);
                scrollRef.current.scrollTo({
                    top: pos - 40,
                    behavior: 'smooth'
                });
            }
        }
    }, [mounted, loading, selectedDate, processedBookings, currentTime, HOUR_HEIGHT]);

    const HOURS = Array.from({ length: 15 }).map((_, i) => i + 7);

    const nowIndicatorPos = useMemo(() => {
        const hour = currentTime.getHours();
        const min = currentTime.getMinutes();
        if (hour < 7 || hour > 21) return null;
        
        const hourIndex = hour - 7;
        const totalMinutesFromStart = hourIndex * 60 + min;
        return totalMinutesFromStart * (HOUR_HEIGHT / 60);
    }, [currentTime, HOUR_HEIGHT]);

    if (!mounted || !user) return null;

    if (user.role === 'BOOKER') {
        const sorted = [...bookings].sort((a,b) => new Date(a.date + 'T' + a.start_time_utc).getTime() - new Date(b.date + 'T' + b.start_time_utc).getTime());
        return (
            <div className="shell">
                <Sidebar />
                <main className="main">
                    <div className="breadcrumb">Home / Dashboard</div>
                    <div className="page-header">
                        <h1 className="page-title">Personal Dashboard</h1>
                        <button className="btn btn-primary" onClick={() => router.push('/')}>Find a Host</button>
                    </div>
                    <div className="dashboard-stats">
                        <div className="stat-card"><div className="stat-label">Total Meetings</div><div className="stat-value">{stats.total}</div></div>
                        <div className="stat-card"><div className="stat-label">Upcoming</div><div className="stat-value">{stats.upcoming}</div></div>
                        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{stats.completed}</div></div>
                        <div className="stat-card"><div className="stat-label">Total Hours</div><div className="stat-value">{(stats.total * 0.5).toFixed(1)}</div></div>
                    </div>
                    <div className="calendar-layout">
                        <div>
                            <div className="card-outer">
                                <div className="card-header-inner"><h3 style={{ margin: 0, fontSize: 16.8, fontWeight: 700 }}>Upcoming Schedule</h3></div>
                                <div style={{ padding: 12 }}>
                                    {!loading && sorted.length === 0 ? <p style={{ color: '#6e6e73', padding: 20 }}>No bookings found.</p> : (
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {sorted.map(b => (
                                                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', border: '1px solid #eaecef', borderRadius: 12 }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 16.8 }}>Meeting with {b.users?.username || 'Host'}</div>
                                                        <div style={{ fontSize: 14.4, color: '#6e6e73' }}>{b.date} at {b.start_time_utc} UTC</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mini-cal-compact">
                            <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                        </div>

                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="shell">
            <Sidebar />
            <main className="main">
                <div className="breadcrumb">Home / Host / Dashboard</div>
                <div className="page-header">
                    <h1 className="page-title">Calendar</h1>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-primary" onClick={() => router.push('/event-types')}>+ New Event</button>
                    </div>
                </div>

                <div className="calendar-layout">
                    <div className="left-panel">
                        <div style={{ transformOrigin: 'top left', transform: 'scale(0.8)', width: '125%', marginBottom: '-20%' }}>
                            <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                        </div>
                        
                        <div className="card-outer" style={{ marginTop: 24 }}>
                            <div className="card-header-inner"><h3 style={{ margin: 0, fontSize: 15.6, fontWeight: 700 }}>Stats</h3></div>
                            <div style={{ padding: 20 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 13.2, color: '#6e6e73', marginBottom: 4 }}>Upcoming</div>
                                    <div style={{ fontSize: 21.6, fontWeight: 700 }}>{stats.upcoming}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13.2, color: '#6e6e73', marginBottom: 4 }}>Completed</div>
                                    <div style={{ fontSize: 21.6, fontWeight: 700 }}>{stats.completed}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="calendar-grid-container">
                        <div className="calendar-toolbar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{ fontWeight: 700, fontSize: 21.6 }}>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn-sm" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }}>&lt;</button>
                                    <button className="btn btn-sm" onClick={() => setSelectedDate(new Date())}>Today</button>
                                    <button className="btn btn-sm" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }}>&gt;</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <select className="btn" style={{ fontSize: 14.4 }}>
                                    <option>Weekly View</option>
                                    <option>Monthly View</option>
                                </select>
                            </div>
                        </div>

                        <div className="calendar-grid" style={{ zIndex: 60 }}>
                            <div style={{ borderBottom: '1px solid var(--border)', borderRight: '1px solid #f1f1f1', background: '#fff' }}></div>
                            {weekDays.map(d => (
                                <div key={d.toISOString()} className={`day-label ${d.toDateString() === new Date().toDateString() ? 'is-today' : ''}`}>
                                    <div style={{ color: '#6e6e73' }}>{d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</div>
                                    <span className="day-number">{d.getDate()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="calendar-grid-wrapper" ref={scrollRef}>
                            <div style={{ position: 'relative', width: '100%' }}>
                                {nowIndicatorPos !== null && (
                                    <div className="now-indicator-line" style={{ top: nowIndicatorPos }}>
                                        <div className="now-indicator-time">
                                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                )}

                                <div className="calendar-grid">
                                    {HOURS.map(hour => (
                                        <React.Fragment key={hour}>
                                            <div className="time-label">{hour === 12 ? '12 PM' : hour > 12 ? `${hour-12} PM` : `${hour} AM`}</div>
                                            {weekDays.map(d => {
                                                const colCompare = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
                                                const meetings = processedBookings.filter(b => b.localCompare === colCompare && b.localHour === hour);
                                                return (
                                                    <div key={d.toISOString()} className="grid-cell">
                                                        {meetings.map(m => (
                                                            <div key={m.id} className={`event-block ${m.colorClass}`} style={{ 
                                                                top: (m.localMin / 60) * HOUR_HEIGHT, 
                                                                height: (m.duration / 60) * HOUR_HEIGHT,
                                                                minHeight: 40,
                                                                zIndex: 20
                                                            }}>
                                                                <div style={{ fontSize: 15.6, marginBottom: 4, fontWeight: 700 }}>{m.guest_name}</div>
                                                                <div style={{ fontSize: 13.2, opacity: 0.8, fontWeight: 500, marginBottom: 8 }}>{m.localStartTime} – {m.localEndTime}</div>
                                                                <div className="event-avatar-group">
                                                                    <div className="event-avatar-mini"></div>
                                                                    {m.guest_name && m.guest_name.length > 5 && <div className="event-avatar-mini" style={{ marginLeft: -4 }}></div>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}