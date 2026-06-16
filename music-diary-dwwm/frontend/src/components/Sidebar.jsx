import { useEffect, useState } from 'react';
import { Home as HomeIcon, Search, Library, LogOut, Shield, Bell, User, Disc } from 'lucide-react';

function Sidebar({ user, currentTab, setCurrentTab, handleLogout }) {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('http://127.0.0.1:5001/api/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count || 0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Listen for internal changes
        window.addEventListener('unread-notifications-changed', fetchUnreadCount);
        
        // Fetch periodically (every 20s)
        const interval = setInterval(fetchUnreadCount, 20000);

        return () => {
            window.removeEventListener('unread-notifications-changed', fetchUnreadCount);
            clearInterval(interval);
        };
    }, []);

    const navItems = [
        { key: 'home', label: 'Accueil', icon: HomeIcon, action: () => setCurrentTab('home') },
        { key: 'search', label: 'Rechercher', icon: Search, action: () => setCurrentTab('search') },
        { key: 'library', label: 'Ma Bibliothèque', icon: Library, action: () => setCurrentTab('library') },
        { key: 'notifications', label: 'Notifications', icon: Bell, action: () => setCurrentTab('notifications'), badge: unreadCount },
        { key: 'profile', label: 'Mon Profil', icon: User, action: () => window.location.href = '/profile' },
    ];

    if (user?.role === 'ADMIN') {
        navItems.push({ key: 'admin', label: 'Dashboard Admin', icon: Shield, action: () => window.location.href = '/admin' });
    }

    return (
        <div className="w-64 bg-zinc-950/95 border-r border-zinc-900/80 p-6 flex flex-col justify-between hidden md:flex h-screen sticky top-0">
            <div className="space-y-8">
                {/* Logo Section */}
                <div className="flex items-center gap-3.5 px-2 group cursor-pointer animate-fade-in" onClick={() => window.location.href = '/'}>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-all duration-300">
                        <Disc className="text-black stroke-[2.5] animate-spin-slow" size={20} />
                    </div>
                    <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Music Diary</span>
                </div>

                {/* Nav items */}
                <nav className="space-y-2">
                    {navItems.map(({ key, label, icon: Icon, action, badge }) => {
                        const isActive = currentTab === key;
                        return (
                            <button
                                key={key}
                                onClick={action}
                                className={`w-full group flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
                                    isActive
                                        ? 'bg-zinc-900/60 text-white border border-zinc-800/40 shadow-md shadow-black/20'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20 border border-transparent'
                                }`}
                            >
                                <Icon
                                    size={18}
                                    className={`transition-all duration-300 group-hover:scale-105 ${
                                        isActive 
                                            ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.35)]' 
                                            : 'text-zinc-500 group-hover:text-zinc-300'
                                    }`}
                                />
                                <span className="flex-1 text-left">{label}</span>
                                {badge > 0 && (
                                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse">
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Profile footer section */}
            {user && (
                <div className="bg-gradient-to-b from-zinc-900/50 to-zinc-950/20 border border-zinc-900/80 p-4 rounded-2xl flex flex-col gap-3.5 shadow-lg shadow-black/25 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/15 flex items-center justify-center font-black text-sm text-emerald-400 overflow-hidden shadow-inner flex-shrink-0">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user.pseudo.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-sm text-zinc-100 truncate leading-snug">{user.pseudo}</div>
                            <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mt-0.5">
                                {user.role === 'ADMIN' ? 'Administrateur' : 'Membre'}
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 rounded-xl border border-zinc-800/80 hover:border-red-950/40 hover:bg-red-950/10 text-xs text-zinc-400 hover:text-red-400 font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-black/5"
                    >
                        <LogOut size={13} className="text-zinc-500 group-hover:text-red-400 transition-colors" /> Se déconnecter
                    </button>
                </div>
            )}
        </div>
    );
}

export default Sidebar;
