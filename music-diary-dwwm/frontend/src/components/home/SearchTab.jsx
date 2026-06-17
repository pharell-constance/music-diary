import { useNavigate } from 'react-router-dom';
import { Search, Music } from 'lucide-react';
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
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight mb-6">Rechercher</h1>
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => handleSwitchSearchType('albums')}
                        className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                            searchType === 'albums'
                                ? 'bg-white text-black shadow-md'
                                : 'bg-[#1a1824] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                        }`}
                    >
                        Albums
                    </button>
                    <button
                        onClick={() => handleSwitchSearchType('artists')}
                        className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                            searchType === 'artists'
                                ? 'bg-white text-black shadow-md'
                                : 'bg-[#1a1824] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                        }`}
                    >
                        Artistes
                    </button>
                    <button
                        onClick={() => handleSwitchSearchType('members')}
                        className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                            searchType === 'members'
                                ? 'bg-white text-black shadow-md'
                                : 'bg-[#1a1824] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                        }`}
                    >
                        Membres
                    </button>
                </div>
                <form onSubmit={handleSearch} className="max-w-md">
                    <div className="relative flex items-center">
                        <Search size={20} className="absolute left-4 text-zinc-400" />
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder={
                                searchType === 'albums' 
                                    ? "Que souhaitez-vous écouter ?" 
                                    : searchType === 'artists'
                                    ? "Rechercher un artiste..."
                                    : "Rechercher un membre par pseudo ou email..."
                            } 
                            className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 pl-12 pr-4 py-3 rounded-full text-sm font-medium outline-none text-white transition" 
                        />
                    </div>
                </form>
            </header>

            {loading ? (
                <p className="text-zinc-400">Recherche...</p>
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
                        <p className="text-zinc-500 text-sm">Aucun artiste trouvé.</p>
                    ) : (
                        artists.map((art) => (
                            <div 
                                key={art.id} 
                                onClick={() => navigate(`/artist/${art.id}`)}
                                className="bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-violet-500/20 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col items-center text-center shadow-md"
                            >
                                <div className="w-24 h-24 rounded-full bg-zinc-800 shadow-lg flex items-center justify-center font-black text-2xl text-white border-2 border-zinc-800 group-hover:border-violet-500/40 transition-colors duration-300 overflow-hidden mb-3">
                                    {art.images?.[0]?.url ? (
                                        <img src={art.images[0].url} alt={art.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Music size={32} className="text-zinc-500" />
                                    )}
                                </div>
                                <div className="text-sm font-bold text-white truncate w-full group-hover:text-violet-400 transition-colors duration-300">
                                    {art.name}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">
                                    Artiste Spotify
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {members.length === 0 ? (
                        <p className="text-zinc-500 text-sm">Aucun membre trouvé.</p>
                    ) : (
                        members.map((member) => (
                            <div 
                                key={member.id} 
                                onClick={() => navigate(`/profile/${member.id}`)}
                                className="bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-violet-500/20 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col items-center text-center shadow-md"
                            >
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg flex items-center justify-center font-black text-2xl text-white border-2 border-zinc-800 group-hover:border-violet-500/40 transition-colors duration-300 overflow-hidden mb-3">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.pseudo} className="w-full h-full object-cover" />
                                    ) : (
                                        member.pseudo.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div className="text-sm font-bold text-white truncate w-full group-hover:text-violet-400 transition-colors duration-300">
                                    {member.pseudo}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">
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
