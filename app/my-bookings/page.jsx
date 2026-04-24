'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function MyBookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [user] = useState(() => {
        if (typeof window === 'undefined') return null;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { return JSON.parse(storedUser); } catch (e) { return null; }
        }
        return null;
    });

    useEffect(() => {
        async function fetchBookings() {
            const token = localStorage.getItem('token');
            if (!token || !user) return;

            const guestEmail = user.username.includes('@') ? user.username : `${user.username}@example.com`;

            try {
                const res = await fetch(`/api/bookings?guestEmail=${guestEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setBookings(data.bookings || []);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            }
            setLoading(false);
        }
        fetchBookings();
    }, [user]);

    const TABS = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'unconfirmed', label: 'Unconfirmed' },
        { id: 'recurring', label: 'Recurring' },
        { id: 'past', label: 'Past' },
        { id: 'canceled', label: 'Canceled' }
    ];

    return (
        <div className="shell">
            <Sidebar />
            <main className="main" style={{ background: '#fcfcfc' }}>
                <div className="bookings-page-container">
                    <header className="page-header-v2">
                        <h1 className="page-title-v2">Bookings</h1>
                        <p className="page-subtitle-v2">Comprehensive overview of all your scheduled synchronization events and meetings.</p>
                    </header>

                    <div className="toolbar-v2">
                        <div className="tabs-container-v2">
                            {TABS.map(tab => (
                                <button 
                                    key={tab.id} 
                                    className={`tab-btn-v2 ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="toolbar-actions-v2">
                            <div style={{ flex: 1 }}></div>
                        </div>
                    </div>

                    <div className="bookings-content-v2">
                        {loading ? (
                            <div className="empty-state-v2">
                                <p style={{ fontSize: 16, color: '#6e6e73' }}>Synchronizing your calendar data...</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="empty-state-v2">
                                <div className="empty-icon-box-v2"></div>
                                <h2 className="empty-title-v2">No upcoming bookings</h2>
                                <p className="empty-desc-v2">
                                    Your schedule is currently clear. Once you book a session with a host, the details will materialize here for your review and management.
                                </p>
                                <button className="btn btn-primary" onClick={() => router.push('/')}>Discover Hosts</button>
                            </div>
                        ) : (
                            <div className="bookings-list-v2">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="booking-row-v2">
                                        <div className="booking-info-v2">
                                            <div className="booking-title-rich">
                                                {booking.event_types?.title} with {booking.users?.username || 'Host'}
                                            </div>
                                            <div className="booking-meta-rich">
                                                <span>{new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                                <span>{booking.start_time_utc} UTC</span>
                                                <span style={{ textTransform: 'capitalize' }}>{booking.status}</span>
                                            </div>
                                        </div>
                                        <div className="booking-actions-v2" style={{ display: 'flex', gap: 12 }}>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
