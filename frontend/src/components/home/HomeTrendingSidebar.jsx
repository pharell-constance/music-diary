import { Flame, Trophy, Play, Pause, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function extractTrendingArtists(tracks, limit = 6) {
    const seen = new Set();
    const artists = [];
    for (const track of tracks) {
        const names = (track.artists || '').split(',').map((a) => a.trim()).filter(Boolean);
        for (const name of names) {
            const key = name.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                artists.push({ name, cover: track.albumCover });
            }
            if (artists.length >= limit) return artists;
        }
    }
    return artists;
}

export default function HomeTrendingSidebar({
    trending,
    loadingTrending,
    playingPreview,
    togglePreview,
}) {
    const navigate = useNavigate();
    const topTracks = trending.slice(0, 8);
    const topArtists = extractTrendingArtists(trending, 6);

    return (
        <aside className="flex flex-col gap-5 w-full lg:w-[30%] lg:min-w-[260px] lg:max-w-[340px] flex-shrink-0 lg:sticky lg:top-8 lg:self-start">
            {/* Tendances */}
            <div className="neobrutal-card bg-[#121214] p-4 flex flex-col gap-3 min-h-0">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/15 border-2 border-orange-400/40 flex items-center justify-center shadow-[2px_2px_0px_rgba(251,146,60,0.25)]">
                        <Flame size={15} className="text-orange-400" />
                    </div>
                    <div>
                        <h2 className="font-mouse-memoirs uppercase tracking-widest text-sm text-white leading-tight">Tendances</h2>
                        <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Global Top Spotify</p>
                    </div>
                </div>

                {loadingTrending ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="skeleton h-12 w-full rounded-xl" />
                        ))}
                    </div>
                ) : topTracks.length === 0 ? (
                    <p className="text-zinc-500 text-xs italic py-4 text-center">Aucune tendance disponible.</p>
                ) : (
                    <ul
                        className="flex flex-col gap-1.5 max-h-[min(24rem,calc(100dvh-14rem))] overflow-y-auto overscroll-contain custom-scrollbar pr-1 -mr-1 min-h-0"
                        data-lenis-prevent
                    >
                        {topTracks.map((track) => (
                            <li
                                key={track.id}
                                className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-violet-500/[0.06] border-2 border-transparent hover:border-white/10 transition-all cursor-pointer"
                                onClick={() => navigate(`/song/${track.id}`)}
                            >
                                <span className="w-6 text-center flex-shrink-0">
                                    {track.rank === 1 ? (
                                        <Trophy size={13} className="text-yellow-400 mx-auto" />
                                    ) : track.rank <= 3 ? (
                                        <span className="text-[11px] font-black text-zinc-400">{track.rank}</span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-zinc-600">{track.rank}</span>
                                    )}
                                </span>

                                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white/10 shadow-sm">
                                    {track.albumCover ? (
                                        <img src={track.albumCover} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800" />
                                    )}
                                    {track.previewUrl && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); togglePreview(track); }}
                                            className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            title="Écouter l'extrait"
                                        >
                                            {playingPreview === track.id
                                                ? <Pause size={12} className="text-white" />
                                                : <Play size={12} className="text-white" />}
                                        </button>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white truncate group-hover:text-violet-400 transition-colors leading-tight">
                                        {track.name}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artists}</p>
                                </div>

                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <TrendingUp size={9} className="text-violet-500/70" />
                                    <span className="text-[9px] font-black text-zinc-500">{track.popularity}%</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Artistes du moment */}
            <div className="neobrutal-card bg-[#121214] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 border-2 border-fuchsia-400/40 flex items-center justify-center shadow-[2px_2px_0px_rgba(217,70,239,0.25)]">
                        <Users size={15} className="text-fuchsia-400" />
                    </div>
                    <div>
                        <h2 className="font-mouse-memoirs uppercase tracking-widest text-sm text-white leading-tight">Artistes du moment</h2>
                        <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Les plus streamés</p>
                    </div>
                </div>

                {loadingTrending ? (
                    <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="skeleton h-20 w-full rounded-xl" />
                        ))}
                    </div>
                ) : topArtists.length === 0 ? (
                    <p className="text-zinc-500 text-xs italic py-2 text-center">Aucun artiste disponible.</p>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {topArtists.map((artist) => (
                            <button
                                key={artist.name}
                                type="button"
                                onClick={() => navigate('/', { state: { tab: 'search' } })}
                                className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 border-transparent hover:border-violet-400/40 hover:bg-violet-500/[0.06] transition-all group cursor-pointer"
                                title={`Rechercher ${artist.name}`}
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/15 shadow-[2px_2px_0px_rgba(255,255,255,0.1)] group-hover:border-violet-400/50 transition-colors">
                                    {artist.cover ? (
                                        <img src={artist.cover} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-violet-400">
                                            {artist.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[9px] font-bold text-zinc-400 group-hover:text-violet-300 transition-colors truncate w-full text-center leading-tight">
                                    {artist.name}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
