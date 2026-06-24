import { X, Target, Zap, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function GuessTheCoverPlaying({
    questions,
    currentQuestionIdx,
    selectedOption,
    locked,
    score,
    correctAnswersCount,
    timeLeft,
    imageReady,
    setImageReady,
    handleSelectOption,
    nextQuestion,
    quitGame
}) {
    const currentQ = questions[currentQuestionIdx];
    const currentBlur = locked ? 0 : Math.max(0, (timeLeft / 15) * 45);

    return (
        <div className="fixed inset-0 z-40 bg-zinc-50 dark:bg-zinc-950 bg-grid-pattern flex flex-col justify-start md:justify-center items-center overflow-y-auto pt-24 pb-12 md:py-8 game-card-anim game-screen-fixed-container">
            {/* Quit button */}
            <button
                onClick={quitGame}
                className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-red-600 dark:hover:bg-red-600 text-zinc-800 dark:text-white hover:text-white-always font-mouse-memoirs uppercase tracking-widest text-xs border-2 border-zinc-300 dark:border-white/20 hover:border-red-500 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,0.15)] dark:shadow-[3px_3px_0px_rgba(0,0,0,0.5)] hover:shadow-[3px_3px_0px_#dc2626] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-200 cursor-pointer group"
            >
                <X size={14} className="group-hover:rotate-90 transition-transform duration-200" />
                Quitter
            </button>

            <div className="w-full max-w-2xl px-4 space-y-6">
                {/* Header Progress / Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="font-mouse-memoirs text-2xl uppercase tracking-widest text-zinc-655 dark:text-zinc-400 text-center sm:text-left">
                        Album <span className="text-zinc-900 dark:text-white font-black text-3xl">{currentQuestionIdx + 1}</span> / {questions.length}
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        {/* Correct Count */}
                        <div className="flex items-center gap-1.5 text-zinc-655 dark:text-zinc-400 text-xs font-semibold">
                            <Target size={14} className="text-zinc-500" />
                            <span>{correctAnswersCount} / {questions.length} correct</span>
                        </div>
                        {/* Score */}
                        <div className="neobrutal-card border-2 border-black bg-fuchsia-600 text-white-always px-3.5 py-1 font-black text-sm shadow-[2px_2px_0px_#000000] flex items-center gap-1">
                            <Zap size={12} className="fill-white" />
                            {score} pts
                        </div>
                    </div>
                </div>

                {/* Main gameplay card */}
                <div className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-5 sm:p-6 md:p-8 rounded-3xl shadow-[8px_8px_0px_#000000] flex flex-col items-center gap-6 relative overflow-hidden">
                    {/* Timer Progress Bar */}
                    <div 
                        className="absolute top-0 left-0 h-2 bg-fuchsia-600 bg-gradient-to-r from-fuchsia-600 to-pink-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / 15) * 100}%` }}
                    />

                    {/* Floating dynamic points multiplier indicator */}
                    {!locked && (
                        <div className="absolute top-5 right-5 text-right flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-fuchsia-600 dark:text-fuchsia-400 tracking-wider">Points à gagner</span>
                            <span className="font-mouse-memoirs text-2xl text-zinc-900 dark:text-white font-extrabold flex items-center gap-1">
                                +{Math.max(10, Math.round((timeLeft / 15) * 100))}
                            </span>
                        </div>
                    )}

                    {/* Cover Container */}
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-zinc-100 dark:bg-zinc-950 border-4 border-black rounded-2xl shadow-[6px_6px_0px_#000000] overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img 
                            src={currentQ.albumCover} 
                            onLoad={() => setImageReady(true)}
                            alt="Mysterious Album Cover" 
                            className="w-full h-full object-cover transition-all duration-355 transform-gpu select-none pointer-events-none"
                            style={{
                                filter: `blur(${!imageReady ? 45 : currentBlur}px)`,
                                transform: locked ? 'scale(1)' : 'scale(1.04)'
                            }}
                        />
                    </div>

                    {/* Timer Countdown */}
                    <div className={`w-14 h-14 rounded-full border-3 border-black font-mouse-memoirs text-2xl flex items-center justify-center shadow-[3px_3px_0px_#000000] select-none ${
                        timeLeft <= 4 ? 'bg-red-500 text-white-always animate-bounce' : 'bg-white dark:bg-zinc-800 text-black dark:text-white'
                    }`}>
                        {timeLeft}s
                    </div>

                    {/* QCM Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                        {currentQ.options.map((option, oIdx) => {
                            const isCorrectAnswer = option === currentQ.correctAnswer;
                            const isSelected = option === selectedOption;

                            let btnClass = "bg-white dark:bg-zinc-800 text-black dark:text-white hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000000] dark:hover:shadow-[6px_6px_0px_#000000]";
                            let icon = null;

                            if (locked) {
                                if (isCorrectAnswer) {
                                    btnClass = "bg-emerald-500 text-white-always border-emerald-600 shadow-[2px_2px_0px_#000000] scale-100";
                                    icon = <CheckCircle2 size={16} className="text-white-always shrink-0" />;
                                } else if (isSelected) {
                                    btnClass = "bg-red-500 text-white-always border-red-600 shadow-[2px_2px_0px_#000000] scale-100";
                                    icon = <XCircle size={16} className="text-white-always shrink-0" />;
                                } else {
                                    btnClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-300 dark:border-zinc-950 opacity-45 shadow-none pointer-events-none";
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

                    {/* Next Question CTA */}
                    {locked && (
                        <button
                            onClick={nextQuestion}
                            className="neobrutal-button mt-4 px-8 py-3.5 bg-fuchsia-600 bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:opacity-95 text-white-always font-mouse-memoirs uppercase tracking-widest text-md flex items-center gap-2.5 border-3 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer animate-fade-in"
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
    );
}
