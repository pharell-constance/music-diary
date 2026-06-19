import { Music } from 'lucide-react';
import ReviewCard from '../ReviewCard';
import HomeTrendingSidebar from './HomeTrendingSidebar';

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
            </div>

            {/* 2-column layout: 70% feed + 30% sidebar */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                {/* Main feed — 70% */}
                <div className="w-full lg:w-[70%] lg:flex-1 min-w-0">
                    {home.homeSubTab === 'my-journal' ? (
                        <div>
                            {home.myReviews.length === 0 ? (
                                <div className="neo-empty text-center py-16 flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center">
                                        <Music size={26} className="text-violet-400" />
                                    </div>
                                    <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-400 text-lg">Aucune critique pour le moment.</p>
                                    <p className="text-zinc-600 text-xs">Cherchez un album et rédigez votre première chronique !</p>
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
                    ) : (
                        <div>
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
