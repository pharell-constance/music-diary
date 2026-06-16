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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#1a1824] border border-zinc-800 p-6 rounded-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                    <X size={20} />
                </button>

                <div className="flex gap-4 items-center mb-6 border-b border-zinc-800 pb-4">
                    <img 
                        src={selectedAlbum.images?.[0]?.url} 
                        alt={selectedAlbum.name} 
                        className="w-16 h-16 object-cover rounded shadow-md" 
                    />
                    <div className="truncate">
                        <h3 className="font-extrabold text-lg text-white truncate">
                            {isEditing ? "Modifier votre note" : selectedAlbum.name}
                        </h3>
                        <p className="text-sm text-[#A7A7A7] truncate">
                            {isEditing 
                                ? `${selectedAlbum.name} — ${selectedAlbum.artists[0]?.name}` 
                                : selectedAlbum.artists.map(a => a.name).join(', ')
                            }
                        </p>
                    </div>
                </div>

                {reviewError && (
                    <div className="bg-red-950/50 text-red-400 p-3 mb-4 text-center rounded text-sm font-semibold">
                        {reviewError}
                    </div>
                )}
                {reviewSuccess && (
                    <div className="bg-emerald-950/50 text-emerald-400 p-3 mb-4 text-center rounded text-sm font-semibold">
                        {reviewSuccess}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Votre Note</label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button 
                                    type="button" 
                                    key={num} 
                                    onClick={() => setRating(num)} 
                                    className="text-zinc-500 hover:scale-110 transition"
                                >
                                    <Star 
                                        size={28} 
                                        fill={num <= rating ? "#8B5CF6" : "none"} 
                                        className={num <= rating ? "text-[#8B5CF6]" : "text-zinc-500"} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Votre Chronique</label>
                        <textarea 
                            required 
                            rows={4} 
                            value={reviewContent} 
                            onChange={(e) => setReviewContent(e.target.value)} 
                            placeholder="Qu'avez-vous pensé de la production..." 
                            className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-sm text-white outline-none h-32 resize-none" 
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="text-[#A7A7A7] hover:text-white font-bold py-2 px-4 rounded-full text-sm"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className="bg-[#8B5CF6] hover:bg-[#A78BFA] text-black font-bold py-2 px-6 rounded-full text-sm"
                        >
                            {isEditing ? "Enregistrer les modifications" : "Publier la note"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default ReviewModal;
