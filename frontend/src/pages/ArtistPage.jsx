import API_URL from '../config.js';
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones, Users, Play, Pause, Disc, Music, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import Sidebar from '../components/Sidebar';

function ArtistPage() {
    const { artistId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [playingId, setPlayingId] = useState(null);
    const [audio, setAudio] = useState(null);

    // GSAP refs
    const heroRef = useRef(null);
    const contentRef = useRef(null);
    const progressBarRef = useRef(null);
    const trackListRef = useRef(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => { 
            if (audio) {
                audio.pause();
            }
            window.spotifyIsPlaying = false;
            window.dispatchEvent(new CustomEvent('spotify-pause'));
        };
    }, [audio]);

    // Fetch artist details
    useEffect(() => {
        if (!artistId) return;
        let cancelled = false;

        async function fetchArtist() {
            try {
                const r = await fetch(`${API_URL}/api/artists/${artistId}/details`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = r.ok ? await r.json() : await Promise.reject('Artiste introuvable');
                if (!cancelled) { setArtist(data); setLoading(false); }
            } catch (err) {
                if (!cancelled) { setError(String(err)); setLoading(false); }
            }
        }

        fetchArtist();
        return () => { cancelled = true; };
    }, [artistId, token]);

    // GSAP entrance once data loaded
    useLayoutEffect(() => {
        if (!artist) return;

        const ctx = gsap.context(() => {
            // Hero
            if (heroRef.current) {
                gsap.fromTo(heroRef.current,
                    { opacity: 0, scale: 1.04 },
                    { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' }
                );
            }

            // Content sections
            if (contentRef.current) {
                const sections = contentRef.current.querySelectorAll('.anim-section');
                if (sections.length) {
                    gsap.fromTo(sections,
                        { y: 28, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.15, clearProps: 'all' }
                    );
                }
            }

            // Popularity bar
            if (progressBarRef.current) {
                gsap.fromTo(progressBarRef.current,
                    { width: '0%' },
                    { width: `${artist.popularity}%`, duration: 1.2, ease: 'power3.out', delay: 0.3 }
                );
            }
        });

        return () => ctx.revert();
    }, [artist]);

    // Separate effect for track rows — fires after topTracks renders
    useLayoutEffect(() => {
        if (!trackListRef.current || !artist?.topTracks?.length) return;
        const rows = trackListRef.current.querySelectorAll('.track-row');
        if (!rows.length) return;
        gsap.fromTo(rows,
            { x: -18, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out', delay: 0.3, clearProps: 'all' }
        );
    }, [artist?.topTracks]);

    const formatMs = (ms) => {
        if (!ms) return '–';
        const mins = Math.floor(ms / 60000);
        const secs = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

    const getPopDetails = (score) => {
        if (score >= 90) return { label: 'Légende Mondiale', bar: 'from-red-500 to-rose-600', badge: 'text-red-400 bg-red-500/10 border-red-500/20' };
        if (score >= 80) return { label: 'Superstar Internationale', bar: 'from-amber-400 to-orange-500', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
        if (score >= 65) return { label: 'Artiste Très Populaire', bar: 'from-emerald-400 to-teal-500', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
        if (score >= 50) return { label: 'Artiste Établi', bar: 'from-blue-400 to-indigo-500', badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
        if (score >= 20) return { label: 'Indépendant Prometteur', bar: 'from-purple-500 to-violet-600', badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
        return { label: 'Découverte Confidentielle', bar: 'from-zinc-500 to-zinc-700', badge: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' };
    };

    const handlePlayPreview = (trackId, previewUrl) => {
        if (!previewUrl) return;
        if (playingId === trackId) {
            audio.pause();
            setPlayingId(null);
            window.dispatchEvent(new CustomEvent('spotify-pause'));
        } else {
            if (audio) audio.pause();
            const newAudio = new Audio(previewUrl);
            newAudio.volume = 0.4;
            newAudio.play().catch(e => console.error(e));
            newAudio.addEventListener('ended', () => {
                setPlayingId(null);
                window.dispatchEvent(new CustomEvent('spotify-pause'));
            });
            setPlayingId(trackId);
            setAudio(newAudio);

            // Déclencher l'événement global play
            const track = artist.topTracks.find(t => t.id === trackId);
            if (track) {
                window.dispatchEvent(new CustomEvent('spotify-play', {
                    detail: {
                        id: trackId,
                        name: track.name,
                        artist: artist.name,
                        cover: track.albumCover
                    }
                }));
            }
        }
    };

    const popDetails = artist ? getPopDetails(artist.popularity) : null;

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar
                user={user}
                currentTab="profile"
                setCurrentTab={(tab) => navigate('/', { state: { tab } })}
                handleLogout={() => { localStorage.clear(); navigate('/login'); }}
            />

            <div className="flex-1 bg-[#12101b] md:my-2 md:mr-2 md:rounded-lg no-scrollbar flex flex-col pb-24 md:pb-0">

                {/* Loading */}
                {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Disc size={52} className="text-emerald-500 animate-spin" style={{ animationDuration: '2.5s' }} />
                        <p className="text-zinc-400 font-semibold text-sm tracking-wide">Chargement de l&apos;artiste...</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <Music size={48} className="text-zinc-700" />
                        <p className="text-zinc-400 font-semibold">{error}</p>
                        <button onClick={() => navigate(-1)} className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition cursor-pointer bg-transparent border-none p-0">
                            ← Retour
                        </button>
                    </div>
                )}

                {/* Content */}
                {!loading && artist && (
                    <>
                        {/* ── Hero ── */}
                        <div ref={heroRef} className="relative w-full h-64 md:h-80 flex-shrink-0 overflow-hidden">
                            {artist.images?.[0]?.url ? (
                                <img
                                    src={artist.images[0].url}
                                    alt={artist.name}
                                    className="w-full h-full object-cover object-center"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                    <Disc size={96} className="text-zinc-700 animate-spin" style={{ animationDuration: '8s' }} />
                                </div>
                            )}

                            {/* Gradient overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#12101b] via-[#12101b]/60 to-transparent" />
                            <div className="absolute inset-0 bg-black/20" />

                            {/* Back button */}
                            <button
                                onClick={() => navigate(-1)}
                                className="absolute top-5 left-5 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full border border-zinc-700/40 transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg z-10 flex items-center gap-2"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            {/* Artist name + badge */}
                            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                                <span className={`self-start text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${popDetails.badge}`}>
                                    {popDetails.label}
                                </span>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-2xl">
                                    {artist.name}
                                </h1>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div ref={contentRef} className="p-6 md:p-10 space-y-8">

                            {/* Stats row */}
                            <div className="anim-section grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Auditeurs */}
                                <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                        <Headphones size={22} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Auditeurs mensuels</div>
                                        <div className="text-2xl font-black text-white mt-0.5">{formatNumber(artist.monthlyListeners)}</div>
                                    </div>
                                </div>

                                {/* Abonnés */}
                                <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                                        <Users size={22} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Abonnés Spotify</div>
                                        <div className="text-2xl font-black text-white mt-0.5">{formatNumber(artist.followers)}</div>
                                    </div>
                                </div>

                                {/* Popularity score */}
                                <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex flex-col justify-center gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Score de popularité</span>
                                        <span className="text-lg font-black text-white">{artist.popularity}<span className="text-xs text-zinc-500 font-semibold">/100</span></span>
                                    </div>
                                    <div className="relative w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            ref={progressBarRef}
                                            className={`h-full bg-gradient-to-r ${popDetails.bar} rounded-full`}
                                            style={{ width: 0 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Genres */}
                            {artist.genres?.length > 0 && (
                                <div className="anim-section space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Genres musicaux</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {artist.genres.map(genre => (
                                            <span
                                                key={genre}
                                                className="text-xs font-bold bg-[#292738] hover:bg-[#2e2e2e] text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-full capitalize transition-colors cursor-default"
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top Tracks */}
                            {artist.topTracks?.length > 0 && (
                                <div className="anim-section space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">
                                            Top {artist.topTracks.length} titres
                                        </h3>
                                        <a
                                            href={`https://open.spotify.com/artist/${artist.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition-colors font-semibold"
                                        >
                                            Ouvrir sur Spotify <ExternalLink size={12} />
                                        </a>
                                    </div>

                                    <div ref={trackListRef} className="bg-[#1a1824]/70 border border-zinc-800/40 rounded-2xl overflow-hidden divide-y divide-zinc-800/40">
                                        {artist.topTracks.map((track, idx) => (
                                            <div
                                                key={track.id}
                                                onClick={(e) => {
                                                    if (e.target.closest('button')) return;
                                                    navigate(`/song/${track.id}`);
                                                }}
                                                className="track-row flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/30 transition-colors duration-200 group cursor-pointer"
                                            >
                                                {/* Index / Play */}
                                                <div className="w-8 flex items-center justify-center flex-shrink-0 relative">
                                                    {track.previewUrl ? (
                                                        <>
                                                            <button
                                                                onClick={() => handlePlayPreview(track.id, track.previewUrl)}
                                                                className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 absolute transition-opacity duration-150 cursor-pointer active:scale-95 shadow-lg"
                                                            >
                                                                {playingId === track.id
                                                                    ? <Pause size={13} fill="black" />
                                                                    : <Play size={13} fill="black" className="ml-0.5" />
                                                                }
                                                            </button>
                                                            <span className={`text-sm font-bold transition-opacity duration-150 ${playingId === track.id ? 'text-emerald-400 opacity-0 group-hover:opacity-0' : 'text-zinc-500 group-hover:opacity-0'}`}>
                                                                {playingId === track.id ? (
                                                                    <span className="flex gap-0.5 items-end h-4">
                                                                        <span className="w-0.5 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                        <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                        <span className="w-0.5 h-3.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '75ms' }} />
                                                                    </span>
                                                                ) : idx + 1}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm font-bold text-zinc-600">{idx + 1}</span>
                                                    )}
                                                </div>

                                                {/* Cover */}
                                                <div className="w-11 h-11 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-800/60 shadow-sm">
                                                    {track.albumCover
                                                        ? <img src={track.albumCover} alt={track.name} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center"><Disc size={16} className="text-zinc-600" /></div>
                                                    }
                                                </div>

                                                {/* Name / Album */}
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-bold truncate transition-colors duration-200 ${playingId === track.id ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>
                                                        {track.name}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 truncate mt-0.5">{track.albumName}</div>
                                                </div>

                                                {/* Duration */}
                                                <span className="text-xs text-zinc-600 font-semibold flex-shrink-0 tabular-nums">
                                                    {formatMs(track.durationMs)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ArtistPage;
