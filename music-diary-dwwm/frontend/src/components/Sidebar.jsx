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

    if (user?.role === 'ADMIN' || user?.role === 'OWNER') {
        navItems.push({ key: 'admin', label: 'Dashboard Admin', icon: Shield, action: () => window.location.href = '/admin' });
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="w-64 bg-white/[0.01] backdrop-blur-xl border-r border-white/[0.05] p-6 flex flex-col justify-between hidden md:flex h-screen sticky top-0 z-40">
                <div className="space-y-8">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3.5 px-2 group cursor-pointer animate-fade-in" onClick={() => window.location.href = '/'}>
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.25)] group-hover:scale-105 transition-all duration-300">
                            <Disc className="text-white stroke-[2.5] animate-spin-slow" size={20} />
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
                                            ? 'bg-white/[0.04] text-white border border-white/[0.07] shadow-md shadow-black/20'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] border border-transparent'
                                    }`}
                                >
                                    <Icon
                                        size={18}
                                        className={`transition-all duration-300 group-hover:scale-105 ${
                                            isActive 
                                                ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.35)]' 
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
                    <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl flex flex-col gap-3.5 shadow-lg shadow-black/25 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/15 flex items-center justify-center font-black text-sm text-violet-400 overflow-hidden shadow-inner flex-shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.pseudo.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-sm text-zinc-100 truncate leading-snug">{user.pseudo}</div>
                                <div className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mt-0.5">
                                    {user.role === 'OWNER' ? (
                                        <span className="bg-gradient-to-r from-yellow-400 to-amber-550 bg-clip-text text-transparent font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.25)]">Propriétaire</span>
                                    ) : user.role === 'ADMIN' ? (
                                        'Administrateur'
                                    ) : (
                                        'Membre'
                                    )}
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

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0a12]/95 border-t border-white/[0.05] py-2 px-3 flex justify-around items-center z-50 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
                {navItems.map(({ key, label, icon: Icon, action, badge }) => {
                    const isActive = currentTab === key;
                    return (
                        <button
                            key={key}
                            onClick={action}
                            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-300 relative ${
                                isActive ? 'text-white' : 'text-zinc-500'
                            }`}
                        >
                            <div className="relative">
                                <Icon
                                    size={20}
                                    className={`transition-all duration-300 ${
                                        isActive ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.35)] scale-110' : 'text-zinc-500'
                                    }`}
                                />
                                {badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white font-black text-[8px] flex items-center justify-center shadow-[0_0_5px_rgba(239,68,68,0.4)] animate-pulse">
                                        {badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider scale-90 mt-0.5">
                                {key === 'library' ? 'Biblio' : key === 'admin' ? 'Admin' : label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}

export default Sidebar;
