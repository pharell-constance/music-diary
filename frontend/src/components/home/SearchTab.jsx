import { useNavigate } from 'react-router-dom';
import { Search, Music, Users, Play, Pause, Disc, ArrowLeft } from 'lucide-react';
import AlbumCard from '../AlbumCard';

function SearchTab({
    home,
    searchQuery,
    setSearchQuery,
    searchType,
    handleSwitchSearchType,
    handleSearch,
    loading,
    albums,
    artists,
    members,
    tracks = [],
    onSelectAlbum
}) {
    const navigate = useNavigate();

    const handleGenreClick = (searchName) => {
        let targetType = searchType;
        if (searchType === 'albums' || searchType === 'members') {
            targetType = 'artists';
            handleSwitchSearchType('artists');
        }
        setSearchQuery(searchName);
        if (home && home.triggerSearch) {
            home.triggerSearch(searchName, targetType);
        }
    };

    const genres = [
        { label: 'Pop', searchName: 'genre:pop', style: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/30' },
        { label: 'Hip Hop / Rap', searchName: 'rap', style: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' },
        { label: 'Rock', searchName: 'genre:rock', style: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' },
        { label: 'Electro', searchName: 'genre:electro', style: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
        { label: 'Vocaloid', searchName: 'vocaloid', style: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        { label: 'J-Pop', searchName: 'genre:j-pop', style: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30' },
        { label: 'Jazz', searchName: 'genre:jazz', style: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30' },
        { label: 'Lo-Fi', searchName: 'lofi', style: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30' }
    ];

    const showDashboard = !searchQuery.trim() && !loading;

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="text-4xl md:text-5xl font-mouse-memoirs uppercase tracking-wide text-white text-stroke-dark">Rechercher</h1>
            </div>

            {/* Pill Filters */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => handleSwitchSearchType('albums')}
                    className={`pill-btn px-5 py-2 ${searchType === 'albums' ? 'active' : 'inactive'}`}
                >
                    Albums
                </button>
                <button
                    onClick={() => handleSwitchSearchType('artists')}
                    className={`pill-btn px-5 py-2 ${searchType === 'artists' ? 'active' : 'inactive'}`}
                >
                    Artistes
                </button>
                <button
                    onClick={() => handleSwitchSearchType('tracks')}
                    className={`pill-btn px-5 py-2 ${searchType === 'tracks' ? 'active' : 'inactive'}`}
                >
                    Musiques
                </button>
                <button
                    onClick={() => handleSwitchSearchType('members')}
                    className={`pill-btn px-5 py-2 ${searchType === 'members' ? 'active' : 'inactive'}`}
                >
                    Membres
                </button>
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center gap-3 max-w-lg">
                {searchQuery.trim() && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery('');
                            if (home) {
                                home.setAlbums([]);
                                home.setArtists([]);
                                home.setTracks([]);
                                home.setMembers([]);
                            }
                        }}
                        className="neobrutal-card p-3 border-2 border-black bg-zinc-900 hover:bg-zinc-800 text-white shadow-[2px_2px_0px_#000000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000000] transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                        title="Retour au tableau de bord"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value.trim()) {
                                    // Clear results when input is cleared
                                    if (home) {
                                        home.setAlbums([]);
                                        home.setArtists([]);
                                        home.setTracks([]);
                                        home.setMembers([]);
                                    }
                                }
                            }}
                            placeholder={
                                searchType === 'albums'
                                    ? "Que souhaitez-vous écouter ?"
                                    : searchType === 'artists'
                                    ? "Rechercher un artiste..."
                                    : searchType === 'tracks'
                                    ? "Rechercher une musique..."
                                    : "Rechercher un membre par pseudo..."
                            }
                            className="w-full pl-4 pr-4 py-3 text-sm font-medium"
                        />
                    </div>
                </form>
            </div>

            {/* Loader skeleton */}
            {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="skeleton h-48 rounded-2xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Enhanced Dashboard (shown when search is empty) */}
            {showDashboard && (
                <div className="space-y-8 animate-fade-in">
                    {/* Welcome banner */}
                    <div className="neobrutal-card p-6 md:p-8 bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 border-2 border-white/10 rounded-2xl relative overflow-hidden shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
                        <div className="absolute top-[-50%] right-[-10%] w-72 h-72 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <div className="relative z-10 space-y-2">
                            <h2 className="text-2xl md:text-3xl font-mouse-memoirs uppercase tracking-wider text-white">
                                Explorez le Monde de la Musique
                            </h2>
                            <p className="text-zinc-400 text-xs md:text-sm font-medium max-w-xl">
                                Entrez le nom d'un album, d'un artiste ou d'une chanson, ou cliquez sur l'un des genres ci-dessous.
                            </p>
                        </div>
                    </div>

                    {/* Popular Genres grid */}
                    <div className="space-y-4">
                        <h3 className="font-mouse-memoirs uppercase tracking-widest text-lg text-fuchsia-400">
                            Genres Populaires
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {genres.map((genre) => (
                                <button
                                    key={genre.searchName}
                                    onClick={() => handleGenreClick(genre.searchName)}
                                    className={`neobrutal-card p-5 border-2 border-black flex items-center justify-between text-left font-mouse-memoirs text-lg uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-[3px_3px_0px_#000000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000000] ${genre.style}`}
                                >
                                    <span>{genre.label}</span>
                                    <Music size={16} className="opacity-70 shrink-0 ml-2" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
                        {/* Trending Tracks */}
                        {home?.trending && home.trending.length > 0 && (
                            <div className="lg:col-span-7 space-y-4">
                                <h3 className="font-mouse-memoirs uppercase tracking-widest text-lg text-violet-400">
                                    Musiques Tendances
                                </h3>
                                <div className="bg-zinc-950/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                                    {home.trending.slice(0, 5).map((track, idx) => {
                                        const isPlayingThis = home.playingPreview === track.id;
                                        return (
                                            <div
                                                key={track.id}
                                                onClick={() => navigate(`/song/${track.id}`, { state: { songData: track } })}
                                                className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors duration-200 group cursor-pointer"
                                            >
                                                {/* Index / Play */}
                                                <div className="w-8 flex items-center justify-center flex-shrink-0 relative">
                                                    {track.previewUrl ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    home.togglePreview(track);
                                                                }}
                                                                className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 absolute transition-opacity duration-150 cursor-pointer active:scale-95 shadow-md z-10"
                                                            >
                                                                {isPlayingThis ? <Pause size={12} fill="black" /> : <Play size={12} fill="black" className="ml-0.5" />}
                                                            </button>
                                                            <span className={`text-xs font-bold transition-opacity duration-150 ${isPlayingThis ? 'text-emerald-400 opacity-0' : 'text-zinc-500 group-hover:opacity-0'}`}>
                                                                {idx + 1}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs font-bold text-zinc-650">{idx + 1}</span>
                                                    )}
                                                    {isPlayingThis && track.previewUrl && (
                                                        <span className="text-[10px] text-emerald-400 font-extrabold animate-pulse">▶</span>
                                                    )}
                                                </div>

                                                {/* Cover */}
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-800/60 shadow-sm">
                                                    {track.albumCover ? (
                                                        <img src={track.albumCover} alt={track.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Disc size={16} className="text-zinc-650" /></div>
                                                    )}
                                                </div>

                                                {/* Name / Artist */}
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-bold truncate transition-colors duration-200 ${isPlayingThis ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>
                                                        {track.name}
                                                    </div>
                                                     <div className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                                                         {track.artistName || (typeof track.artists === 'string' ? track.artists : (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(', ') : ''))}
                                                     </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Suggested Members */}
                        {home?.exploreUsers && home.exploreUsers.length > 0 && (
                            <div className="lg:col-span-5 space-y-4">
                                <h3 className="font-mouse-memoirs uppercase tracking-widest text-lg text-pink-400">
                                    Membres Recommandés
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {home.exploreUsers.slice(0, 4).map((member) => (
                                        <div
                                            key={member.id}
                                            onClick={() => navigate(`/profile/${member.id}`)}
                                            className="neobrutal-card p-4 flex flex-col items-center text-center cursor-pointer hover:rotate-[1deg] hover:scale-[1.02] duration-200 bg-zinc-950/20"
                                        >
                                            <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden mb-2.5 flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600 font-black text-lg text-white shadow-md">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.pseudo} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.pseudo.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div className="font-mouse-memoirs uppercase tracking-wide text-sm text-white truncate w-full">
                                                {member.pseudo}
                                            </div>
                                            <div className="text-[9px] text-zinc-500 mt-0.5 font-semibold uppercase tracking-widest">
                                                Membre Music Diary
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Results sections */}
            {!loading && searchQuery.trim() && (
                <>
                    {searchType === 'albums' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {albums.map((album) => (
                                <AlbumCard
                                    key={album.id}
                                    album={album}
                                    onClick={() => onSelectAlbum(album)}
                                />
                            ))}
                        </div>
                    )}

                    {searchType === 'artists' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {artists.length === 0 ? (
                                <div className="col-span-full neo-empty text-center py-16 flex flex-col items-center gap-3">
                                    <Music size={30} className="text-zinc-650" />
                                    <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-500">Aucun artiste trouvé.</p>
                                </div>
                            ) : (
                                artists.map((art) => (
                                    <div
                                        key={art.id}
                                        onClick={() => navigate(`/artist/${art.id}`, { state: { artistData: art } })}
                                        className="neobrutal-card p-4 flex flex-col items-center text-center cursor-pointer hover:rotate-[1deg]"
                                    >
                                        <div className="w-20 h-20 rounded-full border-2 border-white overflow-hidden mb-3 flex items-center justify-center bg-zinc-800 shadow-[3px_3px_0px_rgba(255,255,255,0.1)]">
                                            {art.images?.[0]?.url ? (
                                                <img src={art.images[0].url} alt={art.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Music size={28} className="text-zinc-500" />
                                            )}
                                        </div>
                                        <div className="font-mouse-memoirs uppercase tracking-wide text-sm text-white truncate w-full">
                                            {art.name}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 mt-0.5 font-semibold uppercase tracking-widest">
                                            Artiste Spotify
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {searchType === 'tracks' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tracks.length === 0 ? (
                                <div className="col-span-full neo-empty text-center py-16 flex flex-col items-center gap-3">
                                    <Music size={30} className="text-zinc-650" />
                                    <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-500">Aucune musique trouvée.</p>
                                </div>
                            ) : (
                                tracks.map((track) => (
                                    <div
                                        key={track.id}
                                        onClick={() => navigate(`/song/${track.id}`, { state: { songData: track } })}
                                        className="neobrutal-card p-4 flex items-center gap-4 cursor-pointer hover:rotate-[0.5deg] transition-all duration-200"
                                    >
                                        <div className="w-16 h-16 bg-zinc-800 border-2 border-white rounded-xl shadow-[3px_3px_0px_rgba(255,255,255,0.1)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {track.album?.images?.[0]?.url ? (
                                                <img src={track.album.images[0].url} alt={track.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Music size={24} className="text-zinc-500" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-mouse-memoirs uppercase tracking-wide text-lg text-white truncate leading-tight hover:text-pink-500 transition-colors">
                                                {track.name}
                                            </div>
                                            <div className="text-xs text-zinc-400 truncate mt-0.5 font-semibold">
                                                {track.artists?.map(a => a.name).join(', ')}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-1 truncate">
                                                {track.album?.name}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {searchType === 'members' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {members.length === 0 ? (
                                <div className="col-span-full neo-empty text-center py-16 flex flex-col items-center gap-3">
                                    <Users size={30} className="text-zinc-650" />
                                    <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-500">Aucun membre trouvé.</p>
                                </div>
                            ) : (
                                members.map((member) => (
                                    <div
                                        key={member.id}
                                        onClick={() => navigate(`/profile/${member.id}`)}
                                        className="neobrutal-card p-4 flex flex-col items-center text-center cursor-pointer hover:rotate-[1deg]"
                                    >
                                        <div className="w-20 h-20 rounded-full border-2 border-white overflow-hidden mb-3 flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600 font-black text-xl text-white shadow-[3px_3px_0px_rgba(255,255,255,0.1)]">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.pseudo} className="w-full h-full object-cover" />
                                            ) : (
                                                member.pseudo.substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div className="font-mouse-memoirs uppercase tracking-wide text-sm text-white truncate w-full">
                                            {member.pseudo}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 mt-0.5 font-semibold uppercase tracking-widest">
                                            Membre Music Diary
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default SearchTab;
