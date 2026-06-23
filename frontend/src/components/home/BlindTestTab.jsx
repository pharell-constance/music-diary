import API_URL from '../../config.js';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { RotateCcw, Trophy, CheckCircle2, XCircle, ArrowRight, Music, AlertTriangle, Disc, Timer, Target, X } from 'lucide-react';
import gsap from 'gsap';

export default function BlindTestTab({ user, onBackToHome }) {
    const [gameState, setGameState] = useState('LOBBY'); // LOBBY | LOADING | PLAYING | RESULTS
    const [artist, setArtist] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [locked, setLocked] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [answersHistory, setAnswersHistory] = useState([]);
    const [error, setError] = useState(null);

    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const gameContainerRef = useRef(null);
    const confettiCanvasRef = useRef(null);
    const curtainRef = useRef(null);
    const curtainTriggered = useRef(false);

    // Dynamic layout state switch transitions
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Entrance transition of the active game container screen
            gsap.fromTo('.game-card-anim',
                { opacity: 0, scale: 0.96, y: 25 },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.15)', clearProps: 'transform' }
            );

            // Left/Right Neobrutalist decor side cards bobbing timelines
            gsap.fromTo('.float-accent-left',
                { x: -40, opacity: 0, rotate: -15 },
                { x: 0, opacity: 1, rotate: -8, duration: 0.8, ease: 'back.out(1.3)', delay: 0.15 }
            );
            gsap.fromTo('.float-accent-right',
                { x: 40, opacity: 0, rotate: 15 },
                { x: 0, opacity: 1, rotate: 12, duration: 0.8, ease: 'back.out(1.3)', delay: 0.25 }
            );

            gsap.to('.float-accent-left', {
                y: '-=12', duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
            });
            gsap.to('.float-accent-right', {
                y: '+=12', duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5
            });

            // Background Floating Shapes
            gsap.fromTo('.bg-shape-float',
                { opacity: 0, scale: 0 },
                { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.4)', stagger: 0.05, delay: 0.1 }
            );

            // Infinite loops
            gsap.to('.bg-shape-float-1', { y: '+=15', rotate: 360, duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to('.bg-shape-float-2', { y: '-=15', rotate: -15, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to('.bg-shape-float-3', { x: '+=10', y: '-=15', rotate: 180, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to('.bg-shape-float-4', { x: '-=10', y: '+=10', rotate: 90, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to('.bg-shape-float-5', { y: '-=20', rotate: -360, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to('.bg-shape-float-6', { y: '+=12', rotate: 20, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 });
            gsap.to('.bg-shape-float-7', { x: '-=12', y: '+=15', rotate: -180, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to('.bg-shape-float-8', { x: '+=8', y: '-=8', rotate: -90, duration: 7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }, gameContainerRef);

        return () => ctx.revert();
    }, [gameState]);

    // Lift curtain up once PLAYING/LOBBY/RESULTS is reached (after a drop was triggered)
    useEffect(() => {
        if (!curtainRef.current) return;
        if (!curtainTriggered.current) return; // Don't lift on initial mount
        if (gameState === 'PLAYING' || gameState === 'LOBBY' || gameState === 'RESULTS') {
            gsap.to(curtainRef.current, {
                y: '-100vh',
                duration: 0.65,
                ease: 'power3.inOut',
                delay: gameState === 'PLAYING' ? 0.1 : 0,
            });
        }
    }, [gameState]);

    // Initial check for favorite artist presence
    useEffect(() => {
        if (!user?.favArtistId) {
            setError("Veuillez d'abord choisir un artiste favori dans votre profil pour jouer !");
        }
        
        return () => {
            stopAudioAndTimer();
        };
    }, [user]);

    // HTML5 Canvas Confetti Explosion when RESULTS state is reached
    useEffect(() => {
        if (gameState !== 'RESULTS') return;

        const canvas = confettiCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let isActive = true;
        let particles = [];
        let particlesInitialized = false;

        const initParticles = (width, height) => {
            const colors = ['#8b5cf6', '#ec4899', '#facc15', '#3b82f6', '#10b981'];
            const count = 120;
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() * 120 + 30) * Math.PI / 180;
                const speed = Math.random() * 14 + 6;
                particles.push({
                    x: width / 2,
                    y: height + 10,
                    sizeX: Math.random() * 6 + 4,
                    sizeY: Math.random() * 10 + 6,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vx: Math.cos(angle) * speed,
                    vy: -Math.sin(angle) * speed,
                    gravity: 0.35,
                    drag: 0.98,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.15,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: Math.random() * 0.08 + 0.04
                });
            }
            particlesInitialized = true;
        };

        const render = () => {
            if (!isActive) return;
            
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width === 0 || height === 0) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            const targetWidth = Math.floor(width * dpr);
            const targetHeight = Math.floor(height * dpr);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.scale(dpr, dpr);
            }

            if (!particlesInitialized) {
                initParticles(width, height);
            }

            ctx.clearRect(0, 0, width, height);

            let activeParticles = 0;
            particles.forEach(p => {
                if (p.y < height + 20) {
                    activeParticles++;

                    p.vx *= p.drag;
                    p.vy *= p.drag;
                    p.vy += p.gravity;
                    p.x += p.vx + Math.sin(p.wobble) * 0.6;
                    p.y += p.vy;
                    p.rotation += p.rotationSpeed;
                    p.wobble += p.wobbleSpeed;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.sizeX / 2, -p.sizeY / 2, p.sizeX, p.sizeY);
                    ctx.restore();
                }
            });

            if (activeParticles > 0) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        // Delay starting slightly for transition
        const timerId = setTimeout(() => {
            render();
        }, 150);

        return () => {
            isActive = false;
            clearTimeout(timerId);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [gameState]);

    const stopAudioAndTimer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const startNewGame = () => {
        if (!curtainRef.current) return;
        curtainTriggered.current = true;

        // Position curtain above the viewport then drop it down
        gsap.set(curtainRef.current, { y: '-100vh' });
        gsap.to(curtainRef.current, {
            y: '0vh',
            duration: 0.6,
            ease: 'power4.inOut',
            onComplete: () => {
                // Once covered, reset state and fetch data
                setError(null);
                setGameState('LOADING');
                setScore(0);
                setCurrentQuestionIdx(0);
                setAnswersHistory([]);
                setSelectedOption(null);
                setLocked(false);
                stopAudioAndTimer();
                _fetchAndStartGame();
            }
        });
    };

    const _fetchAndStartGame = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/game/blindtest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la récupération des morceaux.");
            if (!data.questions || data.questions.length === 0) throw new Error("Aucun extrait audio disponible pour cet artiste.");
            setArtist(data.artist);
            setQuestions(data.questions);
            setGameState('PLAYING');
            startQuestion(data.questions, 0);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setGameState('LOBBY');
        }
    };

    const quitGame = () => {
        if (!curtainRef.current) return;
        curtainTriggered.current = true;
        gsap.set(curtainRef.current, { y: '-100vh' });
        gsap.to(curtainRef.current, {
            y: '0vh',
            duration: 0.5,
            ease: 'power4.inOut',
            onComplete: () => {
                stopAudioAndTimer();
                setGameState('LOBBY');
                setScore(0);
                setCurrentQuestionIdx(0);
                setAnswersHistory([]);
                setSelectedOption(null);
                setLocked(false);
            }
        });
    };

    const startQuestion = (questionsList, idx) => {
        setSelectedOption(null);
        setLocked(false);
        setTimeLeft(15);

        const currentQ = questionsList[idx];

        // Launch audio
        if (audioRef.current) {
            audioRef.current.src = currentQ.previewUrl;
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(e => console.error("Impossible de lire l'audio :", e));
        }

        // Launch timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeOut(questionsList[idx]);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSelectOption = (option) => {
        if (locked) return;
        setLocked(true);
        setSelectedOption(option);
        
        // Stop audio & timer
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const currentQ = questions[currentQuestionIdx];
        const isCorrect = option === currentQ.correctAnswer;

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setAnswersHistory(prev => [
            ...prev,
            {
                trackName: currentQ.correctAnswer,
                albumCover: currentQ.albumCover,
                correct: isCorrect,
                userChoice: option || "Temps écoulé"
            }
        ]);
    };

    const handleTimeOut = (question) => {
        setLocked(true);
        setSelectedOption(null);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setAnswersHistory(prev => [
            ...prev,
            {
                trackName: question.correctAnswer,
                albumCover: question.albumCover,
                correct: false,
                userChoice: "Temps écoulé"
            }
        ]);
    };

    const nextQuestion = () => {
        const nextIdx = currentQuestionIdx + 1;
        if (nextIdx < questions.length) {
            setCurrentQuestionIdx(nextIdx);
            startQuestion(questions, nextIdx);
        } else {
            setGameState('RESULTS');
            stopAudioAndTimer();
        }
    };

    // Get customized message based on score
    const getScoreFeedback = () => {
        const percentage = score / questions.length;
        if (percentage === 1) return { text: "Incroyable ! Tu es un génie absolu et le fan ultime !", color: "text-violet-400" };
        if (percentage >= 0.8) return { text: "Excellent ! Tu connais cet artiste sur le bout des doigts !", color: "text-emerald-400" };
        if (percentage >= 0.5) return { text: "Pas mal ! Encore un peu d'écoute et tu auras la note maximale !", color: "text-amber-400" };
        if (percentage >= 0.2) return { text: "Moyen... Tu devrais réécouter ses albums plus souvent !", color: "text-orange-400" };
        return { text: "Aïe... Es-tu sûr d'avoir choisi le bon artiste favori ?", color: "text-red-400" };
    };

    return (
        <div ref={gameContainerRef} className="max-w-4xl mx-auto w-full px-4 py-6 font-sans relative">
            {/* Full-screen absolute Background Grid Overlay */}
            <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-[-1]" />

            {/* Audio Element */}
            <audio ref={audioRef} preload="auto" />

            {/* Background Floating Decorative Gutter Shapes */}
            {/* LEFT GUTTER */}
            <div className="absolute -left-48 top-[10%] text-fuchsia-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-1 hidden xl:block z-0">
                <div className="w-24 h-24 bg-fuchsia-600/5 border-2 border-fuchsia-500/20 rounded-full flex items-center justify-center shadow-lg">
                    <Disc size={44} className="text-fuchsia-500/30 animate-spin-slow" style={{ animationDuration: '8s' }} />
                </div>
            </div>
            <div className="absolute -left-36 top-[38%] text-violet-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-2 hidden xl:block z-0">
                <div className="w-16 h-16 bg-violet-600/5 border-1.5 border-violet-500/20 rounded-2xl flex items-center justify-center rotate-[-12deg]">
                    <Music size={28} className="text-violet-500/30 animate-bounce" style={{ animationDuration: '1.5s' }} />
                </div>
            </div>
            <div className="absolute -left-40 top-[68%] text-yellow-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-3 hidden xl:block z-0">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="opacity-25">
                    <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
                </svg>
            </div>
            <div className="absolute -left-28 top-[88%] text-fuchsia-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-4 hidden xl:block z-0">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-20">
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                </svg>
            </div>

            {/* RIGHT GUTTER */}
            <div className="absolute -right-48 top-[15%] text-yellow-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-5 hidden xl:block z-0">
                <div className="w-24 h-24 bg-yellow-500/5 border-2 border-yellow-500/20 rounded-full flex items-center justify-center shadow-lg">
                    <Disc size={44} className="text-yellow-500/30 animate-spin-slow" style={{ animationDuration: '12s' }} />
                </div>
            </div>
            <div className="absolute -right-36 top-[42%] text-fuchsia-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-6 hidden xl:block z-0">
                <div className="w-16 h-16 bg-fuchsia-600/5 border-1.5 border-fuchsia-500/20 rounded-2xl flex items-center justify-center rotate-[15deg]">
                    <Music size={28} className="text-fuchsia-500/30 animate-bounce" style={{ animationDuration: '2s' }} />
                </div>
            </div>
            <div className="absolute -right-40 top-[72%] text-violet-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-7 hidden xl:block z-0">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="opacity-25">
                    <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
                </svg>
            </div>
            <div className="absolute -right-28 top-[90%] text-yellow-500/20 pointer-events-none select-none bg-shape-float bg-shape-float-8 hidden xl:block z-0">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-20">
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                </svg>
            </div>

            {/* ERROR CARD */}
            {error && (
                <div className="neobrutal-card border-red-500 bg-red-500/10 text-white p-6 rounded-2xl flex flex-col items-center gap-4 text-center mb-6 game-card-anim">
                    <AlertTriangle className="text-red-500" size={48} />
                    <h3 className="font-mouse-memoirs text-3xl uppercase tracking-wider text-red-500">Erreur</h3>
                    <p className="font-medium">{error}</p>
                    <button
                        onClick={() => window.location.href = '/profile'}
                        className="neobrutal-button px-6 py-2.5 bg-red-500 text-white font-mouse-memoirs uppercase tracking-widest text-sm"
                    >
                        Accéder à mon Profil
                    </button>
                </div>
            )}

            {/* LOBBY SCREEN */}
            {gameState === 'LOBBY' && !error && (
                <div className="relative">
                    {/* Decorative floating side elements (visible on large viewports) */}
                    <div className="hidden lg:flex absolute -left-28 top-12 w-24 h-24 bg-[#facc15] border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000000] p-4 flex-col items-center justify-center float-accent-left rotate-[-8deg] z-0 select-none">
                        <Disc size={32} className="text-black animate-spin-slow" style={{ animationDuration: '6s' }} />
                        <span className="font-mouse-memoirs text-xs text-black uppercase tracking-wider mt-1.5 font-black">PLAY</span>
                    </div>

                    <div className="hidden lg:flex absolute -right-28 top-28 w-24 h-24 bg-[#ec4899] border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000000] p-4 flex-col items-center justify-center float-accent-right rotate-[12deg] z-0 select-none">
                        <Music size={32} className="text-white animate-bounce" style={{ animationDuration: '1.2s' }} />
                        <span className="font-mouse-memoirs text-xs text-white uppercase tracking-wider mt-1.5 font-black">BEAT</span>
                    </div>

                    <div className="neobrutal-card bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_#000000] relative overflow-hidden flex flex-col items-center text-center gap-6 game-card-anim z-10">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-[80px] pointer-events-none" />

                    <div className="w-20 h-20 bg-violet-600 border-2.5 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] z-10 animate-pulse">
                        <Trophy className="text-white" size={36} />
                    </div>

                    <div className="z-10">
                        <h2 className="font-mouse-memoirs text-[52px] leading-none uppercase tracking-wider text-stroke-dark text-white">
                            Blind Test de l'Artiste n°1
                        </h2>
                        <p className="text-zinc-400 mt-2 text-sm font-medium tracking-wide">
                            Prouvez votre amour pour votre artiste préféré de Music Diary
                        </p>
                    </div>

                    {user?.favArtistName && (
                        <div className="neobrutal-card bg-[#12101b] border-2.5 border-white/10 p-5 rounded-2xl flex items-center gap-4 w-full max-w-md z-10">
                            <div className="w-16 h-16 rounded-xl bg-zinc-800 border-2 border-white/20 overflow-hidden flex-shrink-0 shadow-md">
                                {user.favArtistImage ? (
                                    <img src={user.favArtistImage} alt={user.favArtistName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-500"><Music size={24} /></div>
                                )}
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] uppercase font-black text-violet-400 tracking-wider">Artiste sélectionné</span>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider mt-0.5">{user.favArtistName}</h3>
                            </div>
                        </div>
                    )}

                    <div className="text-zinc-400 text-xs font-semibold space-y-2.5 max-w-sm z-10 bg-black/20 p-4 rounded-xl border border-white/5 text-left w-full">
                        <div className="flex items-center gap-2.5">
                            <Timer size={14} className="text-violet-400 shrink-0" />
                            <span>15 secondes d'écoute par morceau</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Target size={14} className="text-violet-400 shrink-0" />
                            <span>10 questions à choix multiples</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Music size={14} className="text-violet-400 shrink-0" />
                            <span>Des extraits aléatoires de sa discographie</span>
                        </div>
                    </div>

                    <button
                        onClick={startNewGame}
                        className="neobrutal-button px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-mouse-memoirs uppercase tracking-widest text-lg shadow-[6px_6px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0px_#000000] transition-all cursor-pointer z-10"
                    >
                        DÉMARRER LA PARTIE
                    </button>
                </div>
                </div>
            )}

            {/* LOADING SCREEN */}
            {gameState === 'LOADING' && (
                <div className="neobrutal-card bg-zinc-900 border-4 border-black p-12 rounded-3xl shadow-[8px_8px_0px_#000000] flex flex-col items-center justify-center text-center gap-6 game-card-anim">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-t-violet-500 border-r-fuchsia-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <Disc className="absolute text-violet-400 animate-spin-slow" size={28} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="font-mouse-memoirs text-3xl uppercase tracking-widest text-white">Préparation de la partie...</h3>
                        <p className="text-zinc-400 text-sm font-medium">Récupération des extraits Spotify et génération des choix multiples...</p>
                    </div>
                </div>
            )}

            {/* PLAYING SCREEN - Full Screen Immersive Mode */}
            {gameState === 'PLAYING' && questions.length > 0 && (
                <div className="fixed inset-0 z-40 bg-zinc-950 bg-grid-pattern flex flex-col justify-center items-center overflow-y-auto py-8 game-card-anim">

                {/* Quit button - fixed top-right */}
                <button
                    onClick={quitGame}
                    className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-red-600 text-white font-mouse-memoirs uppercase tracking-widest text-xs border-2 border-white/20 hover:border-red-500 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,0.5)] hover:shadow-[3px_3px_0px_#dc2626] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 cursor-pointer group"
                >
                    <X size={14} className="group-hover:rotate-90 transition-transform duration-200" />
                    Quitter
                </button>

                <div className="w-full max-w-2xl px-4 space-y-5">
                    {/* Header bar / Progress */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="font-mouse-memoirs text-2xl uppercase tracking-widest text-zinc-400">
                            Question <span className="text-white font-black text-3xl">{currentQuestionIdx + 1}</span> / {questions.length}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs uppercase font-black tracking-widest text-zinc-500">Score</span>
                            <div className="neobrutal-card border-2 border-black bg-violet-600 text-white px-3 py-1 font-black text-sm shadow-[2px_2px_0px_#000000]">
                                {score} pts
                            </div>
                        </div>
                    </div>

                    {/* Main playing card */}
                    <div className="neobrutal-card bg-zinc-900 border-4 border-black p-6 md:p-8 rounded-3xl shadow-[8px_8px_0px_#000000] flex flex-col items-center gap-6 relative overflow-hidden">
                        {/* Timer overlay bar */}
                        <div 
                            className="absolute top-0 left-0 h-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / 15) * 100}%` }}
                        />

                        {/* Visual representation of audio playing */}
                        <div className="flex flex-col items-center gap-4 mt-2">
                            {/* Record Player Body Container */}
                            <div className="relative flex items-center justify-center w-56 h-36 border-2 border-black/10 bg-black/10 rounded-2xl p-4">
                                {/* Spinning Disc vinyl */}
                                <div className="relative z-10">
                                    <div className={`w-28 h-28 rounded-full bg-zinc-950 border-3 border-black ring-4 ring-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2),4px_4px_0px_#000000] flex items-center justify-center relative ${!locked ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '6s' }}>
                                        {/* Center groove */}
                                        <div className="absolute inset-2.5 rounded-full border border-white/5" />
                                        <div className="absolute inset-5 rounded-full border border-white/5" />
                                        <div className="absolute inset-8 rounded-full border border-white/10" />

                                        {/* Artist image in center */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-black/80 flex-shrink-0 relative bg-zinc-900">
                                            {artist?.image ? (
                                                <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Music className="text-zinc-600 w-full h-full p-2" />
                                            )}
                                        </div>
                                        <div className="absolute w-1.5 h-1.5 bg-black rounded-full center" />
                                    </div>
                                </div>

                                {/* Mechanical Tone Arm */}
                                <div 
                                    className="absolute right-4 top-4 w-16 h-20 origin-top-right transition-transform duration-700 ease-out z-20 pointer-events-none"
                                    style={{
                                        transform: !locked ? 'rotate(24deg)' : 'rotate(0deg)'
                                    }}
                                >
                                    {/* Base pivot */}
                                    <div className="absolute right-0 top-0 w-6 h-6 bg-zinc-800 border-2.5 border-black rounded-full shadow-[2px_2px_0px_#000000] flex items-center justify-center">
                                        <div className="w-2 h-2 bg-zinc-500 rounded-full border border-black" />
                                    </div>
                                    {/* Arm line */}
                                    <div className="absolute right-2 top-2 w-1.5 h-14 bg-zinc-400 border-x border-b border-black origin-top shadow-[1px_1px_0px_rgba(0,0,0,0.5)]" />
                                    {/* Stylized cartridge head */}
                                    <div className="absolute right-[5px] top-[54px] w-3 h-5 bg-[#ec4899] border-2 border-black rounded-sm shadow-[1.5px_1.5px_0px_#000000] flex flex-col items-center justify-end">
                                        <div className="w-1 h-1.5 bg-zinc-300 border-x border-black" />
                                    </div>
                                </div>
                            </div>

                            {/* Bouncing audio wave bars */}
                            {!locked ? (
                                <div className="flex items-end gap-1.5 h-7 mt-2">
                                    <span className="w-1 bg-violet-500 rounded-full animate-bounce h-4" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
                                    <span className="w-1 bg-violet-400 rounded-full animate-bounce h-6" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }} />
                                    <span className="w-1 bg-fuchsia-500 rounded-full animate-bounce h-5" style={{ animationDelay: '0.0s', animationDuration: '0.7s' }} />
                                    <span className="w-1 bg-fuchsia-400 rounded-full animate-bounce h-7" style={{ animationDelay: '0.4s', animationDuration: '0.8s' }} />
                                    <span className="w-1 bg-violet-500 rounded-full animate-bounce h-4" style={{ animationDelay: '0.2s', animationDuration: '0.4s' }} />
                                </div>
                            ) : (
                                <div className="flex items-end gap-1.5 h-7 mt-2 opacity-30">
                                    <span className="w-1 bg-zinc-600 rounded-full h-1" />
                                    <span className="w-1 bg-zinc-600 rounded-full h-1" />
                                    <span className="w-1 bg-zinc-600 rounded-full h-1" />
                                    <span className="w-1 bg-zinc-600 rounded-full h-1" />
                                    <span className="w-1 bg-zinc-600 rounded-full h-1" />
                                </div>
                            )}
                        </div>

                        {/* Floating Timer Countdown */}
                        <div className={`w-14 h-14 rounded-full border-3 border-black font-mouse-memoirs text-2xl flex items-center justify-center shadow-[3px_3px_0px_#000000] select-none ${
                            timeLeft <= 5 ? 'bg-red-500 text-white animate-bounce' : 'bg-white text-black'
                        }`}>
                            {timeLeft}s
                        </div>

                        {/* Options Buttons Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                            {questions[currentQuestionIdx].options.map((option, oIdx) => {
                                const isCorrectAnswer = option === questions[currentQuestionIdx].correctAnswer;
                                const isSelected = option === selectedOption;

                                let btnClass = "bg-white text-black hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000000]";
                                let icon = null;

                                if (locked) {
                                    if (isCorrectAnswer) {
                                        // Highlight correct answer in green
                                        btnClass = "bg-emerald-500 text-white border-emerald-600 shadow-[2px_2px_0px_#000000] scale-100";
                                        icon = <CheckCircle2 size={16} className="text-white shrink-0" />;
                                    } else if (isSelected) {
                                        // User picked this incorrect option
                                        btnClass = "bg-red-500 text-white border-red-600 shadow-[2px_2px_0px_#000000] scale-100";
                                        icon = <XCircle size={16} className="text-white shrink-0" />;
                                    } else {
                                        // Unselected, incorrect options
                                        btnClass = "bg-zinc-800 text-zinc-500 border-zinc-950 opacity-40 shadow-none pointer-events-none";
                                    }
                                }

                                return (
                                    <button
                                        key={oIdx}
                                        onClick={() => handleSelectOption(option)}
                                        disabled={locked}
                                        className={`neobrutal-button p-4 text-left font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-3 w-full border-3 border-black shadow-[4px_4px_0px_#000000] ${btnClass} disabled:cursor-default`}
                                    >
                                        <span className="w-6 h-6 rounded-full bg-zinc-950/5 dark:bg-zinc-950/20 text-zinc-500 font-black text-xs flex items-center justify-center shrink-0 border border-black/10">
                                            {String.fromCharCode(65 + oIdx)}
                                        </span>
                                        <span className="flex-1 truncate">{option}</span>
                                        {icon}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Next question / Show results CTA */}
                        {locked && (
                            <button
                                onClick={nextQuestion}
                                className="neobrutal-button mt-4 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white font-mouse-memoirs uppercase tracking-widest text-md flex items-center gap-2.5 border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer animate-fade-in"
                            >
                                <span>
                                    {currentQuestionIdx + 1 === questions.length ? "Voir les résultats" : "Chanson Suivante"}
                                </span>
                                <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
                </div>
            )}

            {/* RESULTS SCREEN */}
            {gameState === 'RESULTS' && (
                <div className="space-y-6 game-card-anim">
                    {/* Score Card */}
                    <div className="neobrutal-card bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_#000000] relative overflow-hidden flex flex-col items-center text-center gap-5">
                        {/* Background sparkles */}
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />

                        {/* Interactive Confetti Canvas */}
                        <canvas ref={confettiCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-3xl" />

                        <div className="w-16 h-16 bg-amber-500 border-2.5 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000000] z-10 animate-bounce relative">
                            <Trophy className="text-black" size={28} />
                        </div>

                        <div className="z-10">
                            <span className="text-[10px] uppercase font-black text-violet-400 tracking-wider">Score Final</span>
                            <h2 className="font-mouse-memoirs text-6xl text-white mt-1">
                                {score} <span className="text-2xl text-zinc-500">/ {questions.length}</span>
                            </h2>
                            <p className={`text-md font-bold mt-2 ${getScoreFeedback().color}`}>
                                {getScoreFeedback().text}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-2 z-10">
                            <button
                                onClick={startNewGame}
                                className="neobrutal-button flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-mouse-memoirs uppercase tracking-widest text-sm border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} />
                                Rejouer
                            </button>
                            <button
                                onClick={onBackToHome}
                                className="neobrutal-button flex-1 py-3 bg-white text-black font-mouse-memoirs uppercase tracking-widest text-sm border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center justify-center"
                            >
                                Retour à l'accueil
                            </button>
                        </div>
                    </div>

                    {/* Summary list details */}
                    <div className="neobrutal-card bg-zinc-950/40 border-2.5 border-white/10 p-6 rounded-2xl space-y-4">
                        <h3 className="font-mouse-memoirs text-2xl uppercase tracking-widest text-white border-b border-white/10 pb-2">
                            Récapitulatif de la session
                        </h3>

                        <div data-lenis-prevent className="space-y-3 max-h-96 overflow-y-auto no-scrollbar pr-1">
                            {answersHistory.map((historyItem, idx) => (
                                <div 
                                    key={idx}
                                    className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-xl border border-white/5 shadow-inner"
                                >
                                    <div className="w-12 h-12 bg-zinc-800 border border-white/10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                                        {historyItem.albumCover ? (
                                            <img src={historyItem.albumCover} alt={historyItem.trackName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500"><Music size={18} /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs text-white truncate uppercase tracking-wider">{historyItem.trackName}</h4>
                                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                                            Votre réponse : <span className={historyItem.correct ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{historyItem.userChoice}</span>
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {historyItem.correct ? (
                                            <CheckCircle2 className="text-emerald-500" size={20} />
                                        ) : (
                                            <XCircle className="text-red-500" size={20} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* GSAP Stage Curtain — always in DOM, slides in/out via transform */}
            <div
                ref={curtainRef}
                className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6 border-b-8 border-white/10 shadow-2xl"
                style={{ transform: 'translateY(-100vh)', willChange: 'transform' }}
            >
                {/* Curtain content: animated disc only */}
                <div className="w-24 h-24 rounded-full bg-white/5 border-4 border-white/10 flex items-center justify-center shadow-2xl">
                    <Disc size={52} className="text-white/50 animate-spin-slow" style={{ animationDuration: '2s' }} />
                </div>
                <p className="font-mouse-memoirs text-5xl text-white uppercase tracking-widest">Blind Test</p>
                {/* Decorative dots */}
                <div className="flex gap-3">
                    <div className="w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        </div>
    );
}
