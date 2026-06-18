import { Music, Disc } from 'lucide-react';
import ReviewCard from '../ReviewCard';

function JournalTab({ connected, isOwnProfile, reviews, user, onConnect, onEditReview, onDeleteReview, onReportReview, onSelectAlbum }) {
    return (
        <div className="space-y-8">
            {/* Section Spotify Non Connecté */}
            {!connected && (
                <div className="neobrutal-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 w-full bg-[#1a1824]">
                    {isOwnProfile ? (
                        <>
                            <div className="space-y-2 max-w-lg text-center md:text-left">
                                <h3 className="font-mouse-memoirs uppercase tracking-wide text-xl text-white flex items-center justify-center md:justify-start gap-2">
                                    <Disc className="text-violet-400 animate-spin" style={{ animationDuration: '6s' }} size={22} />
                                    Connectez votre compte Spotify
                                </h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    Associez votre profil Music Diary à Spotify pour récupérer vos 10 artistes les plus écoutés ainsi que vos dernières lectures en temps réel.
                                </p>
                            </div>
                            <button
                                onClick={onConnect}
                                className="neobrutal-btn bg-violet-600 hover:bg-violet-500 text-white font-mouse-memoirs uppercase tracking-widest py-3.5 px-8 rounded-full shadow-lg transition-all duration-300 transform flex items-center gap-3 w-full md:w-auto justify-center text-sm flex-shrink-0 border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.012 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.521 17.34c-.225.359-.696.473-1.055.25-2.909-1.782-6.57-2.18-10.887-1.192-.41.096-.822-.16-.917-.571-.097-.41.161-.822.571-.917 4.717-1.077 8.744-.627 12.012 1.378.36.223.473.693.246 1.052zm1.477-3.267c-.283.456-.881.605-1.337.321-3.33-2.046-8.406-2.639-12.345-1.443-.513.156-1.05-.138-1.207-.65-.156-.513.138-1.05.65-1.207 4.512-1.37 10.102-.716 13.918 1.631.456.282.605.88.321 1.348zm.094-3.393c-3.99-2.37-10.573-2.589-14.385-1.433-.613.186-1.258-.171-1.444-.784-.186-.613.172-1.258.784-1.444 4.384-1.33 11.639-1.077 16.224 1.644.553.329.738 1.042.41 1.595-.329.553-1.043.737-1.589.422z"/>
                                </svg>
                                Se connecter à Spotify
                            </button>
                        </>
                    ) : (
                        <div className="space-y-2 max-w-lg text-center md:text-left">
                            <h3 className="font-mouse-memoirs uppercase tracking-wide text-xl text-zinc-400 flex items-center justify-center md:justify-start gap-2">
                                <Disc className="text-zinc-600" size={20} />
                                Spotify non connecté
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Cet utilisateur n'a pas encore connecté son profil Spotify à Music Diary.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Journal de Bord (Chroniques) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center">
                        <Music className="text-violet-400" size={16} />
                    </div>
                    <h2 className="font-mouse-memoirs uppercase tracking-wide text-2xl text-white">Journal de Bord</h2>
                </div>
                {reviews.length === 0 ? (
                    <div className="neo-empty text-center py-16 flex flex-col items-center gap-3">
                        <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-500 text-lg">Aucune critique publiée pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {reviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                onEdit={isOwnProfile ? onEditReview : null}
                                onDelete={isOwnProfile ? onDeleteReview : null}
                                onReport={!isOwnProfile ? onReportReview : null}
                                currentUserId={user?.id}
                                currentUserRole={user?.role}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default JournalTab;
