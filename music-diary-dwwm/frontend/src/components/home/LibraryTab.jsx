import { Music } from 'lucide-react';
import LibraryGrid from '../LibraryGrid';

function LibraryTab({ myReviews, onEditReview }) {
    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Ma Bibliothèque</h1>
                <p className="text-[#A7A7A7]">Albums que vous avez chroniqués.</p>
            </header>

            {myReviews.length === 0 ? (
                <div className="text-center py-12 bg-[#1a1824] rounded-md border border-zinc-800/50">
                    <Music size={40} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-sm">Votre bibliothèque est vide.</p>
                </div>
            ) : (
                <LibraryGrid reviews={myReviews} onItemClick={onEditReview} />
            )}
        </div>
    );
}

export default LibraryTab;
