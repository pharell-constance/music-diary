import API_URL from '../config.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, Pencil, Calendar, Music, Flag, Heart, MessageSquare, Send, Crown } from 'lucide-react';

function ReviewCard({ review, onEdit, onDelete, onReport, currentUserId, currentUserRole }) {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(() => {
        if (!review.likes || !currentUserId) return false;
        return review.likes.some(l => l.userId === currentUserId);
    });

    const [likesCount, setLikesCount] = useState(review.likes?.length || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentsList, setCommentsList] = useState(review.comments || []);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [loadingArtist, setLoadingArtist] = useState(false);

    const handleArtistClick = async () => {
        if (!review.artistName || loadingArtist) return;
        setLoadingArtist(true);
        try {
            const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(review.artistName)}&type=artist`);
            if (res.ok) {
                const data = await res.json();
                const artist = data.artists?.items?.[0];
                if (artist && artist.id) {
                    navigate(`/artist/${artist.id}`, { state: { artistData: artist } });
                }
            }
        } catch (err) {
            console.error("Error navigating to artist:", err);
        } finally {
            setLoadingArtist(false);
        }
    };

    const handleLikeToggle = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const previouslyLiked = liked;
        setLiked(!liked);
        setLikesCount(prev => previouslyLiked ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`${API_URL}/api/reviews/${review.id}/like`, {
                method: previouslyLiked ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                setLiked(previouslyLiked);
                setLikesCount(prev => previouslyLiked ? prev + 1 : prev - 1);
            }
        } catch (err) {
            console.error("Error toggling like:", err);
            setLiked(previouslyLiked);
            setLikesCount(prev => previouslyLiked ? prev + 1 : prev - 1);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        setLoadingComments(true);
        try {
            const res = await fetch(`${API_URL}/api/reviews/${review.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newComment.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                setCommentsList(prev => [...prev, data.comment]);
                setNewComment('');
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCommentsList(prev => prev.filter(c => c.id !== commentId));
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    return (
        <div className="neobrutal-card bg-[#121214] flex flex-col relative group transition-all duration-300 overflow-hidden">
            <div className="p-5 md:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                {/* ZONE ACTIONS (Modifier / Supprimer / Signaler) */}
                {onEdit && onDelete ? (
                    <div className="absolute top-5 right-5 md:top-6 md:right-6 flex items-center gap-3 md:opacity-0 md:group-hover:opacity-100 transition focus-within:opacity-100 z-10">
                        <button
                            onClick={() => onEdit(review)}
                            className="text-zinc-500 hover:text-violet-400 transition cursor-pointer"
                            title="Modifier cette chronique"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            onClick={() => onDelete(review.id)}
                            className="text-zinc-500 hover:text-red-500 transition cursor-pointer"
                            title="Supprimer cette chronique"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ) : onReport ? (
                    <div className="absolute top-5 right-5 md:top-6 md:right-6 flex items-center gap-3 md:opacity-0 md:group-hover:opacity-100 transition focus-within:opacity-100 z-10">
                        <button
                            onClick={() => onReport(review.id)}
                            className="text-zinc-500 hover:text-red-400 transition cursor-pointer"
                            title="Signaler cette chronique"
                        >
                            <Flag size={14} />
                        </button>
                    </div>
                ) : null}

                {/* Pochette de l'album */}
                <div 
                    onClick={() => navigate(`/song/${review.spotifyAlbumId}`, {
                        state: {
                            songData: {
                                id: review.spotifyAlbumId,
                                name: review.albumName,
                                albumName: review.albumName,
                                albumCover: review.albumCover,
                                album: { cover: review.albumCover, name: review.albumName },
                                artistName: review.artistName,
                                artists: [{ name: review.artistName }]
                            }
                        }
                    })}
                    className="w-24 h-24 md:w-28 md:h-28 bg-white/[0.03] border-2 border-white/15 rounded-xl shadow-[3px_3px_0px_rgba(255,255,255,0.08)] overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 hover:border-violet-400/40 transition-all"
                >
                    {review.albumCover ? (
                        <img src={review.albumCover} alt={review.albumName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Music size={24} className="text-zinc-600" />
                        </div>
                    )}
                </div>

                {/* Infos */}
                <div className="flex flex-col justify-between overflow-hidden pr-0 sm:pr-12 md:pr-14 flex-1 min-w-0 w-full">
                    <div className="space-y-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-400/80 mb-0.5">Album</p>
                            <h3 
                                onClick={() => navigate(`/song/${review.spotifyAlbumId}`, {
                                    state: {
                                        songData: {
                                            id: review.spotifyAlbumId,
                                            name: review.albumName,
                                            albumName: review.albumName,
                                            albumCover: review.albumCover,
                                            album: { cover: review.albumCover, name: review.albumName },
                                            artistName: review.artistName,
                                            artists: [{ name: review.artistName }]
                                        }
                                    }
                                })}
                                className="font-mouse-memoirs uppercase tracking-wide text-base md:text-lg text-white truncate leading-tight cursor-pointer hover:text-violet-400 transition-colors"
                            >
                                {review.albumName}
                            </h3>
                            <p 
                                onClick={handleArtistClick}
                                className={`text-sm truncate mt-0.5 font-medium transition-colors ${
                                    loadingArtist 
                                        ? 'text-violet-400 cursor-wait animate-pulse' 
                                        : 'text-zinc-400 cursor-pointer hover:text-violet-400'
                                }`}
                            >
                                {review.artistName}
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star} 
                                    size={15} 
                                    fill={star <= review.rating ? "#ec4899" : "none"} 
                                    className={star <= review.rating ? "text-pink-500 drop-shadow-[0_0_4px_rgba(236,72,153,0.4)]" : "text-zinc-700"} 
                                />
                            ))}
                            <span className="text-[10px] font-black text-zinc-500 ml-1">{review.rating}/5</span>
                        </div>

                        <blockquote className="border-l-2 border-violet-500/50 pl-3 py-0.5">
                            <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3 font-medium italic">"{review.content}"</p>
                        </blockquote>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-zinc-500">
                        <div className="flex items-center gap-1">
                            <Calendar size={10} />
                            <span>Le {new Date(review.createdAt).toLocaleDateString('fr-fr')}</span>
                        </div>
                        {review.author && (
                            <div className="flex items-center gap-1.5">
                                <span>Par</span>
                                <div 
                                    onClick={() => navigate(`/profile/${review.author.id}`)}
                                    className="w-4 h-4 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-[7px] font-black text-violet-400 cursor-pointer"
                                >
                                    {review.author.avatar ? (
                                        <img src={review.author.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        review.author.pseudo.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <span 
                                    onClick={() => navigate(`/profile/${review.author.id}`)}
                                    className="font-bold text-zinc-300 hover:text-violet-400 transition-colors cursor-pointer"
                                >
                                    {review.author.pseudo}
                                </span>
                                {review.author.role === 'OWNER' && (
                                    <span className="text-[7.5px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 inline-flex items-center gap-0.5" title="Propriétaire">
                                        <Crown size={8} className="text-yellow-450" />
                                        <span>Owner</span>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* Social Interactions Bar */}
            <div className="flex items-center gap-6 px-5 md:px-6 py-3 border-t-2 border-white/[0.06] bg-black/20 text-xs text-zinc-400 select-none">
                <button 
                    onClick={handleLikeToggle}
                    className={`flex items-center gap-1.5 cursor-pointer transition-colors ${liked ? 'text-red-500' : 'hover:text-red-400'}`}
                >
                    <Heart size={15} fill={liked ? "currentColor" : "none"} className={liked ? 'scale-110' : ''} />
                    <span className="font-bold">{likesCount}</span>
                </button>
                <button 
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-1.5 cursor-pointer transition-colors hover:text-violet-400 ${showComments ? 'text-violet-400' : ''}`}
                >
                    <MessageSquare size={15} />
                    <span className="font-bold">{commentsList.length}</span>
                </button>
            </div>

            {/* Comments Drawer */}
            {showComments && (
                <div className="px-5 md:px-6 pb-5 md:pb-6 pt-3 border-t border-white/[0.05] flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Commentaires ({commentsList.length})</h4>
                    
                    <div data-lenis-prevent className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {commentsList.length === 0 ? (
                            <p className="text-zinc-500 text-xs italic">Aucun commentaire pour le moment.</p>
                        ) : (
                            commentsList.map((c) => (
                                <div key={c.id} className="bg-black/20 p-2.5 rounded border border-white/[0.05] flex justify-between items-start gap-2 text-xs">
                                    <div className="flex gap-2">
                                        <div 
                                            onClick={() => navigate(`/profile/${c.user.id}`)}
                                            className="w-5 h-5 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-[9px] text-violet-400 cursor-pointer flex-shrink-0"
                                        >
                                            {c.user.avatar ? (
                                                <img src={c.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                c.user.pseudo.substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span 
                                                    onClick={() => navigate(`/profile/${c.user.id}`)}
                                                    className="font-bold text-zinc-300 hover:text-violet-400 transition-colors cursor-pointer"
                                                >
                                                    {c.user.pseudo}
                                                </span>
                                                {c.user.role === 'OWNER' && (
                                                    <span className="text-[7px] tracking-wider uppercase font-black px-1 py-0.2 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 inline-flex items-center gap-0.5" title="Propriétaire">
                                                        <Crown size={7} className="text-yellow-450" />
                                                        <span>Owner</span>
                                                    </span>
                                                )}
                                                <span className="text-[9px] text-zinc-500">
                                                    Le {new Date(c.createdAt).toLocaleDateString('fr-fr')}
                                                </span>
                                            </div>
                                            <p className="text-zinc-200 mt-0.5 break-words font-medium">{c.content}</p>
                                        </div>
                                    </div>
                                    
                                    {(c.userId === currentUserId || currentUserRole === 'ADMIN') && (
                                        <button 
                                            onClick={() => handleDeleteComment(c.id)}
                                            className="text-zinc-500 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                                            title="Supprimer le commentaire"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2 mt-1">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Ajouter un commentaire..."
                            className="flex-1 bg-white/[0.03] border border-white/[0.08] hover:border-white/20 focus:border-violet-500/50 px-3 py-2 rounded-xl text-xs text-white outline-none transition font-medium"
                        />
                        <button
                            type="submit"
                            disabled={loadingComments || !newComment.trim()}
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white disabled:bg-zinc-800/50 disabled:text-zinc-500 p-2 rounded-xl transition cursor-pointer flex-shrink-0"
                        >
                            <Send size={12} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ReviewCard;
