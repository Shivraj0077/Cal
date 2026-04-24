'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        successful: 0,
        conflicts: 18,
        expired: 9,
        retries: 34
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const url = user.role === 'HOST' 
                    ? `/api/bookings?hostId=${user.userId}`
                    : `/api/bookings?guestEmail=${user.username.includes('@') ? user.username : user.username + '@example.com'}`;
                
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                const allBookings = data.bookings || [];
                setBookings(allBookings);
                
                if (user.role === 'HOST') {
                   setStats(prev => ({
                       ...prev,
                       successful: allBookings.filter(b => b.status === 'confirmed').length
                   }));
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (!user) return null;

    return (
        <div className="shell">
            <Sidebar />
            <main className="main">
                <div className="breadcrumb">
                    🏠 <span>/</span> Dashboard <span>/</span> <span>Overview</span>
                </div>

                <div className="page-header">
                    <h1 className="page-title">{user.role === 'HOST' ? 'Host Dashboard' : 'My Bookings'}</h1>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn">Share Link</button>
                        <button className="btn btn-primary" onClick={() => router.push('/event-types')}>+ Add Event</button>
                    </div>
                </div>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <div className="stat-label">Successful Bookings</div>
                        <div className="stat-value">{stats.successful}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Conflicts Prevented</div>
                        <div className="stat-value">{stats.conflicts}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Expired Reservations</div>
                        <div className="stat-value">{stats.expired}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Retry Attempts</div>
                        <div className="stat-value">{stats.retries}</div>
                    </div>
                </div>

                <div className="calendar-layout">
                    {/* Activity Feed / List */}
                    <div className="mini-cal">
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Upcoming Meetings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {loading ? (
                                <p style={{ color: '#6b7280', fontSize: 13 }}>Loading...</p>
                            ) : bookings.length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: 13 }}>No meetings scheduled.</p>
                            ) : (
                                bookings.map(b => (
                                    <div key={b.id} style={{ padding: '12px 14px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #eaecef' }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{b.guest_name}</div>
                                        <div style={{ fontSize: 11, color: '#6e6e73' }}>
                                            {new Date(b.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {b.start_time_utc}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Timeline Grid Simulation */}
                    <div className="calendar-grid-container">
                        <div className="calendar-toolbar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{ fontWeight: 700 }}>Weekly View</span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn-sm">‹</button>
                                    <button className="btn btn-sm">Today</button>
                                    <button className="btn btn-sm">›</button>
                                </div>
                            </div>
                            <div style={{ fontSize: 13, color: '#6e6e73' }}>{user.timezone}</div>
                        </div>
                        <div className="calendar-grid">
                            <div className="grid-header"></div>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="day-label">{day}</div>
                            ))}
                            
                            {[9, 10, 11, 12, 13, 14, 15, 16].map(hour => (
                                <React.Fragment key={hour}>
                                    <div className="time-label">{hour}:00</div>
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={i} className="grid-cell">
                                            {/* Simulate some events */}
                                            {hour === 11 && i === 1 && (
                                                <div className="event-block" style={{ top: 10, height: 60, background: '#eef2ff', borderColor: '#4f46e5', color: '#4f46e5' }}>
                                                    Onboarding
                                                </div>
                                            )}
                                            {hour === 14 && i === 3 && (
                                                <div className="event-block" style={{ top: 0, height: 40, background: '#f0fdf4', borderColor: '#16a34a', color: '#16a34a' }}>
                                                    Sync
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}