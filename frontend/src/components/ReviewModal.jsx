import { Star, X } from 'lucide-react';

function ReviewModal({ 
    selectedAlbum, 
    editingReviewId, 
    reviewContent, 
    setReviewContent, 
    rating, 
    setRating, 
    reviewError, 
    reviewSuccess, 
    onSubmit, 
    onClose 
}) {
    const isEditing = editingReviewId !== null;

    return (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div data-lenis-prevent className="neo-modal w-full max-w-lg relative max-h-[90vh] overflow-y-auto p-7">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl border-2 border-white/20 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition cursor-pointer"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="flex gap-4 items-center mb-6 pb-5 border-b-2 border-white/[0.07]">
                    <img
                        src={selectedAlbum.images?.[0]?.url}
                        alt={selectedAlbum.name}
                        className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.1)]"
                    />
                    <div className="truncate">
                        <h3 className="font-mouse-memoirs uppercase tracking-wide text-xl text-white truncate leading-tight">
                            {isEditing ? "Modifier votre note" : selectedAlbum.name}
                        </h3>
                        <p className="text-sm text-zinc-400 truncate mt-0.5">
                            {isEditing
                                ? `${selectedAlbum.name} — ${selectedAlbum.artists[0]?.name}`
                                : selectedAlbum.artists.map(a => a.name).join(', ')
                            }
                        </p>
                    </div>
                </div>

                {reviewError && (
                    <div className="bg-red-500/10 border-2 border-red-500/50 text-red-300 p-3 mb-4 text-center rounded-2xl text-sm font-semibold">
                        {reviewError}
                    </div>
                )}
                {reviewSuccess && (
                    <div className="bg-violet-500/10 border-2 border-violet-500/50 text-violet-300 p-3 mb-4 text-center rounded-2xl text-sm font-semibold">
                        {reviewSuccess}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="block font-mouse-memoirs uppercase tracking-widest text-fuchsia-400 text-sm mb-2">
                            Votre Note
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    type="button"
                                    key={num}
                                    onClick={() => setRating(num)}
                                    className="hover:scale-125 transition-transform cursor-pointer"
                                >
                                    <Star
                                        size={30}
                                        fill={num <= rating ? "#8B5CF6" : "none"}
                                        className={num <= rating ? "text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.4)]" : "text-zinc-600"}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block font-mouse-memoirs uppercase tracking-widest text-fuchsia-400 text-sm mb-2">
                            Votre Chronique
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={reviewContent}
                            onChange={(e) => setReviewContent(e.target.value)}
                            placeholder="Qu'avez-vous pensé de la production..."
                            className="w-full p-3.5 text-sm resize-none h-32"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="neobrutal-btn px-5 py-2 rounded-full text-sm font-mouse-memoirs uppercase tracking-widest text-zinc-400 hover:text-white border-2 border-zinc-600 hover:border-white"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="neobrutal-btn px-6 py-2 rounded-full text-sm font-mouse-memoirs uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]"
                        >
                            {isEditing ? "Enregistrer" : "Publier"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default ReviewModal;
