import { useNavigate } from 'react-router-dom';
import { Disc, Sparkles, Quote, Radio, Users, CheckCircle, ChevronRight, Star, Heart, ArrowRight } from 'lucide-react';

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="h-screen overflow-y-auto bg-black text-white font-sans overflow-x-hidden relative flex flex-col justify-between">
            {/* Background glowing blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none"></div>
            <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-green-500/5 rounded-full blur-[150px] pointer-events-none"></div>

            {/* Header */}
            <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-all duration-300">
                        <Disc className="text-black stroke-[2.5] animate-spin-slow" size={20} />
                    </div>
                    <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Music Diary</span>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/login')} 
                        className="text-sm font-bold text-zinc-400 hover:text-white transition duration-200 cursor-pointer"
                    >
                        Connexion
                    </button>
                    <button 
                        onClick={() => navigate('/register')} 
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black text-sm font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.45)] hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    >
                        Créer un compte
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-24 md:space-y-32">
                
                {/* Hero Section */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
                            <Sparkles size={12} /> Votre vie en musique
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
                            Le journal de bord de votre <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-500 bg-clip-text text-transparent">voyage musical</span>.
                        </h1>
                        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            Notez vos albums favoris, créez votre mur de paroles personnalisées, connectez votre compte Spotify pour générer vos statistiques personnelles et suivez l'actualité musicale de vos amis.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.03] transition-all duration-300 cursor-pointer text-sm"
                            >
                                Commencer l'expérience <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-900/30 text-white font-bold transition-all duration-300 cursor-pointer text-sm"
                            >
                                Découvrir le site
                            </button>
                        </div>
                    </div>

                    {/* Floating Premium Visual Mockups */}
                    <div className="lg:col-span-5 relative h-[400px] flex items-center justify-center">
                        {/* Blob backdrop */}
                        <div className="absolute w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                        {/* Card 1: Review Card Mockup */}
                        <div className="absolute top-6 left-4 md:left-10 w-[280px] sm:w-[320px] bg-zinc-950/80 border border-zinc-800/60 p-5 rounded-2xl shadow-2xl backdrop-blur-md transform -rotate-3 hover:-rotate-1 transition-all duration-500 group cursor-default">
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
                            <div className="flex justify-between items-center mt-4 border-t border-zinc-900 pt-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-[10px] text-emerald-400">PC</div>
                                    <span className="text-[10px] font-bold text-zinc-300">Pharrell</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold">
                                    <Heart size={10} className="fill-rose-500/25 text-rose-500" /> 24 likes
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Lyric Pin Mockup */}
                        <div className="absolute bottom-6 right-4 md:right-10 w-[240px] bg-gradient-to-tr from-emerald-600/90 to-teal-500/85 p-5 rounded-2xl shadow-2xl shadow-emerald-500/10 transform rotate-6 hover:rotate-3 transition-all duration-500 cursor-default text-black">
                            <Quote size={20} className="text-black/55 mb-2.5" />
                            <p className="font-black text-sm leading-snug tracking-tight">
                                "We've come too far to give up who we are. So let's raise the bar..."
                            </p>
                            <div className="mt-4 border-t border-black/10 pt-2.5 flex items-center justify-between text-[10px] font-bold text-black/70">
                                <span>Get Lucky</span>
                                <span className="text-black/50">Daft Punk</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Tout ce dont vous avez besoin.</h2>
                        <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto font-semibold">
                            Une suite d'outils haut de gamme conçus pour analyser, documenter et partager votre passion musicale.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Feature 1 */}
                        <div className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-2xl hover:border-zinc-800/80 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                                <Disc size={22} className="animate-spin-slow" />
                            </div>
                            <h3 className="font-extrabold text-lg text-white mb-2">Journal de Bord</h3>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Rédigez des chroniques détaillées de vos albums favoris, attribuez-leur des notes étoilées et conservez une trace organisée de votre historique d'écoute.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-2xl hover:border-zinc-800/80 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                                <Radio size={22} />
                            </div>
                            <h3 className="font-extrabold text-lg text-white mb-2">Intégration Spotify</h3>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Connectez votre compte Spotify. Le site génère automatiquement vos tops artistes, tops sons, tops albums, genres préférés ainsi que vos analyses personnalisées.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-2xl hover:border-zinc-800/80 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                                <Quote size={22} />
                            </div>
                            <h3 className="font-extrabold text-lg text-white mb-2">Mur de Paroles</h3>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Créez un mur de "Lyric Pins" colorés. Saisissez vos paroles préférées, recherchez la chanson correspondante sur Spotify et épinglez vos cartes sur votre mur de profil.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-2xl hover:border-zinc-800/80 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                                <Users size={22} />
                            </div>
                            <h3 className="font-extrabold text-lg text-white mb-2">Fil d'Activité</h3>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Suivez vos amis et les membres de la communauté. Découvrez leurs dernières écoutes en direct, commentez leurs chroniques et échangez sur vos coups de cœur musicaux.
                            </p>
                        </div>

                    </div>
                </section>

                {/* Call-to-action Section */}
                <section className="bg-gradient-to-b from-zinc-900/60 to-zinc-950/20 border border-zinc-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                    {/* Glowing effect inside */}
                    <div className="absolute top-[-50%] right-[-20%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="space-y-4 max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                            Prêt à documenter votre voyage musical ?
                        </h2>
                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-medium">
                            Rejoignez la communauté de passionnés, découvrez vos statistiques cachées et partagez vos émotions musicales avec vos amis dès maintenant.
                        </p>
                    </div>

                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                        >
                            Créer un compte gratuitement
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-3.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-white font-bold text-sm transition-all duration-200 cursor-pointer"
                        >
                            Se connecter
                        </button>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="w-full border-t border-zinc-950 py-8 text-center text-xs text-zinc-600 bg-black z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-600 rounded-md flex items-center justify-center shadow-md">
                            <Disc className="text-black" size={10} />
                        </div>
                        <span className="font-bold text-zinc-400">Music Diary &copy; {new Date().getFullYear()}</span>
                    </div>
                    <p className="text-zinc-600">
                        Développé avec amour pour les passionnés de musique. Tous droits réservés.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
