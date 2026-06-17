import { Music, Flame } from 'lucide-react';
import ReviewCard from '../ReviewCard';
import TrendingTab from './TrendingTab';

export default function HomeJournalTab({ home }) {
    return (
        <div className="space-y-6">
            <div className="border-b border-zinc-800/40 pb-4">
                <h1 className="text-3xl font-extrabold tracking-tight">Bonjour, {home.user.pseudo}</h1>
                <p className="text-zinc-400 mt-1">Partagez vos critiques musicales et découvrez les tendances.</p>
            </div>

            {/* Sub-tabs header */}
            <div className="flex gap-4 border-b border-zinc-850 select-none overflow-x-auto no-scrollbar">
                <button
                    onClick={() => home.setHomeSubTab('my-journal')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        home.homeSubTab === 'my-journal'
                            ? 'border-violet-500 text-white'
                            : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                >
                    Mon Journal
                </button>
                <button
                    onClick={() => home.setHomeSubTab('social-feed')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        home.homeSubTab === 'social-feed'
                            ? 'border-violet-500 text-white'
                            : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                >
                    Fil d'activité
                </button>
                <button
                    onClick={() => home.setHomeSubTab('trending')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        home.homeSubTab === 'trending'
                            ? 'border-violet-500 text-white'
                            : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                >
                    <Flame size={14} className={home.homeSubTab === 'trending' ? 'text-orange-400' : ''} />
                    Tendances
                </button>
            </div>

            {home.homeSubTab === 'my-journal' ? (
                <div className="mt-4">
                    {home.myReviews.length === 0 ? (
                        <div className="text-center py-12 bg-[#1a1824] rounded-md border border-zinc-800/50">
                            <Music size={40} className="mx-auto text-zinc-600 mb-3" />
                            <p className="text-zinc-400 text-sm">Aucune critique pour le moment.</p>
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
                        <p className="text-zinc-400 text-sm italic">Chargement du fil d'activité...</p>
                    ) : home.socialFeed.length === 0 ? (
                        <div className="text-center py-12 bg-[#1a1824] rounded-md border border-zinc-800/50">
                            <Music size={40} className="mx-auto text-zinc-600 mb-3" />
                            <p className="text-zinc-400 text-sm">Aucune activité dans votre fil. Suivez d'autres membres pour voir leurs critiques !</p>
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
