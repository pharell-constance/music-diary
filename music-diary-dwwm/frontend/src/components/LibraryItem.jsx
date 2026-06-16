import { Music } from 'lucide-react';

function LibraryItem({ album, review, onClick }) {
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
            <p className="text-xs text-[#A7A7A7] truncate mb-2">
                {album.artists.map(a => a.name).join(', ')}
            </p>
            {review && (
                <p className="text-xs text-zinc-400 truncate">"{review.content?.slice(0,80)}{review.content && review.content.length > 80 ? '...' : ''}"</p>
            )}
            {review && (
                <div className="mt-2 text-xs text-[#A7A7A7]">Note: {review.rating}/5</div>
            )}
        </div>
    );
}

export default LibraryItem;
