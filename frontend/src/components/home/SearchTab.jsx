import { useNavigate } from 'react-router-dom';
import { Search, Music, Users } from 'lucide-react';
import AlbumCard from '../AlbumCard';

function SearchTab({
    searchQuery,
    setSearchQuery,
    searchType,
    handleSwitchSearchType,
    handleSearch,
    loading,
    albums,
    artists,
    members,
    onSelectAlbum
}) {
    const navigate = useNavigate();

    return (
        <div>
            <div className="page-header">
                <h1 className="text-4xl md:text-5xl font-mouse-memoirs uppercase tracking-wide text-white text-stroke-dark">Rechercher</h1>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
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
                    onClick={() => handleSwitchSearchType('members')}
                    className={`pill-btn px-5 py-2 ${searchType === 'members' ? 'active' : 'inactive'}`}
                >
                    Membres
                </button>
            </div>

            <form onSubmit={handleSearch} className="max-w-lg mb-8">
                <div className="relative flex items-center">
                    <Search size={18} className="absolute left-4 text-zinc-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                            searchType === 'albums'
                                ? "Que souhaitez-vous écouter ?"
                                : searchType === 'artists'
                                ? "Rechercher un artiste..."
                                : "Rechercher un membre par pseudo..."
                        }
                        className="w-full pl-12 pr-4 py-3 text-sm font-medium"
                    />
                </div>
            </form>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="skeleton h-48 rounded-2xl" />
                    ))}
                </div>
            ) : searchType === 'albums' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {albums.map((album) => (
                        <AlbumCard
                            key={album.id}
                            album={album}
                            onClick={() => onSelectAlbum(album)}
                        />
                    ))}
                </div>
            ) : searchType === 'artists' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {artists.length === 0 ? (
                        <div className="col-span-full neo-empty text-center py-16 flex flex-col items-center gap-3">
                            <Music size={30} className="text-zinc-600" />
                            <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-500">Aucun artiste trouvé.</p>
                        </div>
                    ) : (
                        artists.map((art) => (
                            <div
                                key={art.id}
                                onClick={() => navigate(`/artist/${art.id}`)}
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
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {members.length === 0 ? (
                        <div className="col-span-full neo-empty text-center py-16 flex flex-col items-center gap-3">
                            <Users size={30} className="text-zinc-600" />
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
        </div>
    );
}

export default SearchTab;
