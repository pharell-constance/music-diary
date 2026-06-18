import { useNavigate } from 'react-router-dom';
import { Disc, Sparkles, Quote, Radio, Users, Star, Heart, ArrowRight } from 'lucide-react';

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#07050f] text-white font-sans overflow-x-hidden relative flex flex-col justify-between select-none">
            {/* Background glowing blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/5 rounded-full blur-[130px] pointer-events-none"></div>

            {/* Header */}
            <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-50 relative">
                <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all duration-300">
                        <Disc className="text-white stroke-[2.5] animate-spin-slow" size={20} />
                    </div>
                    <span className="font-modak text-2xl md:text-3xl text-violet-500 text-stroke-dark tracking-wide uppercase hover:scale-105 transition duration-300">
                        Music Diary
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/login')} 
                        className="text-sm font-black uppercase tracking-wider text-zinc-400 hover:text-white transition duration-200 cursor-pointer font-mouse-memoirs text-lg"
                    >
                        Connexion
                    </button>
                    <button 
                        onClick={() => navigate('/register')} 
                        className="neobrutal-btn px-5 py-2 rounded-full bg-violet-600 text-white text-sm font-black font-mouse-memoirs uppercase tracking-widest hover:bg-violet-500"
                    >
                        Créer un compte
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full space-y-16">
                
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20">
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        {/* Sticker badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-white rounded-full bg-violet-500/10 text-white text-xs font-mouse-memoirs uppercase tracking-widest rotate-[-3deg] shadow-[3px_3px_0px_rgba(255,255,255,0.15)]">
                            <Sparkles size={12} className="text-violet-400 animate-pulse" /> Votre vie en musique
                        </div>
                        
                        {/* Outlined bubbly title */}
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-mouse-memoirs uppercase tracking-wide leading-[0.85] text-white text-stroke-dark">
                            Le journal de bord<br/>
                            de votre <span className="font-modak text-violet-500 text-stroke-dark text-6xl sm:text-7xl md:text-9xl rotate-[2deg] inline-block hover:scale-105 hover:text-fuchsia-500 transition-all duration-300">voyage musical</span>.
                        </h1>

                        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium pt-2">
                            Notez vos albums favoris, créez votre mur de paroles personnalisées, connectez votre compte Spotify pour générer vos statistiques personnelles et suivez l'actualité musicale de vos amis.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto px-8 py-4 neobrutal-btn rounded-full bg-violet-600 text-white font-modak uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#fff] text-lg hover:bg-violet-500"
                            >
                                Commencer <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full sm:w-auto px-8 py-4 neobrutal-btn rounded-full bg-transparent border-2 border-white text-white font-mouse-memoirs uppercase tracking-widest text-lg hover:bg-white/[0.05]"
                            >
                                Découvrir le site
                            </button>
                        </div>
                    </div>

                    {/* Floating Neobrutalist Collage Visual Mockups */}
                    <div className="lg:col-span-5 relative h-[400px] flex items-center justify-center">
                        <div className="absolute w-72 h-72 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                        {/* Card 1: Review Card Mockup */}
                        <div className="absolute top-6 left-4 md:left-10 w-[280px] sm:w-[320px] neobrutal-card p-5 transform -rotate-3 hover:-rotate-1 duration-300">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden shadow-md border border-zinc-800/60 flex-shrink-0 relative">
                                    <img src="https://i.scdn.co/image/ab67616d0000b2739b9b36b0e22870b9f542d937" alt="Random Access Memories" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-extrabold text-sm text-white truncate leading-snug">Random Access Memories</div>
                                    <div className="text-xs text-zinc-400 truncate mt-0.5">Daft Punk</div>
                                    <div className="flex gap-0.5 mt-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={11} className="fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-400 text-[11px] mt-4 leading-relaxed italic">
                                "Un chef-d'œuvre intemporel. Les collaborations avec Pharrell Williams et Giorgio Moroder sont légendaires."
                            </p>
                            <div className="flex justify-between items-center mt-4 border-t border-white/[0.06] pt-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center font-bold text-[10px] text-violet-400">PC</div>
                                    <span className="text-[10px] font-bold text-zinc-300 font-mouse-memoirs tracking-wide">PHARRELL</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold">
                                    <Heart size={10} className="fill-rose-500/25 text-rose-500" /> 24 likes
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Lyric Pin Mockup */}
                        <div className="absolute bottom-6 right-4 md:right-10 w-[240px] bg-gradient-to-tr from-violet-600/90 to-fuchsia-500/85 p-5 rounded-2xl transform rotate-6 hover:rotate-3 transition-all duration-300 border-2 border-white shadow-[4px_4px_0px_rgba(255,255,255,0.15)] text-white">
                            <Quote size={20} className="text-white/40 mb-2.5" />
                            <p className="font-black text-sm leading-snug tracking-tight">
                                "We've come too far to give up who we are. So let's raise the bar..."
                            </p>
                            <div className="mt-4 border-t border-white/10 pt-2.5 flex items-center justify-between text-[10px] font-bold text-white/70">
                                <span>Get Lucky</span>
                                <span className="text-white/50">Daft Punk</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SVG Liquid Divider 1 (Cosmic -> Charcoal) */}
                <div className="w-full overflow-hidden leading-[0] z-20 pointer-events-none relative -mb-1">
                    <svg className="block w-full h-[100px] md:h-[150px]" viewBox="0 0 1536 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M1536,0 H-1 V65 S184.32,15 460.8,75 S860.16,50 1121.28,66 S1413.12,50 1536,50 Z" fill="#121214"></path>
                    </svg>
                </div>

                {/* Features Section wrapped in a Charcoal dark container */}
                <div className="bg-[#121214] py-16 md:py-24 relative z-10">
                    <section className="max-w-7xl mx-auto px-6 space-y-16">
                        <div className="text-center space-y-4">
                            <p className="font-modak text-stroke-dark text-fuchsia-500 text-2xl uppercase tracking-wider rotate-[-2deg] inline-block">FONCTIONNALITÉS</p>
                            <h2 className="text-4xl sm:text-6xl font-mouse-memoirs uppercase text-white tracking-wider text-stroke-dark leading-none">Tout ce dont vous avez besoin.</h2>
                            <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto font-semibold">
                                Une suite d'outils conçus pour analyser, documenter et partager votre passion musicale.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            
                            {/* Feature 1 */}
                            <div className="neobrutal-card p-6 flex flex-col hover:-translate-y-2 hover:rotate-[-1deg]">
                                <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20 group-hover:scale-105 transition-transform duration-300">
                                    <Disc size={22} className="animate-spin-slow" />
                                </div>
                                <h3 className="font-modak text-stroke-dark text-white text-lg mb-2">Journal de Bord</h3>
                                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                                    Rédigez des chroniques détaillées de vos albums favoris, attribuez-leur des notes étoilées et conservez une trace organisée de votre historique d'écoute.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="neobrutal-card p-6 flex flex-col hover:-translate-y-2 hover:rotate-[1deg]">
                                <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20 group-hover:scale-105 transition-transform duration-300">
                                    <Radio size={22} />
                                </div>
                                <h3 className="font-modak text-stroke-dark text-white text-lg mb-2">Intégration Spotify</h3>
                                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                                    Connectez votre compte Spotify. Le site génère automatiquement vos tops artistes, tops sons, tops albums, genres préférés ainsi que vos analyses personnalisées.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="neobrutal-card p-6 flex flex-col hover:-translate-y-2 hover:rotate-[-1deg]">
                                <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20 group-hover:scale-105 transition-transform duration-300">
                                    <Quote size={22} />
                                </div>
                                <h3 className="font-modak text-stroke-dark text-white text-lg mb-2">Mur de Paroles</h3>
                                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                                    Créez un mur de "Lyric Pins" colorés. Saisissez vos paroles préférées, recherchez la chanson correspondante sur Spotify et épinglez vos cartes sur votre mur de profil.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="neobrutal-card p-6 flex flex-col hover:-translate-y-2 hover:rotate-[1deg]">
                                <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20 group-hover:scale-105 transition-transform duration-300">
                                    <Users size={22} />
                                </div>
                                <h3 className="font-modak text-stroke-dark text-white text-lg mb-2">Fil d'Activité</h3>
                                <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                                    Suivez vos amis et les membres de la communauté. Découvrez leurs dernières écoutes en direct, commentez leurs chroniques et échangez sur vos coups de cœur musicaux.
                                </p>
                            </div>

                        </div>
                    </section>
                </div>

                {/* SVG Liquid Divider 2 (Charcoal -> Cosmic) */}
                <div className="w-full overflow-hidden leading-[0] z-20 pointer-events-none relative -mt-1">
                    <svg className="block w-full h-[100px] md:h-[150px] rotate-180" viewBox="0 0 1536 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M1536,0 H-1 V65 S184.32,15 460.8,75 S860.16,50 1121.28,66 S1413.12,50 1536,50 Z" fill="#121214"></path>
                    </svg>
                </div>

                {/* Call-to-action Section */}
                <div className="max-w-7xl mx-auto px-6 py-12 relative z-30">
                    <section className="neobrutal-card p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden bg-[#0e0e11] border-2 border-white shadow-[6px_6px_0px_#fff]">
                        {/* Glowing effect inside */}
                        <div className="absolute top-[-50%] right-[-20%] w-96 h-96 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="space-y-4 max-w-2xl relative z-10 text-center md:text-left">
                            <h2 className="text-4xl sm:text-5xl font-mouse-memoirs uppercase tracking-wider text-white text-stroke-dark leading-none">
                                Prêt à documenter votre voyage musical ?
                            </h2>
                            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                                Rejoignez la communauté de passionnés, découvrez vos statistiques cachées et partagez vos émotions musicales avec vos amis dès maintenant.
                            </p>
                        </div>

                        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto">
                            <button
                                onClick={() => navigate('/register')}
                                className="neobrutal-btn px-6 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-modak uppercase tracking-wider text-sm shadow-[4px_4px_0px_#fff] hover:shadow-[5px_5px_0px_#fff] w-full sm:w-auto"
                            >
                                Créer un compte
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="neobrutal-btn px-6 py-3.5 rounded-full border-2 border-white bg-transparent text-white font-mouse-memoirs uppercase tracking-widest text-sm w-full sm:w-auto hover:bg-white/[0.05]"
                            >
                                Se connecter
                            </button>
                        </div>
                    </section>
                </div>

            </main>

            {/* Footer */}
            <footer className="w-full border-t border-white/[0.04] py-8 text-center text-xs text-zinc-600 z-10 mt-12 bg-black/40">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-md flex items-center justify-center shadow-md">
                            <Disc className="text-white" size={12} />
                        </div>
                        <span className="font-modak text-zinc-400 tracking-wider uppercase text-sm group-hover:text-violet-400 transition-colors">Music Diary &copy; {new Date().getFullYear()}</span>
                    </div>
                    <p className="text-zinc-500 font-medium">
                        Développé avec amour pour les passionnés de musique. Tous droits réservés.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
