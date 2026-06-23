import { useEffect, useRef } from 'react';
import { Disc } from 'lucide-react';
import gsap from 'gsap';
import useBlindTest from '../../hooks/useBlindTest';
import BlindTestLobby from './BlindTestLobby';
import BlindTestPlaying from './BlindTestPlaying';
import BlindTestResults from './BlindTestResults';

export default function BlindTestTab({ user, onBackToHome }) {
    const {
        gameState, setGameState,
        artist,
        questions,
        currentQuestionIdx,
        selectedOption,
        locked, setLocked,
        score, setScore,
        timeLeft,
        answersHistory,
        error, setError,
        audioRef,
        stopAudioAndTimer,
        fetchAndStartGame,
        handleSelectOption,
        nextQuestion
    } = useBlindTest(user);

    const gameContainerRef = useRef(null);
    const curtainRef = useRef(null);
    const curtainTriggered = useRef(false);

    // Lift curtain up once PLAYING/LOBBY/RESULTS is reached (after a drop was triggered)
    useEffect(() => {
        if (!curtainRef.current) return;
        if (!curtainTriggered.current) return;
        if (gameState === 'PLAYING' || gameState === 'LOBBY' || gameState === 'RESULTS') {
            gsap.to(curtainRef.current, {
                y: '-100vh',
                duration: 0.65,
                ease: 'power3.inOut',
                delay: gameState === 'PLAYING' ? 0.1 : 0,
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
                stopAudioAndTimer();
                fetchAndStartGame();
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
                stopAudioAndTimer();
                setGameState('LOBBY');
                setScore(0);
                setLocked(false);
            }
        });
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
            <audio ref={audioRef} preload="auto" />

            {gameState === 'LOBBY' && (
                <BlindTestLobby user={user} startNewGame={startNewGame} />
            )}

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

            {gameState === 'PLAYING' && questions.length > 0 && (
                <BlindTestPlaying
                    artist={artist}
                    questions={questions}
                    currentQuestionIdx={currentQuestionIdx}
                    selectedOption={selectedOption}
                    locked={locked}
                    score={score}
                    timeLeft={timeLeft}
                    handleSelectOption={handleSelectOption}
                    nextQuestion={nextQuestion}
                    quitGame={quitGame}
                />
            )}

            {gameState === 'RESULTS' && (
                <BlindTestResults
                    score={score}
                    questions={questions}
                    answersHistory={answersHistory}
                    startNewGame={startNewGame}
                    onBackToHome={onBackToHome}
                    getScoreFeedback={getScoreFeedback}
                />
            )}

            {/* GSAP Stage Curtain */}
            <div
                ref={curtainRef}
                className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6 border-b-8 border-white/10 shadow-2xl"
                style={{ transform: 'translateY(-100vh)', willChange: 'transform' }}
            >
                <div className="w-24 h-24 rounded-full bg-white/5 border-4 border-white/10 flex items-center justify-center shadow-2xl">
                    <Disc size={52} className="text-white/50 animate-spin-slow" style={{ animationDuration: '2s' }} />
                </div>
                <p className="font-mouse-memoirs text-5xl text-white uppercase tracking-widest">Blind Test</p>
            </div>
        </div>
    );
}
