import { Trophy, Music, Timer, Target } from 'lucide-react';

export default function BlindTestLobby({ user, startNewGame }) {
    return (
        <div className="relative">
            {/* Decorative floating side elements (visible on large viewports) */}
            <div className="hidden lg:flex absolute -left-28 top-12 w-24 h-24 bg-[#facc15] border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000000] p-4 flex-col items-center justify-center float-accent-left rotate-[-8deg] z-0 select-none">
                <Music size={32} className="text-black animate-spin-slow" style={{ animationDuration: '6s' }} />
                <span className="font-mouse-memoirs text-xs text-black uppercase tracking-wider mt-1.5 font-black">PLAY</span>
            </div>

            <div className="hidden lg:flex absolute -right-28 top-28 w-24 h-24 bg-[#ec4899] border-3 border-black rounded-2xl shadow-[4px_4px_0px_#000000] p-4 flex-col items-center justify-center float-accent-right rotate-[12deg] z-0 select-none">
                <Music size={32} className="text-white-always animate-bounce" style={{ animationDuration: '1.2s' }} />
                <span className="font-mouse-memoirs text-xs text-white-always uppercase tracking-wider mt-1.5 font-black">BEAT</span>
            </div>

            <div className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_#000000] relative overflow-hidden flex flex-col items-center text-center gap-6 game-card-anim z-10">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-[80px] pointer-events-none" />

                <div className="w-20 h-20 bg-violet-600 border-2.5 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff] z-10 animate-pulse">
                    <Trophy className="text-white-always" size={36} />
                </div>

                <div className="z-10">
                    <h2 className="font-mouse-memoirs text-[52px] leading-none uppercase tracking-wider text-zinc-900 dark:text-white">
                        Blind Test de l'Artiste n°1
                    </h2>
                    <p className="text-zinc-650 dark:text-zinc-400 mt-2 text-sm font-medium tracking-wide">
                        Prouvez votre amour pour votre artiste préféré de Music Diary
                    </p>
                </div>

                {user?.favArtistName && (
                    <div className="neobrutal-card bg-zinc-100 dark:bg-[#12101b] border-2.5 border-zinc-200 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 w-full max-w-md z-10">
                        <div className="w-16 h-16 rounded-xl bg-zinc-300 dark:bg-zinc-800 border-2 border-zinc-400 dark:border-white/20 overflow-hidden flex-shrink-0 shadow-md">
                            {user.favArtistImage ? (
                                <img src={user.favArtistImage} alt={user.favArtistName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500"><Music size={24} /></div>
                            )}
                        </div>
                        <div className="text-left">
                            <span className="text-[10px] uppercase font-black text-violet-600 dark:text-violet-400 tracking-wider">Artiste sélectionné</span>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider mt-0.5">{user.favArtistName}</h3>
                        </div>
                    </div>
                )}

                <div className="text-zinc-650 dark:text-zinc-400 text-xs font-semibold space-y-2.5 max-w-sm z-10 bg-zinc-50 dark:bg-black/20 p-4 rounded-xl border border-zinc-200 dark:border-white/5 text-left w-full">
                    <div className="flex items-center gap-2.5">
                        <Timer size={14} className="text-violet-500 dark:text-violet-400 shrink-0" />
                        <span>15 secondes d'écoute par morceau</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Target size={14} className="text-violet-500 dark:text-violet-400 shrink-0" />
                        <span>10 questions à choix multiples</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Music size={14} className="text-violet-500 dark:text-violet-400 shrink-0" />
                        <span>Des extraits aléatoires de sa discographie</span>
                    </div>
                </div>

                <button
                    onClick={startNewGame}
                    className="neobrutal-button px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white-always font-mouse-memoirs uppercase tracking-widest text-lg shadow-[6px_6px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0px_#000000] transition-all cursor-pointer z-10"
                >
                    DÉMARRER LA PARTIE
                </button>
            </div>
        </div>
    );
}
