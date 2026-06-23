import { Music, Trophy, HelpCircle, ArrowRight, Disc } from 'lucide-react';

export default function ArcadeHubTab({ user, onSelectGame }) {
    return (
        <div className="max-w-4xl mx-auto w-full px-4 py-8 font-sans relative">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-10 relative z-10">
                <div className="inline-flex p-3 bg-violet-600/10 border-2 border-violet-500/20 rounded-2xl mb-4 animate-pulse">
                    <Trophy className="text-violet-500 dark:text-violet-400" size={32} />
                </div>
                <h1 className="font-mouse-memoirs text-5xl md:text-6xl leading-none uppercase tracking-wider text-zinc-900 dark:text-white">
                    L'Arcade Musicale
                </h1>
                <p className="text-zinc-650 dark:text-zinc-400 mt-2 text-sm md:text-base font-medium tracking-wide max-w-md mx-auto">
                    Défiez vos connaissances musicales et prouvez votre dévouement à votre artiste favori.
                </p>

                {user?.favArtistName && (
                    <div className="inline-flex items-center gap-3 bg-zinc-100 dark:bg-black/30 border border-zinc-200 dark:border-white/5 px-4 py-2 rounded-full mt-5">
                        {user.favArtistImage ? (
                            <img src={user.favArtistImage} alt={user.favArtistName} className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-white/10" />
                        ) : (
                            <Music size={12} className="text-violet-500 dark:text-violet-400" />
                        )}
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Artiste cible : <span className="text-violet-600 dark:text-violet-400 font-extrabold uppercase">{user.favArtistName}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mt-4">
                {/* Game Card 1: Blind Test */}
                <div 
                    onClick={() => onSelectGame('blindtest')}
                    className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_#000000] hover:shadow-[12px_12px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_#000000] transition-all cursor-pointer flex flex-col justify-between h-96 group relative overflow-hidden"
                >
                    {/* Visual decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-[40px] pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                    
                    <div>
                        <div className="w-14 h-14 bg-violet-600 border-2.5 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000000] text-white mb-6 group-hover:rotate-12 transition-transform duration-300">
                            <Music size={24} />
                        </div>
                        <h2 className="font-mouse-memoirs text-3xl md:text-4xl text-zinc-900 dark:text-white uppercase tracking-wider mb-2.5">
                            Blind Test Classique
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-xs md:text-sm leading-relaxed font-medium">
                            Écoutez de courts extraits sonores de l'artiste et devinez le titre de la chanson parmi 4 options. Soyez rapide !
                        </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950 text-violet-750 dark:text-violet-300 border border-violet-350 dark:border-violet-500/30 px-2 py-0.5 rounded-md">
                                Audio
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                                10 Questions
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-white text-black border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#000000] group-hover:translate-x-1.5 transition-transform duration-300">
                            <ArrowRight size={18} />
                        </div>
                    </div>
                </div>

                {/* Game Card 2: Guess the Cover */}
                <div 
                    onClick={() => onSelectGame('guessthecover')}
                    className="neobrutal-card bg-white dark:bg-zinc-900 border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_#000000] hover:shadow-[12px_12px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_#000000] transition-all cursor-pointer flex flex-col justify-between h-96 group relative overflow-hidden"
                >
                    {/* Visual decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-600/10 rounded-full blur-[40px] pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                    
                    <div>
                        <div className="w-14 h-14 bg-fuchsia-600 border-2.5 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000000] text-white mb-6 group-hover:rotate-12 transition-transform duration-300">
                            <Disc size={24} />
                        </div>
                        <h2 className="font-mouse-memoirs text-3xl md:text-4xl text-zinc-900 dark:text-white uppercase tracking-wider mb-2.5">
                            Devine la Pochette
                        </h2>
                        <p className="text-zinc-650 dark:text-zinc-400 text-xs md:text-sm leading-relaxed font-medium">
                            Une pochette d'album mystère se dévoile progressivement. Plus l'image est floue au moment de votre réponse, plus vous remportez de points !
                        </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-750 dark:text-fuchsia-300 border border-fuchsia-350 dark:border-fuchsia-500/30 px-2 py-0.5 rounded-md">
                                Visuel
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                                Flou
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-white text-black border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#000000] group-hover:translate-x-1.5 transition-transform duration-300">
                            <ArrowRight size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Warning */}
            {!user?.favArtistName && (
                <div className="mt-8 neobrutal-card border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-200 p-5 rounded-2xl flex items-start gap-4 z-10 max-w-xl mx-auto">
                    <HelpCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div className="space-y-1">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Aucun artiste favori configuré</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                            Pour jouer, vous devez choisir un artiste favori sur votre profil. Cela servira à alimenter les morceaux des différents jeux !
                        </p>
                        <button
                            onClick={() => window.location.href = '/profile'}
                            className="mt-2 text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline uppercase tracking-widest cursor-pointer"
                        >
                            Configurer mon artiste favori
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
