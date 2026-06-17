import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Music, User, Disc, Settings, Flag, Crown } from 'lucide-react';

function formatCount(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1) + 'B';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000)         return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
    return String(n);
}


function ProfileHero({ profileUser, isOwnProfile, connected, livePlaying, onEditClick, onFollowToggle, onReportUser, onOpenFollowModal }) {
    const heroRef = useRef(null);

    useLayoutEffect(() => {
        if (!heroRef.current || !profileUser) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                heroRef.current.querySelector('.hero-avatar'),
                { scale: 0.5, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.7)', clearProps: 'all' }
            );
            gsap.fromTo(
                heroRef.current.querySelectorAll('.hero-meta > *'),
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.25, clearProps: 'all' }
            );
            gsap.fromTo(
                heroRef.current.querySelectorAll('.hero-action > *'),
                { y: 16, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.5, clearProps: 'all' }
            );
        }, heroRef);
        return () => ctx.revert();
    }, [profileUser]);


    return (
        <div
            ref={heroRef}
            className={`p-8 pt-12 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-b ${connected ? 'from-violet-950/20' : 'from-white/[0.01]'} to-transparent border-b border-white/[0.05]`}
        >
            {/* Grand Avatar circulaire */}
            <div className="hero-avatar w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-2xl flex items-center justify-center font-black text-4xl md:text-5xl text-white border-4 border-zinc-900 transform hover:scale-105 transition-transform duration-300 flex-shrink-0 overflow-hidden">
                {profileUser.avatar ? (
                    <img src={profileUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    profileUser.pseudo ? profileUser.pseudo.substring(0, 2).toUpperCase() : <User size={48} />
                )}
            </div>

            {/* Informations du Profil */}
            <div className="hero-meta flex-1 text-center md:text-left space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
                    {isOwnProfile ? "Mon Profil" : `Profil de ${profileUser.pseudo}`}
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-x-3 gap-y-1 justify-center md:justify-start">
                    <span>{profileUser.pseudo || "Utilisateur"}</span>
                    {profileUser.role === 'OWNER' && (
                        <span className="text-[10px] tracking-widest uppercase font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-1 self-center">
                            <Crown size={10} className="fill-yellow-450/20 text-yellow-400" />
                            <span>Propriétaire</span>
                        </span>
                    )}
                </h1>
                <p className="text-zinc-400 text-sm md:text-base font-medium flex items-center justify-center md:justify-start gap-2">
                    <span className="truncate">{profileUser.email}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{connected ? "Compte Spotify associé" : "Spotify non connecté"}</span>
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 text-xs md:text-sm text-zinc-400 font-semibold mt-1">
                    <button
                        onClick={() => onOpenFollowModal('followers')}
                        className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 outline-none flex items-center gap-1"
                    >
                        <span className="text-white font-extrabold">{formatCount(profileUser.followersCount ?? 0)}</span>
                        <span>{(profileUser.followersCount ?? 0) > 1 ? 'abonnés' : 'abonné'}</span>
                    </button>
                    <span className="text-zinc-700 font-normal">•</span>
                    <button
                        onClick={() => onOpenFollowModal('following')}
                        className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 outline-none flex items-center gap-1"
                    >
                        <span className="text-white font-extrabold">{formatCount(profileUser.followingCount ?? 0)}</span>
                        <span>{(profileUser.followingCount ?? 0) > 1 ? 'abonnements' : 'abonnement'}</span>
                    </button>
                </div>

                {livePlaying && livePlaying.isPlaying && (
                    <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 p-3 rounded-xl max-w-sm mt-3 mx-auto md:mx-0 shadow-sm animate-pulse">
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-violet-500/30">
                            {livePlaying.albumCover ? (
                                <img src={livePlaying.albumCover} alt={livePlaying.albumName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Music size={16} /></div>
                            )}
                        </div>
                        <div className="text-left min-w-0">
                            <div className="text-[9px] font-black uppercase tracking-wider text-violet-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block animate-ping"></span>
                                Écoute sur Spotify
                            </div>
                            <div className="font-bold text-xs text-white truncate mt-0.5" title={livePlaying.trackName}>
                                {livePlaying.trackName}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate" title={livePlaying.artistName}>
                                {livePlaying.artistName}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions rapides */}
            <div className="hero-action flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                {isOwnProfile ? (
                    <button
                        onClick={onEditClick}
                        className="flex items-center gap-2 bg-[#292738] hover:bg-[#2e2e2e] active:scale-95 text-white px-4 py-2 rounded-full border border-zinc-700/50 font-semibold text-xs transition-all duration-200 cursor-pointer shadow-md"
                    >
                        <Settings size={14} />
                        Modifier le profil
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onFollowToggle}
                            className={`px-5 py-2 rounded-full font-black text-xs transition-all duration-200 cursor-pointer shadow-md active:scale-95 border ${
                                profileUser.isFollowing
                                    ? 'bg-transparent border-zinc-600 text-zinc-300 hover:text-red-400 hover:border-red-500/40'
                                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white border-transparent'
                            }`}
                        >
                            {profileUser.isFollowing ? "Se désabonner" : "S'abonner"}
                        </button>
                        <button
                            onClick={onReportUser}
                            className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-transparent font-semibold text-xs transition-all duration-200 cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
                            title="Signaler ce membre"
                        >
                            <Flag size={14} /> Signaler
                        </button>
                    </div>
                )}

                {connected && (
                    <div className="flex items-center gap-2 bg-violet-500/10 text-violet-400 px-4 py-2 rounded-full border border-violet-500/20 font-semibold text-xs">
                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                        Synchronisé
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfileHero;
