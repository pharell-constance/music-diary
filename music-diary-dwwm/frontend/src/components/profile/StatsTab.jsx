import { Star } from 'lucide-react';

function StatsTab({ userStats, loadingStats, onShowWrapped }) {
    if (loadingStats) {
        return <p className="text-zinc-400 text-sm italic">Génération des analyses en cours...</p>;
    }

    if (!userStats) {
        return <p className="text-zinc-505 text-sm italic">Erreur lors de la récupération des analyses.</p>;
    }

    return (
        <div className="space-y-8">
            {/* Annual Wrapped Banner */}
            <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent p-6 rounded-2xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        🎬 Music Wrapped 2026
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                        Visualisez votre rétrospective musicale sous la forme d'une Story animée et interactive basée sur vos critiques rédigées.
                    </p>
                </div>
                <button
                    onClick={onShowWrapped}
                    className="bg-white hover:bg-zinc-200 text-black font-black py-2.5 px-6 rounded-full text-xs cursor-pointer transition shadow-md self-start md:self-center active:scale-95"
                >
                    Lancer mon Wrapped
                </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total reviews */}
                <div className="bg-[#181818] border border-zinc-800/40 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Critiques totales</span>
                    <div className="text-4xl font-black text-white mt-4">{userStats.totalReviews}</div>
                    <p className="text-[10px] text-zinc-500 mt-2">Disques analysés dans Music Diary.</p>
                </div>

                {/* Average rating */}
                <div className="bg-[#181818] border border-zinc-800/40 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Note moyenne</span>
                    <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-4xl font-black text-white">{userStats.averageRating}</span>
                        <span className="text-sm text-zinc-505">/5</span>
                    </div>
                    {/* Rating distribution bars */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-850/60">
                        {Object.entries(userStats.ratingDistribution).reverse().map(([rating, count]) => (
                            <div key={rating} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-zinc-800 h-8 rounded relative overflow-hidden flex items-end">
                                    <div
                                        className="bg-emerald-500 w-full"
                                        style={{
                                            height: `${userStats.totalReviews > 0 ? (count / userStats.totalReviews) * 100 : 0}%`
                                        }}
                                    />
                                </div>
                                <span className="text-[8px] text-zinc-500 font-bold">{rating}★</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Favourite genre */}
                <div className="bg-[#181818] border border-zinc-800/40 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Genre favori</span>
                    <div className="text-2xl font-black text-emerald-400 capitalize mt-4">
                        {userStats.topGenres?.[0]?.genre || "N/A"}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                        {userStats.topGenres?.[0]?.genre
                            ? `Avec ${userStats.topGenres[0].count} critiques écrites.`
                            : "Rédigez des critiques pour voir vos préférences."}
                    </p>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Genres chart */}
                <div className="bg-[#181818]/60 border border-zinc-800/40 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Genres musicaux les plus notés</h4>
                    <div className="space-y-3.5">
                        {userStats.topGenres.length === 0 ? (
                            <p className="text-zinc-505 text-xs italic">Aucune donnée disponible.</p>
                        ) : (
                            userStats.topGenres.map((item) => {
                                const pct = userStats.totalReviews > 0 ? (item.count / userStats.totalReviews) * 100 : 0;
                                return (
                                    <div key={item.genre} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-bold text-white capitalize">{item.genre}</span>
                                            <span className="text-zinc-400 font-semibold">{item.count} {item.count > 1 ? 'critiques' : 'critique'}</span>
                                        </div>
                                        <div className="w-full bg-zinc-850 h-2 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Decades chart */}
                <div className="bg-[#181818]/60 border border-zinc-800/40 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Décennies préférées</h4>
                    <div className="space-y-3.5">
                        {userStats.decadeDistribution.length === 0 ? (
                            <p className="text-zinc-550 text-xs italic">Aucune donnée disponible.</p>
                        ) : (
                            userStats.decadeDistribution.map((item) => {
                                const maxCount = Math.max(...userStats.decadeDistribution.map(d => d.count));
                                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                return (
                                    <div key={item.decade} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-bold text-white">{item.decade}</span>
                                            <span className="text-zinc-400 font-semibold">{item.count} {item.count > 1 ? 'albums' : 'album'}</span>
                                        </div>
                                        <div className="w-full bg-zinc-850 h-2 rounded-full overflow-hidden">
                                            <div className="bg-[#1DB954] h-full rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Album Favorites */}
            <div className="space-y-4 pt-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Coups de cœur (Albums les mieux notés)</h4>
                {userStats.highestRatedAlbums.length === 0 ? (
                    <p className="text-zinc-550 text-xs italic">Aucun album noté à 4★ ou 5★ pour le moment.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {userStats.highestRatedAlbums.map((album) => (
                            <div
                                key={album.id}
                                className="bg-[#181818] border border-zinc-800/40 p-3 rounded-xl flex flex-col items-center text-center shadow-sm hover:bg-[#222222] transition"
                            >
                                <div className="w-16 h-16 rounded overflow-hidden mb-2 shadow border border-zinc-800/60">
                                    <img src={album.albumCover} alt={album.albumName} className="w-full h-full object-cover" />
                                </div>
                                <div className="font-bold text-[11px] text-white truncate w-full leading-tight">{album.albumName}</div>
                                <div className="text-[9px] text-zinc-500 truncate w-full mt-0.5">{album.artistName}</div>
                                <div className="text-[10px] text-emerald-400 font-black mt-1.5 flex items-center gap-0.5">
                                    {album.rating}/5 <Star size={10} fill="currentColor" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StatsTab;
