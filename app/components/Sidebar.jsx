'use client';

import { useRouter, usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/event-types', icon: '⊞', label: 'Event types' },
    { href: '/availability', icon: '⏰', label: 'Availability' },
    { href: '/dashboard', icon: '⟨⟩', label: 'Dashboard' },
];

const FOOTER_ITEMS = [
    { icon: '↗', label: 'View public page' },
    { icon: '⎘', label: 'Copy public page link' },
    { icon: '⚙', label: 'Settings' },
];

export default function Sidebar({ username = 'Host' }) {
    const router = useRouter();
    const pathname = usePathname();

    function logout() {
        localStorage.removeItem('token');
        router.push('/signIn');
    }

    const initials = username.slice(0, 2).toUpperCase();

    return (
        <aside className="sidebar">
            {/* User */}
            <div className="sidebar-user">
                <div className="sidebar-avatar">{initials}</div>
                <span className="sidebar-username">{username}</span>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>▾</span>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                {NAV_ITEMS.map(item => (
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

            {/* Footer */}
            <div className="sidebar-footer">
                {FOOTER_ITEMS.map(item => (
                    <button key={item.label} className="nav-item">
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
                <button className="nav-item" onClick={logout} style={{ color: '#ef4444' }}>
                    <span className="nav-icon">⎋</span>
                    Sign out
                </button>
            </div>
        </aside>
    );
}
