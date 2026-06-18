import { Music } from 'lucide-react';

function AlbumCard({ album, onClick }) {
    return (
        <div 
            onClick={onClick} 
            className="neobrutal-card p-4 cursor-pointer group transition-all duration-300"
        >
            <div className="w-full aspect-square bg-zinc-800 rounded-xl mb-4 shadow-lg overflow-hidden">
                {album.images?.[0] ? (
                    <img src={album.images[0].url} alt={album.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Music size={40} className="text-zinc-650" />
                    </div>
                )}
            </div>
            <h3 className="font-bold text-sm truncate text-white mb-1 group-hover:text-violet-400 transition-colors duration-200">{album.name}</h3>
            <p className="text-xs text-zinc-400 truncate">
                {album.artists.map(a => a.name).join(', ')}
            </p>
        </div>
    );
}

export default AlbumCard;
