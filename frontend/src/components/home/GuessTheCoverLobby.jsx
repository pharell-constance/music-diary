import { useEffect, useRef } from 'react';
import { Disc } from 'lucide-react';
import gsap from 'gsap';

export default function GuessTheCoverLobby({ user, startNewGame }) {
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const startBtnRef = useRef(null);
    const containerRef = useRef(null);

    const titleText = "GUESS THE COVER";

    useEffect(() => {
        const ctx = gsap.context(() => {
            const titleChars = titleRef.current?.querySelectorAll('.char');
            if (titleChars && titleChars.length > 0) {
                gsap.fromTo(titleChars, 
                    { 
                        opacity: 0, 
                        y: 80, 
                        rotateX: -60,
                        filter: 'blur(10px)'
                    },
                    { 
                        opacity: 1, 
                        y: 0, 
                        rotateX: 0,
                        filter: 'blur(0px)',
                        duration: 1.2, 
                        stagger: 0.05, 
                        ease: 'power4.out' 
                    }
                );
            }

            if (subtitleRef.current) {
                gsap.fromTo(subtitleRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: 'power3.out' }
                );
            }

            if (startBtnRef.current) {
                gsap.fromTo(startBtnRef.current,
                    { opacity: 0, scale: 0.9 },
                    { opacity: 1, scale: 1, duration: 0.8, delay: 0.9, ease: 'back.out(1.5)' }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="flex flex-col items-center justify-center min-h-[70vh] text-center relative py-12">
            {/* Minimal decorative line grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] dark:from-zinc-900/50 dark:via-black dark:to-black from-zinc-100/50 via-white to-white z-0 pointer-events-none" />
            
            <div className="relative z-10 space-y-8 max-w-2xl px-4 flex flex-col items-center">
                <div className="space-y-4">
                    <span className="text-[11px] font-black tracking-[0.3em] uppercase text-zinc-500 animate-pulse block">
                        MULTIPLE CHOICE ARCADE GAME
                    </span>
                    
                    {/* Inkwell.tech fluid typography title */}
                    <h1 ref={titleRef} className="font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight text-zinc-900 dark:text-white flex flex-wrap justify-center overflow-hidden leading-none select-none" style={{ perspective: '1000px' }}>
                        {titleText.split('').map((char, index) => (
                            <span 
                                key={index} 
                                className="char inline-block origin-bottom transform-gpu"
                                style={{ display: char === ' ' ? 'inline' : 'inline-block', width: char === ' ' ? '0.25em' : 'auto' }}
                            >
                                {char}
                            </span>
                        ))}
                    </h1>

                    <p ref={subtitleRef} className="text-zinc-650 dark:text-zinc-400 font-medium text-xs md:text-sm max-w-md mx-auto tracking-wide leading-relaxed pt-2">
                        Un jeu visuel où les détails comptent. Identifiez l'illustration d'album de <span className="text-violet-650 dark:text-violet-400 font-extrabold uppercase">{user?.favArtistName || 'votre artiste favori'}</span> qui émerge lentement du flou.
                    </p>
                </div>

                {user?.favArtistName && (
                    <div className="flex items-center gap-3 bg-zinc-100 dark:bg-[#110e19] border-2 border-zinc-200 dark:border-white/5 p-4 rounded-2xl w-full max-w-sm text-left shadow-lg">
                        <div className="w-12 h-12 rounded-xl bg-zinc-355 dark:bg-zinc-800 border-2 border-zinc-400 dark:border-white/10 overflow-hidden flex-shrink-0 shadow-md">
                            {user.favArtistImage ? (
                                <img src={user.favArtistImage} alt={user.favArtistName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-550"><Disc size={20} /></div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] uppercase font-black text-fuchsia-650 dark:text-fuchsia-400 tracking-wider">Artiste Configuré</span>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider truncate mt-0.5">{user.favArtistName}</h3>
                        </div>
                    </div>
                )}

                {/* Play Action Button */}
                <div ref={startBtnRef} className="pt-6">
                    <button
                        onClick={startNewGame}
                        className="neobrutal-button px-10 py-5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-95 text-white font-mouse-memoirs uppercase tracking-widest text-xl shadow-[8px_8px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0px_#000000] transition-all cursor-pointer"
                    >
                        DÉMARRER LE DÉFI
                    </button>
                </div>
            </div>
        </div>
    );
}
