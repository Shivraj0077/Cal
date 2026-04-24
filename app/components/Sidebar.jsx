'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const GENERAL_NAV = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/availability', icon: '🗓', label: 'Calendar' }, // Reusing availability as a "Calendar" placeholder for hosts
    { href: '/event-types', icon: '⊞', label: 'Event Types' },
];

const OTHER_NAV = [
    { href: '/settings', icon: '⚙', label: 'Settings' },
];

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user] = useState(() => {
        if (typeof window === 'undefined') return null;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { return JSON.parse(storedUser); } catch (e) { return null; }
        }
        return null;
    });

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/signIn');
    }

    const nameToDisplay = user?.username || 'User';
    const initials = nameToDisplay.slice(0, 2).toUpperCase();

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span style={{ fontSize: 24 }}>📅</span> <span>BookWise</span>
            </div>

            <div className="sidebar-section-label">General</div>
            <nav className="sidebar-nav">
                {GENERAL_NAV.map(item => (
                    <button
                        key={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                        onClick={() => router.push(item.href)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-section-label">Other</div>
            <nav className="sidebar-nav">
                {OTHER_NAV.map(item => (
                    <button
                        key={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                        onClick={() => router.push(item.href)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
                <button className="nav-item" onClick={logout} style={{ color: '#ef4444' }}>
                    <span className="nav-icon">⎋</span>
                    Sign out
                </button>
            </nav>

            <div className="sidebar-user-anchor">
                <div className="sidebar-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initials}</div>
                <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{nameToDisplay}</div>
                    <div className="sidebar-user-email">{user?.role?.toLowerCase() || 'user'}</div>
                </div>
            </div>
        </aside>
    );
}
