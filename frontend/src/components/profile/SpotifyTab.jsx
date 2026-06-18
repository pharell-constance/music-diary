import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Music, Headphones, User, Trophy } from 'lucide-react';

const GRADIENTS = [
    "from-violet-600 to-fuchsia-500",
    "from-blue-600 to-cyan-500",
    "from-purple-600 to-indigo-500",
    "from-fuchsia-600 to-pink-500",
    "from-violet-700 to-purple-600",
    "from-yellow-600 to-amber-500",
    "from-red-600 to-rose-500",
];

function SpotifyTab({
    activeSubTab,
    setActiveSubTab,
    timeRange,
    setTimeRange,
    topArtists,
    topTracks,
    topAlbums,
    topGenres,
    recent,
    onArtistClick,
    onSelectAlbum,
}) {
    const contentGridRef = useRef(null);

    useEffect(() => {
        if (!contentGridRef.current) return;
        const cards = contentGridRef.current.querySelectorAll('.anim-card');
        if (!cards.length) return;
        gsap.fromTo(
            cards,
            { y: 40, opacity: 0, scale: 0.95 },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.45,
                stagger: { each: 0.055, from: 'start' },
                ease: 'power3.out',
                clearProps: 'transform,opacity',
            }
        );
    }, [activeSubTab, topArtists, topTracks, topAlbums, topGenres]);

    const SUB_TABS = [
        { key: 'artists', label: 'Artistes' },
        { key: 'tracks', label: 'Sons' },
        { key: 'albums', label: 'Albums' },
        { key: 'genres', label: 'Genres' },
    ];

    const TIME_RANGES = [
        ...(activeSubTab === 'tracks' ? [{ key: 'week', label: 'Cette Semaine' }] : []),
        { key: 'short_term', label: '4 Semaines' },
        { key: 'medium_term', label: '6 Mois' },
        { key: 'long_term', label: 'Plusieurs Années' },
    ];

    return (
        <div className="space-y-10">
            {/* Top Stats Section with Sub-tabs */}
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/40 pb-4">
                    {/* Sub-tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        {SUB_TABS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key !== 'tracks' && timeRange === 'week') {
                                        setTimeRange('short_term');
                                    }
                                    setActiveSubTab(key);
                                }}
                                className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                                    activeSubTab === key
                                        ? 'bg-white text-black shadow-md'
                                        : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Time range selector */}
                    <div className="bg-white/[0.03] p-1 rounded-full flex gap-1 border border-white/[0.08] self-start lg:self-auto text-xs font-semibold">
                        {TIME_RANGES.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTimeRange(key)}
                                className={`px-4 py-1.5 rounded-full transition cursor-pointer ${
                                    timeRange === key
                                        ? 'bg-zinc-700 text-white'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grids */}
                <div ref={contentGridRef}>
                    {/* Artistes */}
                    {activeSubTab === 'artists' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {!Array.isArray(topArtists) || topArtists.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic col-span-full">Aucun artiste trouvé.</p>
                            ) : (
                                topArtists.map((artist, idx) => (
                                    <div
                                        key={artist.id}
                                        onClick={() => onArtistClick(artist.id)}
                                        className="anim-card bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl flex flex-col items-center text-center cursor-pointer hover:bg-white/[0.04] hover:border-violet-500/20 transition duration-200"
                                    >
                                        <div className="w-20 h-20 rounded-full overflow-hidden mb-3 bg-zinc-800 border border-zinc-800/60 shadow">
                                            {artist.images?.[0] ? (
                                                <img src={artist.images[0].url} alt={artist.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><User size={24} className="text-zinc-650" /></div>
                                            )}
                                        </div>
                                        <div className="font-bold text-xs text-white truncate w-full">{artist.name}</div>
                                        <div className="text-[10px] text-zinc-500 font-bold mt-1">N° {idx + 1}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Sons */}
                    {activeSubTab === 'tracks' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {!Array.isArray(topTracks) || topTracks.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic col-span-full">Aucun titre trouvé.</p>
                            ) : (
                                topTracks.map((track, idx) => (
                                    <div
                                        key={track.id}
                                        onClick={() => onSelectAlbum(track.album)}
                                        className="anim-card bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-white/[0.04] hover:border-violet-500/20 transition duration-150"
                                    >
                                        <span className="text-xs font-black text-zinc-500 w-5 text-center">{idx + 1}</span>
                                        <div className="w-11 h-11 rounded bg-zinc-800 overflow-hidden shadow">
                                            {track.album?.images?.[0] ? (
                                                <img src={track.album.images[0].url} alt={track.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-zinc-605" /></div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-xs text-white truncate">{track.name}</div>
                                            <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                                {track.artists?.map(a => a.name).join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Albums */}
                    {activeSubTab === 'albums' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {!Array.isArray(topAlbums) || topAlbums.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic col-span-full">Aucun album trouvé.</p>
                            ) : (
                                topAlbums.map((album, idx) => (
                                    <div
                                        key={album.id}
                                        onClick={() => onSelectAlbum(album)}
                                        className="anim-card bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl flex flex-col items-center text-center cursor-pointer hover:bg-white/[0.04] hover:border-violet-500/20 transition duration-200"
                                    >
                                        <div className="w-20 h-20 rounded bg-zinc-800 overflow-hidden mb-3 shadow border border-zinc-800/60">
                                            {album.images?.[0] ? (
                                                <img src={album.images[0].url} alt={album.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-zinc-650" /></div>
                                            )}
                                        </div>
                                        <div className="font-bold text-xs text-white truncate w-full">{album.name}</div>
                                        <div className="text-[10px] text-zinc-500 truncate w-full mt-0.5">
                                            {album.artists?.map(a => a.name).join(', ')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Genres */}
                    {activeSubTab === 'genres' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {!Array.isArray(topGenres) || topGenres.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic col-span-full">Aucun genre trouvé.</p>
                            ) : (
                                topGenres.slice(0, 12).map(({ genre, count }, idx) => {
                                    const isTopThree = idx < 3;
                                    const badgeText = idx === 0 ? "Or" : idx === 1 ? "Argent" : "Bronze";
                                    const badgeColor = idx === 0
                                        ? "bg-yellow-500/25 border-yellow-500/40 text-yellow-400"
                                        : idx === 1
                                        ? "bg-zinc-400/25 border-zinc-400/40 text-zinc-300"
                                        : "bg-amber-600/25 border-amber-600/40 text-amber-500";
                                    const badgeIcon = idx === 0
                                        ? <Trophy size={10} className="text-yellow-400" />
                                        : idx === 1
                                        ? <Trophy size={10} className="text-zinc-300" />
                                        : <Trophy size={10} className="text-amber-500" />;
                                    const gradient = GRADIENTS[idx % GRADIENTS.length];

                                    return (
                                        <div
                                            key={genre}
                                            className={`anim-card bg-gradient-to-br ${gradient} p-5 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl relative flex flex-col justify-between h-36 group cursor-default shadow-md`}
                                        >
                                            {isTopThree && (
                                                <span className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full ${badgeColor} shadow-md z-10 flex items-center gap-1`}>
                                                    {badgeIcon} {badgeText}
                                                </span>
                                            )}
                                            <div className="text-lg font-black text-white capitalize leading-tight mt-4 break-words drop-shadow-md pr-6">
                                                {genre}
                                            </div>
                                            <div className="text-[10px] text-white/90 font-bold bg-black/20 self-start px-2.5 py-1 rounded-full mt-2">
                                                {count} {count > 1 ? 'artistes' : 'artiste'}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dernières Écoutes */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Headphones className="text-violet-400" size={24} />
                    <h2 className="text-2xl font-bold tracking-tight">Dernières écoutes</h2>
                </div>
                <div className="bg-white/[0.01] rounded-xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
                    {recent.map((item, idx) => {
                        const track = item.track || item;
                        return (
                            <div
                                key={idx}
                                onClick={() => onSelectAlbum(track.album)}
                                className="p-4 flex items-center justify-between gap-4 transition-colors duration-200 group cursor-pointer hover:bg-white/[0.02]"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <span className="text-sm font-bold text-zinc-500 w-6 text-center group-hover:text-violet-400 transition-colors flex justify-center">
                                        {idx + 1}
                                    </span>
                                    <div className="w-12 h-12 rounded-md bg-zinc-800 overflow-hidden shadow-md flex-shrink-0 relative group-hover:scale-105 transition-transform duration-300">
                                        {track.album?.images?.[0] ? (
                                            <img src={track.album.images[0].url} alt={track.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-zinc-650" /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm text-white truncate group-hover:text-violet-400 transition-colors duration-200">
                                            {track.name}
                                        </div>
                                        <div className="text-xs text-zinc-400 truncate mt-0.5">
                                            {track.artists?.map(a => a.name).join(', ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block text-xs text-zinc-500 font-medium max-w-xs truncate">
                                    {track.album?.name}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default SpotifyTab;
