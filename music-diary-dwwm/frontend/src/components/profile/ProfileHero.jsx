import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Music, User, Disc, Settings, Flag, Crown } from 'lucide-react';

function formatCount(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1) + 'B';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000)         return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
    return String(n);
}


function ProfileHero({ profileUser, isOwnProfile, connected, livePlaying, onEditClick, onFollowToggle, onReportUser, onOpenFollowModal, onLogoutClick }) {
    const heroRef = useRef(null);
    const navigate = useNavigate();

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
            {/* Grand Avatar circulaire avec Statut */}
            <div className="relative flex-shrink-0 group">
                <div className="hero-avatar w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-black text-4xl md:text-5xl text-white border-4 border-white shadow-[4px_4px_0px_rgba(255,255,255,0.15)] transform hover:scale-105 transition-all duration-300 overflow-hidden">
                    {profileUser.avatar ? (
                        <img src={profileUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        profileUser.pseudo ? profileUser.pseudo.substring(0, 2).toUpperCase() : <User size={48} />
                    )}
                </div>
                {/* Status Badge overlay (GitHub-style) */}
                {(profileUser.statusEmoji || profileUser.statusText) && (
                    <div 
                        className="absolute bottom-1 right-1 bg-[#121214] hover:bg-zinc-800 border-2 border-white text-white px-2.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(255,255,255,0.15)] transition-all duration-200 cursor-pointer pointer-events-auto select-none"
                        title={profileUser.statusText || ""}
                    >
                        <span className="text-sm leading-none">{profileUser.statusEmoji || "💬"}</span>
                        {profileUser.statusText && (
                            <span className="max-w-[80px] md:max-w-[120px] truncate text-[9px] font-black uppercase tracking-wider text-zinc-300">
                                {profileUser.statusText}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Informations du Profil */}
            <div className="hero-meta flex-1 text-center md:text-left space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
                    {isOwnProfile ? "Mon Profil" : `Profil de ${profileUser.pseudo}`}
                </span>
                <h1 className="text-4xl md:text-6xl font-mouse-memoirs uppercase tracking-widest text-white text-stroke-dark flex flex-wrap items-center gap-x-3 gap-y-1 justify-center md:justify-start">
                    <span>{profileUser.pseudo || "Utilisateur"}</span>
                    {profileUser.role === 'OWNER' && (
                        <span className="text-[10px] tracking-widest uppercase font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center gap-1 self-center">
                            <Crown size={10} className="fill-yellow-450/20 text-yellow-400" />
                            <span>Propriétaire</span>
                        </span>
                    )}
                </h1>
                <p className="text-zinc-400 text-sm md:text-base font-medium flex items-center justify-center md:justify-start gap-2">
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

                {profileUser.bio && (
                    <p className="text-zinc-300 text-xs md:text-sm mt-2.5 md:text-left text-center max-w-md neobrutal-card p-3.5 leading-relaxed bg-white/[0.01]">
                        {profileUser.bio}
                    </p>
                )}

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

            {/* Artiste Préféré */}
            {profileUser.favArtistId && (
                <div 
                    onClick={() => navigate(`/artist/${profileUser.favArtistId}`)}
                    className="neobrutal-card p-3.5 flex items-center gap-3.5 cursor-pointer transition-all duration-300 w-full md:w-60 flex-shrink-0 self-center md:self-auto rotate-[2deg] hover:rotate-0"
                >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white group-hover:border-violet-500 shadow-inner transition-colors duration-300 flex-shrink-0">
                        {profileUser.favArtistImage ? (
                            <img src={profileUser.favArtistImage} alt={profileUser.favArtistName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-500">?</div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mouse-memoirs uppercase tracking-[0.2em] text-violet-400">Artiste Préféré</span>
                        <h4 className="font-mouse-memoirs text-xl uppercase tracking-wider text-white truncate group-hover:text-violet-400 transition-colors duration-300 mt-0.5">
                            {profileUser.favArtistName}
                        </h4>
                    </div>
                </div>
            )}

            {/* Actions rapides */}
            <div className="hero-action flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                {isOwnProfile ? (
                    <div className="flex gap-2">
                        <button
                            onClick={onEditClick}
                            className="flex items-center gap-2 neobrutal-btn bg-[#1e1e22] hover:bg-zinc-850 text-white px-4 py-2.5 rounded-full font-mouse-memoirs uppercase tracking-widest text-sm"
                        >
                            <Settings size={14} />
                            Modifier le profil
                        </button>
                        {onLogoutClick && (
                            <button
                                onClick={onLogoutClick}
                                className="md:hidden flex items-center gap-2 neobrutal-btn bg-transparent border-2 border-red-500 hover:bg-red-500 text-red-400 px-4 py-2.5 rounded-full font-mouse-memoirs uppercase tracking-widest text-sm"
                            >
                                Se déconnecter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onFollowToggle}
                            className={`px-5 py-2 neobrutal-btn rounded-full font-mouse-memoirs uppercase tracking-widest text-sm ${
                                profileUser.isFollowing
                                    ? 'bg-transparent border-2 border-zinc-650 text-zinc-300 hover:border-red-500 hover:text-red-400'
                                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white border-transparent shadow-[3px_3px_0px_#fff] hover:shadow-[4px_4px_0px_#fff]'
                            }`}
                        >
                            {profileUser.isFollowing ? "Se désabonner" : "S'abonner"}
                        </button>
                        <button
                            onClick={onReportUser}
                            className="px-4 py-2 neobrutal-btn bg-transparent border-2 border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 rounded-full font-mouse-memoirs uppercase tracking-widest text-sm flex items-center gap-1.5"
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
