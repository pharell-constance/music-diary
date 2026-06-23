import { useEffect, useRef } from 'react';
import { Disc } from 'lucide-react';
import gsap from 'gsap';
import useGuessTheCover from '../../hooks/useGuessTheCover';
import GuessTheCoverLobby from './GuessTheCoverLobby';
import GuessTheCoverPlaying from './GuessTheCoverPlaying';
import GuessTheCoverResults from './GuessTheCoverResults';

export default function GuessTheCoverTab({ user, onBackToHome }) {
    const {
        gameState, setGameState,
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

    const curtainRef = useRef(null);
    const curtainTriggered = useRef(false);

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

    return (
        <div className="max-w-4xl mx-auto w-full px-4 py-6 font-sans relative select-none">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-[-1]" />

            {gameState === 'LOBBY' && (
                <GuessTheCoverLobby user={user} startNewGame={startNewGame} />
            )}

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

            {gameState === 'PLAYING' && questions.length > 0 && (
                <GuessTheCoverPlaying
                    questions={questions}
                    currentQuestionIdx={currentQuestionIdx}
                    selectedOption={selectedOption}
                    locked={locked}
                    score={score}
                    correctAnswersCount={correctAnswersCount}
                    timeLeft={timeLeft}
                    imageReady={imageReady}
                    setImageReady={setImageReady}
                    handleSelectOption={handleSelectOption}
                    nextQuestion={nextQuestion}
                    quitGame={quitGame}
                />
            )}

            {gameState === 'RESULTS' && (
                <GuessTheCoverResults
                    score={score}
                    questions={questions}
                    correctAnswersCount={correctAnswersCount}
                    answersHistory={answersHistory}
                    startNewGame={startNewGame}
                    onBackToHome={onBackToHome}
                    getScoreFeedback={getScoreFeedback}
                />
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
