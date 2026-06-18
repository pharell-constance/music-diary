import { Flame, Trophy, Play, Pause, Clock } from 'lucide-react';
import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function TrendingTab({
    trending,
    loadingTrending,
    trendingLimit,
    setTrendingLimit,
    playingPreview,
    togglePreview,
    formatDuration
}) {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        if (loadingTrending || !trending.length) return;

        const ctx = gsap.context(() => {
            gsap.fromTo('.trending-row', 
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1,
                    duration: 0.5,
                    stagger: 0.05,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        }, containerRef);

        return () => ctx.revert();
    }, [loadingTrending, trending]);

    return (
        <div ref={containerRef} className="mt-4 space-y-5">
            {/* Filtre de nombre */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                    <Flame size={16} className="text-orange-400" />
                    <span className="font-mouse-memoirs uppercase tracking-widest text-sm">Global Top 50 Spotify · mis à jour chaque semaine</span>
                </div>
                <div className="flex gap-2">
                    {[10, 20, 50].map(n => (
                        <button
                            key={n}
                            onClick={() => setTrendingLimit(n)}
                            className={`pill-btn px-4 py-1.5 ${trendingLimit === n ? 'active' : 'inactive'}`}
                        >
                            Top {n}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste */}
            {loadingTrending ? (
                <div className="space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="skeleton h-16 w-full" />
                    ))}
                </div>
            ) : (
                <div className="neo-section divide-y divide-white/[0.04]">
                    {trending.map((track) => (
                        <div
                            key={track.id}
                            className="trending-row p-4 flex items-center gap-4 group hover:bg-violet-500/[0.04] transition-colors duration-150"
                        >
                            {/* Rang */}
                            <span className="neo-rank flex-shrink-0 flex items-center justify-center">
                                {track.rank === 1 ? (
                                    <Trophy size={16} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                ) : track.rank === 2 ? (
                                    <Trophy size={16} className="text-zinc-300" />
                                ) : track.rank === 3 ? (
                                    <Trophy size={16} className="text-amber-600" />
                                ) : (
                                    <span>{track.rank}</span>
                                )}
                            </span>

                            {/* Cover + bouton play */}
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md border-2 border-white/10">
                                {track.albumCover && (
                                    <img src={track.albumCover} alt={track.albumName} className="w-full h-full object-cover" />
                                )}
                                {track.previewUrl && (
                                    <button
                                        onClick={() => togglePreview(track)}
                                        className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                                    >
                                        {playingPreview === track.id
                                            ? <Pause size={16} className="text-white" />
                                            : <Play size={16} className="text-white" />}
                                    </button>
                                )}
                            </div>

                            {/* Infos */}
                            <div className="min-w-0 flex-1">
                                <div className="font-mouse-memoirs uppercase tracking-wide text-sm text-white truncate group-hover:text-violet-400 transition-colors">
                                    {track.name}
                                    {playingPreview === track.id && (
                                        <span className="ml-2 text-violet-400 text-[10px] font-black animate-pulse">▶ EN COURS</span>
                                    )}
                                </div>
                                <div className="text-xs text-zinc-400 truncate mt-0.5">{track.artists}</div>
                                {/* Barre de popularité */}
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-[120px]">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                                            style={{ width: `${track.popularity}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-zinc-500 font-semibold">{track.popularity}%</span>
                                </div>
                            </div>

                            {/* Album + durée */}
                            <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="text-[10px] text-zinc-500 truncate max-w-[120px] text-right">{track.albumName}</span>
                                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                    <Clock size={9} /> {formatDuration(track.durationMs)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TrendingTab;
