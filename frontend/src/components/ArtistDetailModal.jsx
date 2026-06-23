import { useEffect, useState, useRef } from 'react';
import { X, Headphones, Users, Play, Pause, Disc } from 'lucide-react';
import gsap from 'gsap';

function ArtistDetailModal({ artist, onClose }) {
    const [playingId, setPlayingId] = useState(null);
    const [audio, setAudio] = useState(null);

    const backdropRef = useRef(null);
    const modalRef = useRef(null);
    const progressBarRef = useRef(null);
    const trackListRef = useRef(null);

    useEffect(() => {
        return () => {
            if (audio) {
                audio.pause();
            }
        };
    }, [audio]);

    useEffect(() => {
        if (artist) {
            // Backdrop fade-in
            gsap.fromTo(backdropRef.current, 
                { opacity: 0 }, 
                { opacity: 1, duration: 0.35, ease: 'power2.out' }
            );
            
            // Modal slide up & scale-in
            gsap.fromTo(modalRef.current, 
                { y: 40, scale: 0.96, opacity: 0 }, 
                { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.15)' }
            );

            // Progress bar width animation
            gsap.fromTo(progressBarRef.current, 
                { width: '0%' }, 
                { width: `${artist.popularity}%`, duration: 1.1, ease: 'power3.out', delay: 0.15 }
            );

            // Staggered tracks animation
            if (trackListRef.current) {
                const tracks = trackListRef.current.children;
                if (tracks && tracks.length > 0) {
                    gsap.fromTo(tracks, 
                        { y: 15, opacity: 0 }, 
                        { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.25 }
                    );
                }
            }
        }
    }, [artist]);

    if (!artist) return null;

    const formatNumber = (num) => {
        return new Intl.NumberFormat('fr-FR').format(num || 0);
    };

    const getPopularityDetails = (score) => {
        if (score >= 90) return { label: "Légende Mondiale", color: "from-red-500 to-rose-600", textClass: "text-red-400 bg-red-500/10 border-red-500/20" };
        if (score >= 80) return { label: "Superstar Internationale", color: "from-amber-400 to-orange-500", textClass: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
        if (score >= 65) return { label: "Artiste Très Populaire", color: "from-emerald-400 to-teal-500", textClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
        if (score >= 50) return { label: "Artiste Établi", color: "from-blue-400 to-indigo-500", textClass: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
        if (score >= 20) return { label: "Indépendant Prometteur", color: "from-purple-500 to-violet-600", textClass: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
        return { label: "Découverte Confidentielle", color: "from-zinc-500 to-zinc-700", textClass: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" };
    };

    const popDetails = getPopularityDetails(artist.popularity);

    const handlePlayPreview = (trackId, previewUrl) => {
        if (!previewUrl) return;
        if (playingId === trackId) {
            audio.pause();
            setPlayingId(null);
        } else {
            if (audio) {
                audio.pause();
            }
            const newAudio = new Audio(previewUrl);
            newAudio.volume = 0.4;
            newAudio.play().catch(err => console.error("Lecture impossible:", err));
            setPlayingId(trackId);
            setAudio(newAudio);
            newAudio.addEventListener('ended', () => {
                setPlayingId(null);
            });
        }
    };

    return (
        <div ref={backdropRef} className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div ref={modalRef} data-lenis-prevent className="bg-[#12101b] border border-zinc-800/80 w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl rounded-2xl max-h-[90vh]">
                
                {/* Header d'artiste avec couverture et overlay dégradé */}
                <div className="relative w-full bg-[#12101b] border-b-4 border-black p-6 flex items-center justify-between gap-6 flex-shrink-0">
                    {/* Left Info Column */}
                    <div className="flex flex-col gap-3 z-10 flex-1 min-w-0">
                        <span className={`self-start text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-[#8B5CF6] text-white border-2 border-black shadow-[2px_2px_0px_#000000]`}>
                            {popDetails.label}
                        </span>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight truncate uppercase leading-none">
                            {artist.name}
                        </h2>
                    </div>

                    {/* Right Image Column - Neobrutalist Square Card */}
                    <div className="flex-shrink-0 relative z-10">
                        <div className="w-18 h-18 md:w-24 md:h-24 rounded-xl overflow-hidden border-3 border-black shadow-[4px_4px_0px_rgba(255,255,255,0.15)] hover:shadow-[8px_8px_0px_rgba(255,255,255,0.25)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 bg-zinc-900 flex items-center justify-center">
                            {artist.images?.[0]?.url ? (
                                <img 
                                    src={artist.images[0].url} 
                                    alt={artist.name} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <Disc size={36} className="text-zinc-700 animate-spin" style={{ animationDuration: '8s' }} />
                            )}
                        </div>
                    </div>

                    {/* Close Button */}
                    <button 
                        onClick={() => {
                            if (audio) audio.pause();
                            onClose();
                        }}
                        className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-2 rounded-lg border-2 border-black transition duration-200 cursor-pointer shadow-[2px_2px_0px_#000000] z-20"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Zone de scroll */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar no-scrollbar">
                    
                    {/* Statistiques clés de l'artiste */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Écouteurs par mois */}
                        <div className="bg-[#1a1824] border border-zinc-800/40 p-4 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                                <Headphones size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Auditeurs mensuels</div>
                                <div className="text-xl font-black text-white mt-0.5">
                                    {formatNumber(artist.monthlyListeners)}
                                </div>
                            </div>
                        </div>

                        {/* Abonnés Spotify */}
                        <div className="bg-[#1a1824] border border-zinc-800/40 p-4 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 flex-shrink-0">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Abonnés Spotify</div>
                                <div className="text-xl font-black text-white mt-0.5">
                                    {formatNumber(artist.followers)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popularité Score Slider */}
                    <div className="space-y-3 bg-[#1a1824] border border-zinc-800/40 p-5 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Score de Popularité</span>
                            <span className="text-sm font-black text-white">{artist.popularity} / 100</span>
                        </div>
                        <div className="relative w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/30">
                            <div 
                                ref={progressBarRef}
                                className={`h-full bg-gradient-to-r ${popDetails.color} rounded-full`}
                            ></div>
                        </div>
                        <p className="text-[11px] text-zinc-500 italic leading-relaxed">
                            Le score de popularité Spotify est basé sur le volume total d'écoutes de l'artiste comparativement aux autres artistes.
                        </p>
                    </div>

                    {/* Genres de l'artiste */}
                    {artist.genres?.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Genres musicaux</h4>
                            <div className="flex flex-wrap gap-2">
                                {artist.genres.map(genre => (
                                    <span 
                                        key={genre}
                                        className="text-xs font-bold bg-[#292738] hover:bg-[#2e2e2e] text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-full capitalize transition cursor-default"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top 5 Titres */}
                    {artist.topTracks?.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Titres les plus populaires</h4>
                            <div ref={trackListRef} className="bg-[#1a1824]/60 border border-zinc-800/40 rounded-xl overflow-hidden divide-y divide-zinc-800/40">
                                {artist.topTracks.map((track, idx) => (
                                    <div 
                                        key={track.id} 
                                        className="flex items-center justify-between p-3.5 hover:bg-zinc-800/30 transition duration-200 group"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            {/* Numéro ou Play button */}
                                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 relative">
                                                {track.previewUrl ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handlePlayPreview(track.id, track.previewUrl)}
                                                            className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition absolute cursor-pointer active:scale-95 shadow-md"
                                                        >
                                                            {playingId === track.id ? <Pause size={12} fill="black" /> : <Play size={12} fill="black" className="ml-0.5" />}
                                                        </button>
                                                        <span className="text-xs font-bold text-zinc-500 group-hover:opacity-0 transition">
                                                            {idx + 1}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-500">
                                                        {idx + 1}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Cover de l'album */}
                                            <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-800/60 shadow-sm">
                                                {track.albumCover ? (
                                                    <img src={track.albumCover} alt={track.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Disc size={16} className="text-zinc-600" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Nom & Album */}
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                                    {track.name}
                                                </div>
                                                <div className="text-xs text-zinc-500 truncate mt-0.5">
                                                    {track.albumName}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Statut d'écoute */}
                                        {playingId === track.id && (
                                            <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                                                <span className="w-1 h-3.5 bg-emerald-500 rounded-full animate-[pulse_0.8s_infinite]"></span>
                                                <span className="w-1 h-2 bg-emerald-500 rounded-full animate-[pulse_0.8s_0.2s_infinite]"></span>
                                                <span className="w-1 h-3 bg-emerald-500 rounded-full animate-[pulse_0.8s_0.1s_infinite]"></span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default ArtistDetailModal;
