import { RotateCcw, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import ConfettiCanvas from './ConfettiCanvas';

export default function GuessTheCoverResults({
    score,
    questions,
    correctAnswersCount,
    answersHistory,
    startNewGame,
    onBackToHome,
    getScoreFeedback
}) {
    return (
        <div className="space-y-6 game-card-anim relative z-10">
            {/* Score Card */}
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
                        {score} <span className="text-2xl text-zinc-650 dark:text-zinc-500">points</span>
                    </h2>
                    <p className="text-zinc-650 dark:text-zinc-400 font-extrabold text-sm uppercase tracking-wide">
                        {correctAnswersCount} / {questions.length} albums trouvés
                    </p>
                    <p className={`text-sm font-bold mt-3 ${getScoreFeedback().color}`}>
                        {getScoreFeedback().text}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-3 z-10">
                    <button
                        onClick={startNewGame}
                        className="neobrutal-button flex-1 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white-always font-mouse-memoirs uppercase tracking-widest text-sm border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer flex items-center justify-center gap-2"
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
            <div className="neobrutal-card bg-zinc-100/50 dark:bg-zinc-950/40 border-2.5 border-zinc-300 dark:border-white/10 p-6 rounded-2xl space-y-4">
                <h3 className="font-mouse-memoirs text-2xl uppercase tracking-widest text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/10 pb-2">
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
                                    <p className="text-[10px] text-zinc-650 dark:text-zinc-400 truncate">
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
    );
}
