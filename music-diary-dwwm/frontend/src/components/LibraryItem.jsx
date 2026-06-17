import { Music } from 'lucide-react';

function LibraryItem({ album, review, onClick }) {
    return (
        <div 
            onClick={onClick} 
            className="bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-violet-500/20 p-4 rounded-2xl transition-all duration-300 cursor-pointer group shadow-md hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/5"
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
            <p className="text-xs text-zinc-400 truncate mb-2">
                {album.artists.map(a => a.name).join(', ')}
            </p>
            {review && (
                <p className="text-xs text-zinc-500 truncate italic">"{review.content?.slice(0,80)}{review.content && review.content.length > 80 ? '...' : ''}"</p>
            )}
            {review && (
                <div className="mt-2 text-xs text-zinc-400 font-semibold">Note: {review.rating}/5</div>
            )}
        </div>
    );
}

export default LibraryItem;
