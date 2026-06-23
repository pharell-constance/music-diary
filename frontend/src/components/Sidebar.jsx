import API_URL from '../config.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Search, Library, LogOut, Shield, Bell, User, Disc, Music, Sun, Moon, Trophy } from 'lucide-react';

function Sidebar({ user, currentTab, setCurrentTab, handleLogout }) {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentSong, setCurrentSong] = useState(() => window.spotifyCurrentSong || null);
    const [isPlaying, setIsPlaying] = useState(() => window.spotifyIsPlaying || false);
    const [isLocalPlaying, setIsLocalPlaying] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        if (theme === 'light') {
            root.classList.add('light');
            body.classList.add('light');
        } else {
            root.classList.remove('light');
            body.classList.remove('light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Fetch live playback status from Spotify
    const fetchSpotifyLive = async () => {
        if (isLocalPlaying) return;

        const token = localStorage.getItem('token');
        if (!token || !user?.id) return;

        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/live`, {
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
                        albumName: data.albumName,
                        durationMs: data.durationMs,
                        previewUrl: data.previewUrl,
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
                albumName: songData.albumName || songData.album?.name || "",
                durationMs: songData.durationMs || songData.duration_ms || 0,
                previewUrl: songData.previewUrl || songData.preview_url || null,
                isSpotifyLive: false
            });
            setIsPlaying(true);
            setIsLocalPlaying(true);
            window.spotifyCurrentSong = {
                ...songData,
                albumName: songData.albumName || songData.album?.name || "",
                durationMs: songData.durationMs || songData.duration_ms || 0,
                previewUrl: songData.previewUrl || songData.preview_url || null,
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
            const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
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

    const navItems = [];
    if (user?.role === 'ADMIN' || user?.role === 'OWNER') {
        navItems.push({ key: 'admin', label: 'Dashboard Admin', icon: Shield, action: () => navigate('/admin') });
    } else {
        navItems.push(
            { key: 'home', label: 'Accueil', icon: HomeIcon, action: () => setCurrentTab('home') },
            { key: 'search', label: 'Rechercher', icon: Search, action: () => setCurrentTab('search') },
            { key: 'blindtest', label: 'Jeux', icon: Trophy, action: () => setCurrentTab('blindtest') },
            { key: 'library', label: 'Ma Bibliothèque', icon: Library, action: () => setCurrentTab('library') },
            { key: 'notifications', label: 'Notifications', icon: Bell, action: () => setCurrentTab('notifications'), badge: unreadCount },
            { key: 'profile', label: 'Mon Profil', icon: User, action: () => navigate('/profile') }
        );
    }

    return (
        <>
            {/* Mobile Floating Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="md:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl border-2 border-white/10 bg-zinc-950/80 text-zinc-400 shadow-lg backdrop-blur-md cursor-pointer theme-toggle-btn"
                aria-label="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={18} className="text-amber-400 animate-spin-slow" style={{ animationDuration: '6s' }} /> : <Moon size={18} className="text-indigo-400" />}
            </button>

            {/* Desktop Sidebar Placeholder (takes up space in flex container) */}
            <div className="w-64 shrink-0 hidden md:block" />

            {/* Desktop Sidebar (fixed positioning) */}
            <div className="sidebar-container w-64 bg-[#07050f]/80 backdrop-blur-xl border-r-2 border-white/10 p-6 flex flex-col justify-between hidden md:flex h-screen fixed top-0 left-0 z-40 overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-44 h-44 bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-10 rounded-full blur-[60px] pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 px-2 group cursor-pointer animate-fade-in" onClick={() => window.location.href = '/'}>
                        <div className="w-10 h-10 bg-violet-600 border-2.5 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#ffffff] group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_#000000] dark:group-hover:shadow-[4px_4px_0px_#ffffff] transition-all duration-300">
                            <Disc className="text-white stroke-[2.5] animate-spin-slow" style={{ animationDuration: '8s' }} size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-mouse-memoirs text-[26px] tracking-wider leading-none text-stroke-dark text-white group-hover:text-violet-400 transition-colors uppercase">
                                Music
                            </span>
                            <span className="font-mouse-memoirs text-[26px] tracking-wider leading-none text-stroke-dark text-violet-500 group-hover:text-fuchsia-500 transition-colors uppercase -mt-1">
                                Diary
                            </span>
                        </div>
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
                        
                        {/* Theme Toggle Switch */}
                        <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl font-mouse-memoirs uppercase tracking-widest text-xs border border-white/10 bg-zinc-900/30 text-zinc-400 theme-toggle-container select-none">
                            <span className="flex items-center gap-2">
                                {theme === 'dark' ? (
                                    <Moon size={14} className="text-indigo-400" />
                                ) : (
                                    <Sun size={14} className="text-amber-500 animate-spin-slow" style={{ animationDuration: '6s' }} />
                                )}
                                {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
                            </span>
                            
                            {/* Sliding Track */}
                            <button
                                onClick={toggleTheme}
                                className={`w-10 h-6 p-0 rounded-full border-2 transition-colors duration-300 relative flex items-center cursor-pointer outline-none focus:outline-none ${
                                    theme === 'dark' ? 'bg-violet-600 border-white/20' : 'bg-zinc-300 border-zinc-400'
                                }`}
                                aria-label="Toggle Theme"
                            >
                                {/* Sliding Thumb */}
                                <div 
                                    className="w-4 h-4 rounded-full transition-all duration-300 shadow-md absolute top-[2px]"
                                    style={{ 
                                        left: theme === 'dark' ? '18px' : '2px',
                                        backgroundColor: theme === 'dark' ? '#ffffff' : '#12101b'
                                    }}
                                />
                            </button>
                        </div>
                    </nav>

                    {/* Decorative Cover Art & Music visualizer Widget */}
                    {currentSong && isPlaying && (
                        <div className="bg-zinc-950/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group w-full">
                            {/* Active Song Player Display */}
                            <div 
                                onClick={() => {
                                    if (currentSong && currentSong.id !== 'spotify-live') {
                                        navigate(`/song/${currentSong.id}`, {
                                            state: {
                                                songData: {
                                                    id: currentSong.id,
                                                    name: currentSong.name,
                                                    artistName: currentSong.artist,
                                                    albumCover: currentSong.cover,
                                                    albumName: currentSong.albumName || "",
                                                    durationMs: currentSong.durationMs || 0,
                                                    previewUrl: currentSong.previewUrl || null,
                                                    artists: [{ name: currentSong.artist }]
                                                }
                                            }
                                        });
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

                {/* Profile footer — compact with inline logout */}
                {user && (
                    <div className="neobrutal-card p-2.5 shadow-[3px_3px_0px_rgba(255,255,255,0.1)] border-2 border-white bg-white/2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 border-2 border-white flex items-center justify-center font-black text-xs text-violet-400 overflow-hidden shadow-inner flex-shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.pseudo.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-sm text-zinc-100 truncate leading-snug">{user.pseudo}</div>
                                <div className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">
                                    {user.role === 'OWNER' ? (
                                        <span className="bg-gradient-to-r from-yellow-400 to-amber-550 bg-clip-text text-transparent font-black">Propriétaire</span>
                                    ) : user.role === 'ADMIN' ? (
                                        'Administrateur'
                                    ) : (
                                        'Membre'
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex-shrink-0 w-8 h-8 rounded-lg border-2 border-red-500/60 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_rgba(239,68,68,0.2)] hover:shadow-[2px_2px_0px_rgba(239,68,68,0.4)] hover:-translate-y-px active:translate-y-0 active:shadow-none"
                                title="Se déconnecter"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="mobile-nav-container md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0a12]/95 border-t border-white/[0.05] py-2 px-3 flex justify-around items-center z-50 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
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
                                {key === 'library' ? 'Biblio' : key === 'admin' ? 'Admin' : key === 'blindtest' ? 'Jeux' : label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}

export default Sidebar;
