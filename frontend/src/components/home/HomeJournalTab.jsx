import { Music, Flame } from 'lucide-react';
import ReviewCard from '../ReviewCard';
import TrendingTab from './TrendingTab';

export default function HomeJournalTab({ home }) {
    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-4xl md:text-5xl font-mouse-memoirs uppercase tracking-wide text-white text-stroke-dark">
                    Bonjour, <span className="text-violet-400">{home.user.pseudo}</span>
                </h1>
                <p className="text-zinc-400 mt-1 font-medium">Partagez vos critiques musicales et découvrez les tendances.</p>
            </div>

            {/* Sub-tabs header */}
            <div className="flex gap-2 select-none overflow-x-auto no-scrollbar pb-1">
                <button
                    onClick={() => home.setHomeSubTab('my-journal')}
                    className={`pill-btn px-5 py-2 ${home.homeSubTab === 'my-journal' ? 'active' : 'inactive'}`}
                >
                    Mon Journal
                </button>
                <button
                    onClick={() => home.setHomeSubTab('social-feed')}
                    className={`pill-btn px-5 py-2 ${home.homeSubTab === 'social-feed' ? 'active' : 'inactive'}`}
                >
                    Fil d'activité
                </button>
                <button
                    onClick={() => home.setHomeSubTab('trending')}
                    className={`pill-btn px-5 py-2 flex items-center gap-2 ${home.homeSubTab === 'trending' ? 'active' : 'inactive'}`}
                >
                    <Flame size={13} className={home.homeSubTab === 'trending' ? 'text-orange-300' : 'text-zinc-500'} />
                    Tendances
                </button>
            </div>

            {home.homeSubTab === 'my-journal' ? (
                <div className="mt-4">
                    {home.myReviews.length === 0 ? (
                        <div className="neo-empty text-center py-16 flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center">
                                <Music size={26} className="text-violet-400" />
                            </div>
                            <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-400 text-lg">Aucune critique pour le moment.</p>
                            <p className="text-zinc-600 text-xs">Cherchez un album et rédigez votre première chronique !</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                <div className="mt-4">
                    {home.loadingSocialFeed ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="skeleton h-32 w-full" />
                            ))}
                        </div>
                    ) : home.socialFeed.length === 0 ? (
                        <div className="neo-empty text-center py-16 flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border-2 border-fuchsia-500/30 flex items-center justify-center">
                                <Music size={26} className="text-fuchsia-400" />
                            </div>
                            <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-400 text-lg">Aucune activité dans votre fil.</p>
                            <p className="text-zinc-600 text-xs">Suivez d'autres membres pour voir leurs critiques !</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                <TrendingTab
                    trending={home.trending}
                    loadingTrending={home.loadingTrending}
                    trendingLimit={home.trendingLimit}
                    setTrendingLimit={home.setTrendingLimit}
                    playingPreview={home.playingPreview}
                    togglePreview={home.togglePreview}
                    formatDuration={home.formatDuration}
                />
            )}
            
            {/* Audio player caché */}
            <audio
                ref={home.audioRef}
                onEnded={() => home.setPlayingPreview(null)}
                className="hidden"
            />
        </div>
    );
}
