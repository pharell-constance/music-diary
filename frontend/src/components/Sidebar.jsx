import { useEffect, useState } from 'react';
import { Home as HomeIcon, Search, Library, LogOut, Shield, Bell, User, Disc, Music } from 'lucide-react';

function Sidebar({ user, currentTab, setCurrentTab, handleLogout }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentSong, setCurrentSong] = useState(() => window.spotifyCurrentSong || null);
    const [isPlaying, setIsPlaying] = useState(() => window.spotifyIsPlaying || false);
    const [isLocalPlaying, setIsLocalPlaying] = useState(false);

    // Fetch live playback status from Spotify
    const fetchSpotifyLive = async () => {
        if (isLocalPlaying) return;

        const token = localStorage.getItem('token');
        if (!token || !user?.id) return;

        try {
            const res = await fetch(`http://127.0.0.1:5001/api/users/${user.id}/live`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.isPlaying) {
                    const trackId = data.spotifyUrl?.split('/').pop() || 'spotify-live';
                    setCurrentSong({
                        id: trackId,
                        name: data.trackName,
                        artist: data.artistName,
                        cover: data.albumCover,
                        isSpotifyLive: true
                    });
                    setIsPlaying(true);
                } else {
                    // Only clear if the current song was a Spotify live song
                    setCurrentSong(prev => {
                        if (prev?.isSpotifyLive) {
                            setIsPlaying(false);
                            return null;
                        }
                        return prev;
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching Spotify live playback:", err);
        }
    };

    useEffect(() => {
        const handlePlay = (e) => {
            const songData = e.detail;
            setCurrentSong({
                id: songData.id,
                name: songData.name,
                artist: songData.artist,
                cover: songData.cover,
                isSpotifyLive: false
            });
            setIsPlaying(true);
            setIsLocalPlaying(true);
            window.spotifyCurrentSong = {
                ...songData,
                isSpotifyLive: false
            };
            window.spotifyIsPlaying = true;
        };
        const handlePause = () => {
            setIsPlaying(false);
            setIsLocalPlaying(false);
            window.spotifyIsPlaying = false;
        };

        window.addEventListener('spotify-play', handlePlay);
        window.addEventListener('spotify-pause', handlePause);

        return () => {
            window.removeEventListener('spotify-play', handlePlay);
            window.removeEventListener('spotify-pause', handlePause);
        };
    }, []);

    useEffect(() => {
        // Poll Spotify live playback every 5 seconds
        fetchSpotifyLive();
        const interval = setInterval(fetchSpotifyLive, 5000);

        return () => clearInterval(interval);
    }, [user?.id, isLocalPlaying]);

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
        <>            {/* Desktop Sidebar */}            <div className="w-64 bg-[#07050f]/80 backdrop-blur-xl border-r-2 border-white/10 p-6 flex flex-col justify-between hidden md:flex h-screen sticky top-0 z-40 overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-44 h-44 bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-10 rounded-full blur-[60px] pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 px-2 group cursor-pointer animate-fade-in" onClick={() => window.location.href = '/'}>
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all duration-300">
                            <Disc className="text-white stroke-[2.5] animate-spin-slow" size={16} />
                        </div>
                        <span className="font-modak text-lg tracking-wider text-violet-500 text-stroke-dark uppercase group-hover:text-fuchsia-500 transition-colors">Music Diary</span>
                    </div>
 
                    {/* Nav items */}
                    <nav className="space-y-2">
                        {navItems.map(({ key, label, icon: Icon, action, badge }) => {
                            const isActive = currentTab === key;
                            return (
                                <button
                                    key={key}
                                    onClick={action}
                                    className={`w-full group flex items-center gap-3 px-4 py-2.5 rounded-xl font-mouse-memoirs uppercase tracking-widest text-sm transition-all duration-200 cursor-pointer border-2 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 text-white border-violet-400 shadow-[3px_3px_0px_rgba(139,92,246,0.3)]'
                                            : 'text-zinc-400 hover:text-white border-transparent hover:border-white/20 hover:bg-white/[0.03] hover:shadow-[3px_3px_0px_rgba(255,255,255,0.05)]'
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

                    {/* Decorative Cover Art & Music visualizer Widget */}
                    {currentSong && isPlaying && (
                        <div className="bg-zinc-950/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group w-full">
                            {/* Active Song Player Display */}
                            <div 
                                onClick={() => {
                                    if (currentSong && currentSong.id !== 'spotify-live') {
                                        window.location.href = `/song/${currentSong.id}`;
                                    }
                                }}
                                className="w-full flex flex-col items-center gap-3.5 cursor-pointer group/player z-10"
                            >
                                {/* Square Album Art Cover */}
                                <div className="w-16 h-16 bg-zinc-800 border-2 border-white/20 rounded-xl overflow-hidden shadow-lg flex-shrink-0 flex items-center justify-center relative">
                                    {currentSong.cover ? (
                                        <img 
                                            src={currentSong.cover} 
                                            alt={currentSong.name} 
                                            className="w-full h-full object-cover group-hover/player:scale-105 transition-transform duration-300" 
                                        />
                                    ) : (
                                        <Music className="text-zinc-500" size={24} />
                                    )}
                                </div>

                                <div className="text-center min-w-0 w-full px-1">
                                    <span className="font-mouse-memoirs text-[9px] tracking-widest uppercase text-fuchsia-400 flex items-center justify-center gap-1.5">
                                        {currentSong.isSpotifyLive && (
                                            <span className="w-1.5 h-1.5 bg-[#1DB954] rounded-full animate-pulse" style={{ boxShadow: '0 0 6px #1DB954' }} />
                                        )}
                                        {currentSong.isSpotifyLive ? 'Sur Spotify' : 'En Cours de Lecture'}
                                    </span>
                                    <h4 className="font-bold text-xs text-white truncate uppercase tracking-wider mt-0.5 group-hover/player:text-violet-400 transition-colors duration-200" title={currentSong.name}>
                                        {currentSong.name}
                                    </h4>
                                    <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-medium">
                                        {currentSong.artist}
                                    </p>
                                </div>
                            </div>

                            {/* Pulsing visualizer bars */}
                            <div className="flex items-end gap-0.5 h-2.5 mt-0.5 z-10">
                                <span className="w-0.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.8s' }} />
                                <span className="w-0.5 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
                                <span className="w-0.5 h-1 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.0s', animationDuration: '0.7s' }} />
                                <span className="w-0.5 h-2.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.9s' }} />
                                <span className="w-0.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.5s' }} />
                            </div>
                        </div>
                    )}
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
