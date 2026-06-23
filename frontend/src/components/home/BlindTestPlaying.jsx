import { X, Music, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function BlindTestPlaying({
    artist,
    questions,
    currentQuestionIdx,
    selectedOption,
    locked,
    score,
    timeLeft,
    handleSelectOption,
    nextQuestion,
    quitGame
}) {
    const currentQ = questions[currentQuestionIdx];

    return (
        <div className="fixed inset-0 z-40 bg-zinc-50 dark:bg-zinc-950 bg-grid-pattern flex flex-col justify-center items-center overflow-y-auto py-8 game-card-anim">
            {/* Quit button */}
            <button
                onClick={quitGame}
                className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-red-650 dark:hover:bg-red-650 text-zinc-800 dark:text-white font-mouse-memoirs uppercase tracking-widest text-xs border-2 border-zinc-250 dark:border-white/20 hover:border-red-500 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,0.15)] dark:shadow-[3px_3px_0px_rgba(0,0,0,0.5)] hover:shadow-[3px_3px_0px_#dc2626] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 cursor-pointer group"
            >
                <X size={14} className="group-hover:rotate-90 transition-transform duration-200" />
                Quitter
            </button>

            <div className="w-full max-w-2xl px-4 space-y-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="font-mouse-memoirs text-2xl uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                        Question <span className="text-zinc-900 dark:text-white font-black text-3xl">{currentQuestionIdx + 1}</span> / {questions.length}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs uppercase font-black tracking-widest text-zinc-500">Score</span>
                        <div className="neobrutal-card border-2 border-black bg-violet-600 text-white px-3 py-1 font-black text-sm shadow-[2px_2px_0px_#000000]">
                            {score} pts
                        </div>
                    </div>
                </div>

                {/* Main playing card */}
                <div className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-6 md:p-8 rounded-3xl shadow-[8px_8px_0px_#000000] flex flex-col items-center gap-6 relative overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / 15) * 100}%` }}
                    />

                    <div className="flex flex-col items-center gap-4 mt-2">
                        <div className="relative flex items-center justify-center w-56 h-36 border-2 border-black/10 bg-black/10 rounded-2xl p-4">
                            <div className="relative z-10">
                                <div className={`w-28 h-28 rounded-full bg-zinc-950 border-3 border-black ring-4 ring-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2),4px_4px_0px_#000000] flex items-center justify-center relative ${!locked ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '6s' }}>
                                    <div className="absolute inset-2.5 rounded-full border border-white/5" />
                                    <div className="absolute inset-5 rounded-full border border-white/5" />
                                    <div className="absolute inset-8 rounded-full border border-white/10" />

                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-black/80 flex-shrink-0 relative bg-zinc-900">
                                        {artist?.image ? (
                                            <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Music className="text-zinc-650 w-full h-full p-2" />
                                        )}
                                    </div>
                                    <div className="absolute w-1.5 h-1.5 bg-black rounded-full center" />
                                </div>
                            </div>

                            {/* Mechanical Tone Arm */}
                            <div 
                                className="absolute right-4 top-4 w-16 h-20 origin-top-right transition-transform duration-700 ease-out z-20 pointer-events-none"
                                style={{ transform: !locked ? 'rotate(24deg)' : 'rotate(0deg)' }}
                            >
                                <div className="absolute right-0 top-0 w-6 h-6 bg-zinc-800 border-2.5 border-black rounded-full shadow-[2px_2px_0px_#000000] flex items-center justify-center">
                                    <div className="w-2 h-2 bg-zinc-500 rounded-full border border-black" />
                                </div>
                                <div className="absolute right-2 top-2 w-1.5 h-14 bg-zinc-400 border-x border-b border-black origin-top shadow-[1px_1px_0px_rgba(0,0,0,0.5)]" />
                                <div className="absolute right-[5px] top-[54px] w-3 h-5 bg-[#ec4899] border-2 border-black rounded-sm shadow-[1.5px_1.5px_0px_#000000] flex flex-col items-center justify-end">
                                    <div className="w-1 h-1.5 bg-zinc-300 border-x border-black" />
                                </div>
                            </div>
                        </div>

                        {/* Audio wave bars */}
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
                                <span className="w-1 bg-zinc-500 dark:bg-zinc-650 rounded-full h-1" />
                                <span className="w-1 bg-zinc-500 dark:bg-zinc-650 rounded-full h-1" />
                                <span className="w-1 bg-zinc-500 dark:bg-zinc-650 rounded-full h-1" />
                                <span className="w-1 bg-zinc-500 dark:bg-zinc-650 rounded-full h-1" />
                                <span className="w-1 bg-zinc-500 dark:bg-zinc-650 rounded-full h-1" />
                            </div>
                        )}
                    </div>

                    <div className={`w-14 h-14 rounded-full border-3 border-black font-mouse-memoirs text-2xl flex items-center justify-center shadow-[3px_3px_0px_#000000] select-none ${
                        timeLeft <= 5 ? 'bg-red-500 text-white animate-bounce' : 'bg-white dark:bg-zinc-800 text-black dark:text-white'
                    }`}>
                        {timeLeft}s
                    </div>

                    {/* Options Buttons Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                        {currentQ.options.map((option, oIdx) => {
                            const isCorrectAnswer = option === currentQ.correctAnswer;
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
                                    btnClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-950 opacity-45 shadow-none pointer-events-none";
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
    );
}
