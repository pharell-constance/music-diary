import { Music, Disc } from 'lucide-react';
import ReviewCard from '../ReviewCard';

function JournalTab({ connected, isOwnProfile, reviews, user, onConnect, onEditReview, onDeleteReview, onReportReview, onSelectAlbum }) {
    return (
        <div className="space-y-10">
            {/* Section Spotify Non Connecté */}
            {!connected && (
                <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 p-6 md:p-8 rounded-2xl border border-zinc-800/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                    {isOwnProfile ? (
                        <>
                            <div className="space-y-2 max-w-lg text-center md:text-left">
                                <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-white">
                                    <Disc className="text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                                    Connectez votre compte Spotify
                                </h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    Associez votre profil Music Diary à Spotify pour récupérer vos 10 artistes les plus écoutés ainsi que vos dernières lectures en temps réel.
                                </p>
                            </div>
                            <button
                                onClick={onConnect}
                                className="bg-[#1DB954] hover:bg-[#1ED760] text-black font-bold py-3.5 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-100 flex items-center gap-3 w-full md:w-auto justify-center text-sm flex-shrink-0"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.012 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.521 17.34c-.225.359-.696.473-1.055.25-2.909-1.782-6.57-2.18-10.887-1.192-.41.096-.822-.16-.917-.571-.097-.41.161-.822.571-.917 4.717-1.077 8.744-.627 12.012 1.378.36.223.473.693.246 1.052zm1.477-3.267c-.283.456-.881.605-1.337.321-3.33-2.046-8.406-2.639-12.345-1.443-.513.156-1.05-.138-1.207-.65-.156-.513.138-1.05.65-1.207 4.512-1.37 10.102-.716 13.918 1.631.456.282.605.88.321 1.348zm.094-3.393c-3.99-2.37-10.573-2.589-14.385-1.433-.613.186-1.258-.171-1.444-.784-.186-.613.172-1.258.784-1.444 4.384-1.33 11.639-1.077 16.224 1.644.553.329.738 1.042.41 1.595-.329.553-1.043.737-1.589.422z"/>
                                </svg>
                                Se connecter à Spotify
                            </button>
                        </>
                    ) : (
                        <div className="space-y-2 max-w-lg text-center md:text-left">
                            <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-white">
                                <Disc className="text-zinc-650" />
                                Spotify non connecté
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Cet utilisateur n'a pas encore connecté son profil Spotify à Music Diary.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Journal de Bord (Chroniques) */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                    <Music className="text-emerald-400" size={24} />
                    <h2 className="text-2xl font-bold tracking-tight">Journal de bord</h2>
                </div>
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-[#181818] rounded-xl border border-zinc-800/50">
                        <p className="text-zinc-500 text-sm">Aucune critique publiée pour le moment.</p>
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
