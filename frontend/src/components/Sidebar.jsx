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
        <>            {/* Desktop Sidebar */}
            <div className="w-64 bg-[#07050f]/80 backdrop-blur-xl border-r-2 border-white/10 p-6 flex flex-col justify-between hidden md:flex h-screen sticky top-0 z-40">
                <div className="space-y-8">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 px-2 group cursor-pointer animate-fade-in" onClick={() => window.location.href = '/'}>
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all duration-300">
                            <Disc className="text-white stroke-[2.5] animate-spin-slow" size={16} />
                        </div>
                        <span className="font-modak text-lg tracking-wider text-violet-500 text-stroke-dark uppercase group-hover:text-fuchsia-500 transition-colors">Music Diary</span>
                    </div>

                    {/* Nav items */}
                    <nav className="space-y-3">
                        {navItems.map(({ key, label, icon: Icon, action, badge }) => {
                            const isActive = currentTab === key;
                            return (
                                <button
                                    key={key}
                                    onClick={action}
                                    className={`w-full group flex items-center gap-3 px-4 py-2.5 rounded-xl font-mouse-memoirs uppercase tracking-widest text-sm transition-all duration-200 cursor-pointer border-2 ${
                                        isActive
                                            ? 'bg-white/5 text-white border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]'
                                            : 'text-zinc-400 hover:text-white border-transparent hover:border-white/50 hover:bg-white/5 hover:shadow-[3px_3px_0px_rgba(255,255,255,0.1)]'
                                    }`}
                                >
                                    <Icon
                                        size={16}
                                        className={`transition-all duration-200 group-hover:scale-110 ${
                                            isActive 
                                                ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.35)]' 
                                                : 'text-zinc-500 group-hover:text-zinc-300'
                                        }`}
                                    />
                                    <span className="flex-1 text-left">{label}</span>
                                    {badge > 0 && (
                                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center border border-white shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
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
                    <div className="neobrutal-card p-4 flex flex-col gap-3.5 shadow-[3px_3px_0px_rgba(255,255,255,0.1)] border-2 border-white bg-white/2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border-2 border-white flex items-center justify-center font-black text-sm text-violet-400 overflow-hidden shadow-inner flex-shrink-0">
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
                            className="w-full py-2 neobrutal-btn bg-transparent border-2 border-red-500 hover:bg-red-500 text-red-400 hover:text-white font-mouse-memoirs uppercase tracking-widest text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <LogOut size={13} /> Se déconnecter
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
