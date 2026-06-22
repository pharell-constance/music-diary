import API_URL from '../../config.js';
import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Trophy, CheckCircle2, XCircle, ArrowRight, Music, AlertTriangle, Disc, Timer, Target } from 'lucide-react';

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

    // Initial check for favorite artist presence
    useEffect(() => {
        if (!user?.favArtistId) {
            setError("Veuillez d'abord choisir un artiste favori dans votre profil pour jouer !");
        }
        
        return () => {
            stopAudioAndTimer();
        };
    }, [user]);

    const stopAudioAndTimer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const startNewGame = async () => {
        setError(null);
        setGameState('LOADING');
        setScore(0);
        setCurrentQuestionIdx(0);
        setAnswersHistory([]);
        setSelectedOption(null);
        setLocked(false);
        stopAudioAndTimer();

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/game/blindtest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de la récupération des morceaux.");
            }
            if (!data.questions || data.questions.length === 0) {
                throw new Error("Aucun extrait audio disponible pour cet artiste.");
            }
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
        <div className="max-w-4xl mx-auto w-full px-4 py-6 font-sans">
            {/* Audio Element */}
            <audio ref={audioRef} preload="auto" />

            {/* ERROR CARD */}
            {error && (
                <div className="neobrutal-card border-red-500 bg-red-500/10 text-white p-6 rounded-2xl flex flex-col items-center gap-4 text-center mb-6">
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
                <div className="neobrutal-card bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_#000000] relative overflow-hidden flex flex-col items-center text-center gap-6">
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
            )}

            {/* LOADING SCREEN */}
            {gameState === 'LOADING' && (
                <div className="neobrutal-card bg-zinc-900 border-4 border-black p-12 rounded-3xl shadow-[8px_8px_0px_#000000] flex flex-col items-center justify-center text-center gap-6">
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

            {/* PLAYING SCREEN */}
            {gameState === 'PLAYING' && questions.length > 0 && (
                <div className="space-y-6">
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
                            {/* Spinning Disc vinyl */}
                            <div className={`w-28 h-28 rounded-full bg-zinc-950 border-3 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center relative ${!locked ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '6s' }}>
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
            )}

            {/* RESULTS SCREEN */}
            {gameState === 'RESULTS' && (
                <div className="space-y-6">
                    {/* Score Card */}
                    <div className="neobrutal-card bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_#000000] relative overflow-hidden flex flex-col items-center text-center gap-5">
                        {/* Background sparkles */}
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />

                        <div className="w-16 h-16 bg-amber-500 border-2.5 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000000] z-10 animate-bounce">
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
        </div>
    );
}
