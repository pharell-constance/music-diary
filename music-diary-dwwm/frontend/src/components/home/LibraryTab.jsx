import { Music } from 'lucide-react';
import LibraryGrid from '../LibraryGrid';

function LibraryTab({ myReviews, onEditReview }) {
    return (
        <div>
            <div className="page-header">
                <h1 className="text-4xl md:text-5xl font-mouse-memoirs uppercase tracking-wide text-white text-stroke-dark">
                    Ma Bibliothèque
                </h1>
                <p className="text-zinc-400 mt-1 font-medium">Albums que vous avez chroniqués.</p>
            </div>

            {myReviews.length === 0 ? (
                <div className="neo-empty text-center py-16 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border-2 border-violet-500/30 flex items-center justify-center">
                        <Music size={26} className="text-violet-400" />
                    </div>
                    <p className="font-mouse-memoirs uppercase tracking-wider text-zinc-400 text-lg">Votre bibliothèque est vide.</p>
                    <p className="text-zinc-600 text-xs">Cherchez un album et rédigez votre première chronique !</p>
                </div>
            ) : (
                <LibraryGrid reviews={myReviews} onItemClick={onEditReview} />
            )}
        </div>
    );
}

export default LibraryTab;
