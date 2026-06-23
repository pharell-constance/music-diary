import { useEffect, useRef } from 'react';
import { RotateCcw, Trophy, CheckCircle2, XCircle, ArrowRight, Disc, AlertTriangle, Target, X, Zap } from 'lucide-react';
import gsap from 'gsap';
import useGuessTheCover from '../../hooks/useGuessTheCover';
import ConfettiCanvas from './ConfettiCanvas';

export default function GuessTheCoverTab({ user, onBackToHome }) {
    const {
        gameState, setGameState,
        artist,
        questions,
        currentQuestionIdx,
        selectedOption,
        locked, setLocked,
        score, setScore,
        correctAnswersCount,
        timeLeft,
        answersHistory,
        error, setError,
        imageReady, setImageReady,
        stopGameTimer,
        fetchQuestionsAndStart,
        handleSelectOption,
        nextQuestion
    } = useGuessTheCover(user);

    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const startBtnRef = useRef(null);
    const curtainRef = useRef(null);
    const curtainTriggered = useRef(false);

    // Inkwell.tech-style text reveal animation on Lobby Mount
    useEffect(() => {
        if (gameState !== 'LOBBY') return;

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
    }, [gameState]);

    // Lift curtain once state is set to PLAYING / LOBBY / RESULTS
    useEffect(() => {
        if (!curtainRef.current) return;
        if (!curtainTriggered.current) return;
        if (gameState === 'PLAYING' || gameState === 'LOBBY' || gameState === 'RESULTS') {
            gsap.to(curtainRef.current, {
                y: '-100vh',
                duration: 0.7,
                ease: 'power4.inOut',
                delay: gameState === 'PLAYING' ? 0.15 : 0,
            });
        }
    }, [gameState]);

    const startNewGame = () => {
        if (!curtainRef.current) return;
        curtainTriggered.current = true;

        gsap.set(curtainRef.current, { y: '-100vh' });
        gsap.to(curtainRef.current, {
            y: '0vh',
            duration: 0.6,
            ease: 'power4.inOut',
            onComplete: () => {
                setError(null);
                setGameState('LOADING');
                setScore(0);
                stopGameTimer();
                fetchQuestionsAndStart();
            }
        });
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
                stopGameTimer();
                setGameState('LOBBY');
                setScore(0);
                setLocked(false);
            }
        });
    };

    const getScoreFeedback = () => {
        const maxScore = questions.length * 100;
        const percentage = score / maxScore;
        if (percentage >= 0.8) return { text: "Impressionnant ! Tu repères les pochettes en un clin d'œil !", color: "text-fuchsia-400" };
        if (percentage >= 0.5) return { text: "Super score ! Très bon sens du détail visuel.", color: "text-violet-400" };
        if (percentage >= 0.25) return { text: "Pas mal ! Mais tu devrais prendre plus de risques quand c'est flou.", color: "text-amber-400" };
        return { text: "Essaye encore ! La discographie mérite d'être contemplée de plus près.", color: "text-red-400" };
    };

    const titleText = "GUESS THE COVER";
    const currentBlur = locked ? 0 : Math.max(0, (timeLeft / 15) * 45);

    return (
        <div ref={containerRef} className="max-w-4xl mx-auto w-full px-4 py-6 font-sans relative select-none">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-[-1]" />

            {/* Error Message */}
            {error && (
                <div className="neobrutal-card border-red-500 bg-red-500/10 text-white p-6 rounded-2xl flex flex-col items-center gap-4 text-center mb-6 game-card-anim z-10">
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

            {/* LOBBY SCREEN (Style Inkwell.tech) */}
            {gameState === 'LOBBY' && !error && (
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center relative py-12">
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

                        {/* Artist Badge */}
                        {user?.favArtistName && (
                            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-[#110e19] border-2 border-zinc-200 dark:border-white/5 p-4 rounded-2xl w-full max-w-sm text-left shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-zinc-350 dark:bg-zinc-800 border-2 border-zinc-400 dark:border-white/10 overflow-hidden flex-shrink-0 shadow-md">
                                    {user.favArtistImage ? (
                                        <img src={user.favArtistImage} alt={user.favArtistName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500"><Disc size={20} /></div>
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
            )}

            {/* LOADING SCREEN */}
            {gameState === 'LOADING' && (
                <div className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-12 rounded-3xl shadow-[8px_8px_0px_#000000] flex flex-col items-center justify-center text-center gap-6 game-card-anim min-h-[50vh]">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-t-fuchsia-500 border-r-violet-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <Disc className="absolute text-fuchsia-500 dark:text-fuchsia-400 animate-spin-slow" size={28} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="font-mouse-memoirs text-3xl uppercase tracking-widest text-zinc-900 dark:text-white">Création du défi...</h3>
                        <p className="text-zinc-655 dark:text-zinc-400 text-sm font-medium">Téléchargement des pochettes d'albums haute définition...</p>
                    </div>
                </div>
            )}

            {/* PLAYING SCREEN */}
            {gameState === 'PLAYING' && questions.length > 0 && (
                <div className="fixed inset-0 z-40 bg-zinc-50 dark:bg-zinc-950 bg-grid-pattern flex flex-col justify-center items-center overflow-y-auto py-8 game-card-anim">
                    {/* Quit button */}
                    <button
                        onClick={quitGame}
                        className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-red-655 hover:bg-red-600 dark:hover:bg-red-600 text-zinc-800 dark:text-white font-mouse-memoirs uppercase tracking-widest text-xs border-2 border-zinc-250 dark:border-white/20 hover:border-red-500 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,0.15)] dark:shadow-[3px_3px_0px_rgba(0,0,0,0.5)] hover:shadow-[3px_3px_0px_#dc2626] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 cursor-pointer group"
                    >
                        <X size={14} className="group-hover:rotate-90 transition-transform duration-200" />
                        Quitter
                    </button>

                    <div className="w-full max-w-2xl px-4 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="font-mouse-memoirs text-2xl uppercase tracking-widest text-zinc-655 dark:text-zinc-400">
                                Album <span className="text-zinc-900 dark:text-white font-black text-3xl">{currentQuestionIdx + 1}</span> / {questions.length}
                            </div>
                            
                            <div className="flex gap-4 items-center">
                                <div className="flex items-center gap-1.5 text-zinc-655 dark:text-zinc-400 text-xs font-semibold">
                                    <Target size={14} className="text-zinc-500" />
                                    <span>{correctAnswersCount} / {questions.length} correct</span>
                                </div>
                                <div className="neobrutal-card border-2 border-black bg-fuchsia-600 text-white px-3.5 py-1 font-black text-sm shadow-[2px_2px_0px_#000000] flex items-center gap-1">
                                    <Zap size={12} className="fill-white" />
                                    {score} pts
                                </div>
                            </div>
                        </div>

                        {/* Main gameplay card */}
                        <div className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-6 md:p-8 rounded-3xl shadow-[8px_8px_0px_#000000] flex flex-col items-center gap-6 relative overflow-hidden">
                            <div 
                                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-fuchsia-600 to-pink-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${(timeLeft / 15) * 100}%` }}
                            />

                            {!locked && (
                                <div className="absolute top-5 right-5 text-right flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase text-fuchsia-600 dark:text-fuchsia-400 tracking-wider">Points à gagner</span>
                                    <span className="font-mouse-memoirs text-2xl text-zinc-900 dark:text-white font-extrabold flex items-center gap-1">
                                        +{Math.max(10, Math.round((timeLeft / 15) * 100))}
                                    </span>
                                </div>
                            )}

                            {/* Cover Container */}
                            <div className="relative w-64 h-64 md:w-72 md:h-72 bg-zinc-100 dark:bg-zinc-950 border-4 border-black rounded-2xl shadow-[6px_6px_0px_#000000] overflow-hidden flex items-center justify-center flex-shrink-0">
                                <img 
                                    src={questions[currentQuestionIdx].albumCover} 
                                    onLoad={() => setImageReady(true)}
                                    alt="Mysterious Album Cover" 
                                    className="w-full h-full object-cover transition-all duration-355 transform-gpu select-none pointer-events-none"
                                    style={{
                                        filter: `blur(${!imageReady ? 45 : currentBlur}px)`,
                                        transform: locked ? 'scale(1)' : 'scale(1.04)'
                                    }}
                                />
                            </div>

                            <div className={`w-14 h-14 rounded-full border-3 border-black font-mouse-memoirs text-2xl flex items-center justify-center shadow-[3px_3px_0px_#000000] select-none ${
                                timeLeft <= 4 ? 'bg-red-500 text-white animate-bounce' : 'bg-white dark:bg-zinc-800 text-black dark:text-white'
                            }`}>
                                {timeLeft}s
                            </div>

                            {/* QCM Options Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                                {questions[currentQuestionIdx].options.map((option, oIdx) => {
                                    const isCorrectAnswer = option === questions[currentQuestionIdx].correctAnswer;
                                    const isSelected = option === selectedOption;

                                    let btnClass = "bg-white dark:bg-zinc-800 text-black dark:text-white hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000000] dark:hover:shadow-[6px_6px_0px_#000000]";
                                    let icon = null;

                                    if (locked) {
                                        if (isCorrectAnswer) {
                                            btnClass = "bg-emerald-500 text-white border-emerald-600 shadow-[2px_2px_0px_#000000] scale-100";
                                            icon = <CheckCircle2 size={16} className="text-white shrink-0" />;
                                        } else if (isSelected) {
                                            btnClass = "bg-red-500 text-white border-red-600 shadow-[2px_2px_0px_#000000] scale-100";
                                            icon = <XCircle size={16} className="text-white shrink-0" />;
                                        } else {
                                            btnClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-250 dark:border-zinc-950 opacity-45 shadow-none pointer-events-none";
                                        }
                                    }

                                    return (
                                        <button
                                            key={oIdx}
                                            onClick={() => handleSelectOption(option)}
                                            disabled={locked}
                                            className={`neobrutal-button p-4 text-left font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-3 w-full border-3 border-black shadow-[4px_4px_0px_#000000] ${btnClass} disabled:cursor-default`}
                                        >
                                            <span className="w-6 h-6 rounded-full bg-zinc-200/50 dark:bg-zinc-950/20 text-zinc-500 font-black text-xs flex items-center justify-center shrink-0 border border-black/10">
                                                {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            <span className="flex-1 truncate">{option}</span>
                                            {icon}
                                        </button>
                                    );
                                })}
                            </div>

                            {locked && (
                                <button
                                    onClick={nextQuestion}
                                    className="neobrutal-button mt-4 px-8 py-3.5 bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:opacity-95 text-white font-mouse-memoirs uppercase tracking-widest text-md flex items-center gap-2.5 border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer animate-fade-in"
                                >
                                    <span>
                                        {currentQuestionIdx + 1 === questions.length ? "Voir les résultats" : "Album Suivant"}
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
                <div className="space-y-6 game-card-anim relative z-10">
                    <div className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_#000000] relative overflow-hidden flex flex-col items-center text-center gap-5">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />

                        <ConfettiCanvas />

                        <div className="w-16 h-16 bg-amber-500 border-2.5 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000000] z-10 animate-bounce relative">
                            <Trophy className="text-black" size={28} />
                        </div>

                        <div className="z-10 space-y-1">
                            <span className="text-[10px] uppercase font-black text-fuchsia-600 dark:text-fuchsia-400 tracking-wider">Score Final</span>
                            <h2 className="font-mouse-memoirs text-6xl text-zinc-900 dark:text-white">
                                {score} <span className="text-2xl text-zinc-600 dark:text-zinc-500">points</span>
                            </h2>
                            <p className="text-zinc-655 dark:text-zinc-400 font-extrabold text-sm uppercase tracking-wide">
                                {correctAnswersCount} / {questions.length} albums trouvés
                            </p>
                            <p className={`text-sm font-bold mt-3 ${getScoreFeedback().color}`}>
                                {getScoreFeedback().text}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-3 z-10">
                            <button
                                onClick={startNewGame}
                                className="neobrutal-button flex-1 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mouse-memoirs uppercase tracking-widest text-sm border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} />
                                Rejouer
                            </button>
                            <button
                                onClick={onBackToHome}
                                className="neobrutal-button flex-1 py-3.5 bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 font-mouse-memoirs uppercase tracking-widest text-sm border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center justify-center"
                            >
                                Retour à l'accueil
                            </button>
                        </div>
                    </div>

                    {/* Summary list */}
                    <div className="neobrutal-card bg-zinc-100/50 dark:bg-zinc-950/40 border-2.5 border-zinc-250 dark:border-white/10 p-6 rounded-2xl space-y-4">
                        <h3 className="font-mouse-memoirs text-2xl uppercase tracking-widest text-zinc-900 dark:text-white border-b border-zinc-205 dark:border-white/10 pb-2">
                            Récapitulatif des Découvertes
                        </h3>

                        <div data-lenis-prevent className="space-y-3 max-h-96 overflow-y-auto no-scrollbar pr-1">
                            {answersHistory.map((hItem, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-inner">
                                    <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/15 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                                        <img src={hItem.albumCover} alt={hItem.correctAnswer} className="w-full h-full object-cover" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate uppercase tracking-wider">{hItem.correctAnswer}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-zinc-655 dark:text-zinc-400 truncate">
                                                Choix : <span className={hItem.correct ? "text-emerald-500 font-extrabold" : "text-red-500 font-extrabold"}>{hItem.userChoice}</span>
                                            </p>
                                            {hItem.correct && (
                                                <span className="text-[9px] font-black uppercase text-fuchsia-700 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/50 px-1.5 py-0.5 rounded border border-fuchsia-200 dark:border-fuchsia-500/20">
                                                    +{hItem.pointsGained} pts
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        {hItem.correct ? (
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

            {/* GSAP Transition Curtain */}
            <div
                ref={curtainRef}
                className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6 border-b-8 border-white/10 shadow-2xl"
                style={{ transform: 'translateY(-100vh)', willChange: 'transform' }}
            >
                <div className="w-24 h-24 rounded-full bg-white/5 border-4 border-white/10 flex items-center justify-center shadow-2xl">
                    <Disc size={52} className="text-white/55 animate-spin-slow" style={{ animationDuration: '2s' }} />
                </div>
                <p className="font-mouse-memoirs text-5xl text-white uppercase tracking-widest">Guess The Cover</p>
            </div>
        </div>
    );
}
