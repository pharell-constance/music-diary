import { useEffect, useState } from 'react';
import { Home as HomeIcon, Search, Library, LogOut, Shield, Bell, User } from 'lucide-react';

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

    return (
        <div className="w-64 bg-[#000000] p-6 flex flex-col justify-between hidden md:flex">
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-[#1DB954] rounded-full"></div>
                    <span className="font-bold text-xl tracking-tight">Music Diary</span>
                </div>

                <nav className="space-y-4">
                    <button 
                        onClick={() => setCurrentTab('home')} 
                        className={`w-full text-left flex items-center gap-4 font-bold text-sm transition ${currentTab === 'home' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'}`}
                    >
                        <HomeIcon size={20} /> Accueil
                    </button>
                    <button 
                        onClick={() => setCurrentTab('search')} 
                        className={`w-full text-left flex items-center gap-4 font-bold text-sm transition ${currentTab === 'search' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'}`}
                    >
                        <Search size={20} /> Rechercher
                    </button>
                    <button 
                        onClick={() => setCurrentTab('library')} 
                        className={`w-full text-left flex items-center gap-4 font-bold text-sm transition ${currentTab === 'library' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'}`}
                    >
                        <Library size={20} /> Ma Bibliothèque
                    </button>
                    <button 
                        onClick={() => setCurrentTab('notifications')} 
                        className={`w-full text-left flex items-center gap-4 font-bold text-sm transition ${currentTab === 'notifications' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'}`}
                    >
                        <Bell size={20} /> Notifications
                        {unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse ml-auto">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => window.location.href = '/profile'}
                        className={`w-full text-left flex items-center gap-4 font-bold text-sm transition ${currentTab === 'profile' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'}`}
                    >
                        <User size={20} /> Mon Profil
                    </button>
                    {user?.role === 'ADMIN' && (
                        <button 
                            onClick={() => window.location.href = '/admin'}
                            className={`w-full text-left flex items-center gap-4 font-bold text-sm transition ${currentTab === 'admin' ? 'text-white' : 'text-[#A7A7A7] hover:text-white'}`}
                        >
                            <Shield size={20} className={currentTab === 'admin' ? 'text-emerald-500' : ''} /> Dashboard Admin
                        </button>
                    )}
                </nav>
            </div>

            {user && (
                <div className="bg-[#121212] p-4 rounded-lg flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center font-bold text-sm text-emerald-400 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user.pseudo.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <span className="font-bold text-sm truncate">{user.pseudo}</span>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="text-xs text-[#A7A7A7] hover:text-white text-left flex items-center gap-2"
                    >
                        <LogOut size={14} /> Se déconnecter
                    </button>
                </div>
            )}
        </div>
    );
}

export default Sidebar;
