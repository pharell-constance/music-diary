import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Search, Sparkles, Users, BookOpen } from 'lucide-react';
import ReviewCard from '../ReviewCard';
import HomeTrendingSidebar from './HomeTrendingSidebar';

export default function HomeJournalTab({ home }) {
    const navigate = useNavigate();
    const [quickQuery, setQuickQuery] = useState('');

    const handleQuickSearch = (e) => {
        e.preventDefault();
        if (!quickQuery.trim()) return;
        home.setSearchQuery(quickQuery);
        home.setSearchType('albums'); // Default to albums
        home.setCurrentTab('search');
    };

    // Extract unique albums from trending list to suggest as review targets
    const getSuggestedAlbums = () => {
        if (!home.trending || home.trending.length === 0) return [];
        const seenAlbums = new Set();
        const suggested = [];
        for (const track of home.trending) {
            if (!track.albumId || !track.albumName || !track.albumCover) continue;
            if (!seenAlbums.has(track.albumId)) {
                seenAlbums.add(track.albumId);
                suggested.push({
                    id: track.albumId,
                    name: track.albumName,
                    artists: (track.artists || '').split(', ').map(name => ({ name })),
                    images: [{ url: track.albumCover }]
                });
            }
            if (suggested.length >= 4) break; // show 4 suggestions
        }
        return suggested;
    };

    const suggestedAlbums = getSuggestedAlbums();

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-4xl md:text-5xl font-mouse-memoirs uppercase tracking-wide text-white text-stroke-dark">
                    Bonjour, <span className="text-violet-400">{home.user.pseudo}</span>
                </h1>
                <p className="text-zinc-400 mt-1 font-medium">Partagez vos critiques musicales et découvrez les tendances.</p>
            </div>

            {/* Quick Search Bar */}
            <div className="neobrutal-card p-6 bg-[#121214] flex flex-col gap-3">
                <h2 className="font-mouse-memoirs uppercase tracking-widest text-sm text-zinc-400 leading-tight">
                    De quoi voulez-vous parler aujourd'hui ?
                </h2>
                <form onSubmit={handleQuickSearch} className="flex gap-2 w-full">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                            type="text"
                            value={quickQuery}
                            onChange={(e) => setQuickQuery(e.target.value)}
                            placeholder="Rechercher un album, un artiste ou un morceau..."
                            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-white/10 bg-black/35 focus:outline-none focus:border-violet-400 transition-colors text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        className="neobrutal-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider bg-violet-600 text-white flex items-center gap-1.5"
                    >
                        <Search size={13} />
                        Chercher
                    </button>
                </form>
            </div>

            {/* Sub-tabs header */}
            <div className="flex gap-2 select-none overflow-x-auto no-scrollbar pb-1">
                <button
                    onClick={() => home.setHomeSubTab('my-journal')}
                    className={`pill-btn px-5 py-2 flex items-center gap-2 ${home.homeSubTab === 'my-journal' ? 'active' : 'inactive'}`}
                >
                    <BookOpen size={13} />
                    <span>Mon Journal</span>
                </button>
                <button
                    onClick={() => home.setHomeSubTab('social-feed')}
                    className={`pill-btn px-5 py-2 flex items-center gap-2 ${home.homeSubTab === 'social-feed' ? 'active' : 'inactive'}`}
                >
                    <Users size={13} />
                    <span>Fil d'activité</span>
                </button>
                <button
                    onClick={() => home.setHomeSubTab('explore')}
                    className={`pill-btn px-5 py-2 flex items-center gap-2 ${home.homeSubTab === 'explore' ? 'active' : 'inactive'}`}
                >
                    <Sparkles size={13} />
                    <span>Découvrir</span>
                </button>
            </div>

            {/* 2-column layout: 70% feed + 30% sidebar */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                {/* Main feed — 70% */}
                <div className="w-full lg:w-[70%] lg:flex-1 min-w-0">
                    {home.homeSubTab === 'my-journal' ? (
                        <div className="space-y-6">
                            {home.myReviews.length === 0 ? (
                                <div className="space-y-6">
                                    <div className="neo-empty text-center py-16 flex flex-col items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center">
                                            <Music size={26} className="text-violet-400" />
                                        </div>
                                        <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-400 text-lg">Aucune critique pour le moment.</p>
                                        <p className="text-zinc-600 text-xs max-w-sm mx-auto leading-relaxed">
                                            Votre journal est encore vide. Commencez à partager votre avis sur vos albums préférés !
                                        </p>
                                        <button
                                            onClick={() => {
                                                home.setSearchType('albums');
                                                home.setCurrentTab('search');
                                            }}
                                            className="neobrutal-btn px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer rounded-xl bg-violet-600 text-white mt-2"
                                        >
                                            Écrire une chronique
                                        </button>
                                    </div>

                                    {/* Album Review Suggestions */}
                                    {suggestedAlbums.length > 0 && (
                                        <div className="neobrutal-card p-6 bg-[#121214] flex flex-col gap-4">
                                            <div className="flex items-center gap-2 pb-2 border-b-2 border-white/10">
                                                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border-2 border-violet-400/40 flex items-center justify-center">
                                                    <Sparkles size={15} className="text-violet-400 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h3 className="font-mouse-memoirs uppercase tracking-widest text-sm text-white leading-tight">Des idées de chroniques ?</h3>
                                                    <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Albums populaires du moment</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {suggestedAlbums.map((album) => (
                                                    <div
                                                        key={album.id}
                                                        onClick={() => {
                                                            home.setSelectedAlbum(album);
                                                            home.setEditingReviewId(null);
                                                        }}
                                                        className="group bg-black/20 hover:bg-violet-500/[0.04] border-2 border-white/10 hover:border-violet-400/50 rounded-xl p-2.5 flex flex-col gap-2 transition-all cursor-pointer overflow-hidden"
                                                    >
                                                        <div className="aspect-square w-full rounded-lg overflow-hidden border border-white/10 group-hover:border-violet-400/30 transition-colors relative">
                                                            <img src={album.images[0].url} alt={album.name} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-[9px] font-black uppercase bg-violet-600 text-white px-2 py-1 rounded border border-white/10">
                                                                    Écrire
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0 flex flex-col text-center">
                                                            <span className="font-bold text-[10px] text-white group-hover:text-violet-400 transition-colors truncate leading-tight">
                                                                {album.name}
                                                            </span>
                                                            <span className="text-[9px] text-zinc-500 truncate mt-0.5 leading-none">
                                                                {album.artists.map(a => a.name).join(', ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {home.myReviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            onEdit={home.handleEditClick}
                                            onDelete={home.handleDeleteReview}
                                            currentUserId={home.user?.id}
                                            currentUserRole={home.user?.role}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : home.homeSubTab === 'social-feed' ? (
                        <div>
                            {home.loadingSocialFeed ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="skeleton h-32 w-full" />
                                    ))}
                                </div>
                            ) : home.socialFeed.length === 0 ? (
                                <div className="space-y-6">
                                    <div className="neo-empty text-center py-16 flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border-2 border-fuchsia-500/30 flex items-center justify-center">
                                            <Music size={26} className="text-fuchsia-400" />
                                        </div>
                                        <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-400 text-lg">Aucune activité dans votre fil.</p>
                                        <p className="text-zinc-600 text-xs">Suivez d'autres membres pour voir leurs critiques !</p>
                                    </div>

                                    {/* Suggested members to follow */}
                                    {home.exploreUsers && home.exploreUsers.length > 0 && (
                                        <div className="neobrutal-card p-6 bg-[#121214] flex flex-col gap-4">
                                            <div className="flex items-center gap-2 pb-2 border-b-2 border-white/10">
                                                <div className="w-8 h-8 rounded-lg bg-fuchsia-500/15 border-2 border-fuchsia-400/40 flex items-center justify-center">
                                                    <Users size={15} className="text-fuchsia-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-mouse-memoirs uppercase tracking-widest text-sm text-white leading-tight">Membres recommandés</h3>
                                                    <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Trouver des mélomanes à suivre</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {home.exploreUsers.map((member) => (
                                                    <div
                                                        key={member.id}
                                                        onClick={() => navigate(`/profile/${member.id}`)}
                                                        className="group bg-black/20 hover:bg-fuchsia-500/[0.04] border-2 border-white/10 hover:border-fuchsia-400/50 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-full bg-zinc-850 border border-white/10 group-hover:border-fuchsia-400/30 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-black text-violet-400">
                                                                {member.avatar ? (
                                                                    <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    member.pseudo.substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-bold text-xs text-white group-hover:text-fuchsia-400 transition-colors block truncate leading-tight">
                                                                    {member.pseudo}
                                                                </span>
                                                                <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
                                                                    {member._count.reviews} {member._count.reviews > 1 ? 'critiques' : 'critique'} • {member._count.followers} {member._count.followers > 1 ? 'abonnés' : 'abonné'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="neobrutal-btn px-3 py-1.5 text-[8.5px] font-black uppercase bg-fuchsia-600 text-white tracking-wider flex items-center gap-0.5">
                                                            Profil
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {home.socialFeed.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            currentUserId={home.user?.id}
                                            currentUserRole={home.user?.role}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Explore Tab (Community public reviews)
                        <div>
                            {home.loadingExploreReviews ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="skeleton h-32 w-full" />
                                    ))}
                                </div>
                            ) : home.exploreReviews.length === 0 ? (
                                <div className="neo-empty text-center py-16 flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center">
                                        <Music size={26} className="text-violet-400" />
                                    </div>
                                    <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-400 text-lg">Aucune critique publique.</p>
                                    <p className="text-zinc-600 text-xs">Soyez le premier à rédiger une chronique sur la plateforme !</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {home.exploreReviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            currentUserId={home.user?.id}
                                            currentUserRole={home.user?.role}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right sidebar — 30% */}
                <HomeTrendingSidebar
                    trending={home.trending}
                    loadingTrending={home.loadingTrending}
                    playingPreview={home.playingPreview}
                    togglePreview={home.togglePreview}
                />
            </div>

            <audio
                ref={home.audioRef}
                onEnded={() => home.setPlayingPreview(null)}
                className="hidden"
            />
        </div>
    );
}

