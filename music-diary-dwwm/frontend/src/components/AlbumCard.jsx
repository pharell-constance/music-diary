import { Music } from 'lucide-react';

function AlbumCard({ album, onClick }) {
    return (
        <div 
            onClick={onClick} 
            className="bg-[#1a1824] hover:bg-[#282828] p-4 rounded-md transition duration-200 cursor-pointer group"
        >
            <div className="w-full aspect-square bg-zinc-800 rounded-md mb-4 shadow-lg overflow-hidden">
                {album.images?.[0] ? (
                    <img src={album.images[0].url} alt={album.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Music size={40} className="text-zinc-600" />
                    </div>
                )}
            </div>
            <h3 className="font-bold text-sm truncate text-white mb-1">{album.name}</h3>
            <p className="text-xs text-[#A7A7A7] truncate">
                {album.artists.map(a => a.name).join(', ')}
            </p>
        </div>
    );
}

export default AlbumCard;
