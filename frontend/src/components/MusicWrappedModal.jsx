import { useEffect, useState, useRef } from 'react';
import { X, Star, Award, Disc } from 'lucide-react';
import gsap from 'gsap';

function MusicWrappedModal({ stats, onClose }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [progress, setProgress] = useState(0);
    const containerRef = useRef(null);
    const slideDuration = 6000; // 6 seconds per slide

    const totalSlides = 5;

    const bestAlbum = stats?.highestRatedAlbums?.[0] || null;
    const topGenre = stats?.topGenres?.[0]?.genre || "N/A";

    // Handle GSAP animations when slide changes
    useEffect(() => {
        if (!containerRef.current) return;
        const activeSlideEl = containerRef.current.querySelector('.active-slide');
        if (activeSlideEl) {
            const elements = activeSlideEl.querySelectorAll('.wrapped-anim');
            gsap.fromTo(elements, 
                { opacity: 0, y: 30, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' }
            );

            // Vinyl spin if best album slide
            const vinyl = activeSlideEl.querySelector('.vinyl-spin');
            if (vinyl) {
                gsap.to(vinyl, { rotation: 360, repeat: -1, duration: 8, ease: 'none' });
            }
        }
    }, [currentSlide]);

    // Slide progress timer
    useEffect(() => {
        let startTime = Date.now();
        let frameId;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / slideDuration) * 100, 100);
            setProgress(pct);

            if (pct >= 100) {
                if (currentSlide < totalSlides - 1) {
                    setCurrentSlide(prev => prev + 1);
                    setProgress(0);
                } else {
                    onClose(); // Auto close at the end
                }
            } else {
                frameId = requestAnimationFrame(updateProgress);
            }
        };

        frameId = requestAnimationFrame(updateProgress);

        return () => cancelAnimationFrame(frameId);
    }, [currentSlide, onClose]);

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
            setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0c0c0e] flex items-center justify-center font-sans overflow-hidden select-none">
            {/* Background glowing gradients */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-[120px]"></div>

            {/* Stories-like card container */}
            <div ref={containerRef} className="wrapped-card relative w-full max-w-lg h-[100dvh] sm:h-[85vh] sm:rounded-3xl bg-[#121214] border border-zinc-800/60 shadow-2xl flex flex-col justify-between p-6 overflow-hidden">
                
                {/* Progress bar container */}
                <div className="flex gap-1.5 w-full pt-2">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <div key={i} className="h-1 bg-zinc-800 rounded-full flex-1 overflow-hidden">
                            <div 
                                className="h-full bg-emerald-400 transition-all ease-linear"
                                style={{ 
                                    width: i === currentSlide ? `${progress}%` : i < currentSlide ? '100%' : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-12 right-6 text-zinc-400 hover:text-white transition p-2 bg-zinc-900/60 rounded-full backdrop-blur z-20 cursor-pointer"
                >
                    <X size={18} />
                </button>

                {/* Tap navigation zones */}
                <div className="absolute inset-y-20 left-0 w-1/4 z-10 cursor-pointer" onClick={handlePrev} />
                <div className="absolute inset-y-20 right-0 w-1/4 z-10 cursor-pointer" onClick={handleNext} />

                {/* Main Content Slide Area */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 active-slide text-center mt-12 mb-8">
                    
                    {/* SLIDE 0: INTRO */}
                    {currentSlide === 0 && (
                        <div className="space-y-6">
                            <div className="wrapped-anim w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 mx-auto flex items-center justify-center text-black font-black shadow-lg text-2xl">
                                MD
                            </div>
                            <h2 className="wrapped-anim text-3xl font-black text-white leading-tight">
                                Prêt à redécouvrir votre année en musique ?
                            </h2>
                            <p className="wrapped-anim text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
                                Voici votre rétrospective **Music Wrapped 2026**, compilée spécialement pour vous depuis votre journal de bord.
                            </p>
                        </div>
                    )}

                    {/* SLIDE 1: TOTAL CRITIQUES */}
                    {currentSlide === 1 && (
                        <div className="space-y-6">
                            <div className="wrapped-anim w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                                <Award size={32} />
                            </div>
                            <p className="wrapped-anim text-zinc-400 font-bold uppercase tracking-widest text-xs">Votre journal de bord</p>
                            <h2 className="wrapped-anim text-5xl font-black text-white">
                                {stats?.totalReviews || 0}
                            </h2>
                            <p className="wrapped-anim text-xl font-bold text-zinc-200">
                                critiques rédigées cette année !
                            </p>
                            <p className="wrapped-anim text-zinc-400 text-xs italic">
                                C'est autant de disques gravés dans votre histoire.
                            </p>
                        </div>
                    )}

                    {/* SLIDE 2: NOTE MOYENNE */}
                    {currentSlide === 2 && (
                        <div className="space-y-6">
                            <div className="wrapped-anim w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 mx-auto flex items-center justify-center">
                                <Star size={32} fill="currentColor" />
                            </div>
                            <p className="wrapped-anim text-zinc-400 font-bold uppercase tracking-widest text-xs">Votre exigence d'écoute</p>
                            <h2 className="wrapped-anim text-5xl font-black text-white">
                                {stats?.averageRating || 0} <span className="text-2xl text-zinc-500">/5</span>
                            </h2>
                            <p className="wrapped-anim text-xl font-bold text-zinc-200">
                                de note moyenne globale !
                            </p>
                            <p className="wrapped-anim text-zinc-400 text-xs max-w-xs mx-auto leading-relaxed">
                                {(stats?.averageRating || 0) >= 4 
                                    ? "Vous êtes un auditeur passionné et généreux, toujours prêt à apprécier les pépites !"
                                    : (stats?.averageRating || 0) >= 3
                                    ? "Vous êtes juste et équilibré, vous savez faire la part des choses."
                                    : "Vous êtes un critique redoutable ! Obtenir vos 5 étoiles est un véritable exploit."}
                            </p>
                        </div>
                    )}

                    {/* SLIDE 3: GENRE FAVORI */}
                    {currentSlide === 3 && (
                        <div className="space-y-6">
                            <div className="wrapped-anim w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                                <Disc size={32} />
                            </div>
                            <p className="wrapped-anim text-zinc-400 font-bold uppercase tracking-widest text-xs">Votre genre dominant</p>
                            <h2 className="wrapped-anim text-4xl font-black text-emerald-400 capitalize">
                                {topGenre}
                            </h2>
                            <p className="wrapped-anim text-zinc-200 text-sm max-w-xs mx-auto leading-relaxed mt-2">
                                C'est la catégorie musicale que vous avez la plus analysée et notée cette année !
                            </p>
                        </div>
                    )}

                    {/* SLIDE 4: MEILLEUR ALBUM */}
                    {currentSlide === 4 && (
                        <div className="space-y-6">
                            <p className="wrapped-anim text-zinc-400 font-bold uppercase tracking-widest text-xs">Votre coup de cœur ultime</p>
                            
                            {bestAlbum ? (
                                <div className="space-y-4">
                                    {/* Spin vinyl effect */}
                                    <div className="relative w-36 h-36 mx-auto wrapped-anim">
                                        <div className="absolute inset-0 bg-black rounded-full shadow-2xl border-4 border-zinc-800 flex items-center justify-center vinyl-spin">
                                            <div className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center">
                                                <div className="w-3 h-3 rounded-full bg-zinc-950"></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-2 left-2 w-32 h-32 rounded-lg overflow-hidden shadow-2xl border border-zinc-700/50">
                                            <img src={bestAlbum.albumCover} alt={bestAlbum.albumName} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="wrapped-anim">
                                        <h3 className="text-lg font-black text-white truncate max-w-xs mx-auto leading-snug">{bestAlbum.albumName}</h3>
                                        <p className="text-xs text-zinc-400 truncate mt-0.5">{bestAlbum.artistName}</p>
                                    </div>
                                    <div className="wrapped-anim flex items-center justify-center gap-1 text-emerald-400 font-black text-sm">
                                        {bestAlbum.rating}/5 <Star size={12} fill="currentColor" />
                                    </div>
                                </div>
                            ) : (
                                <p className="wrapped-anim text-zinc-400 text-sm italic">Aucun album noté au-dessus de 4/5 cette année.</p>
                            )}

                            <div className="pt-4 wrapped-anim">
                                <button 
                                    onClick={onClose}
                                    className="bg-white hover:bg-zinc-200 text-black px-6 py-2 rounded-full text-xs font-black transition cursor-pointer shadow-lg active:scale-95"
                                >
                                    Fermer la rétrospective
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer text */}
                <div className="text-center text-[9px] text-zinc-650 pb-2">
                    Appuyez à gauche ou à droite pour naviguer • Music Diary Wrapped 2026
                </div>

            </div>
        </div>
    );
}

export default MusicWrappedModal;
