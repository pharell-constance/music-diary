import API_URL from '../config.js';
import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Disc, Music, Star, Calendar, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import Sidebar from '../components/Sidebar';
import ReviewCard from '../components/ReviewCard';
import NeobrutalLoader from '../components/NeobrutalLoader';

function SongPage() {
    const { songId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    
    // User info
    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    // States
    const [song, setSong] = useState(null);
    const [lyrics, setLyrics] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Audio Player
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Rating Form States
    const [rating, setRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);

    // GSAP refs
    const bannerRef = useRef(null);
    const lyricsColRef = useRef(null);
    const reviewColRef = useRef(null);

    // Fetch Song details, lyrics, and reviews
    useEffect(() => {
        if (!songId) return;
        let cancelled = false;

        async function fetchLyricsAndReviews() {
            try {
                const sd = location.state?.songData;
                const artistName = sd?.artists?.[0]?.name || sd?.artistName || "";
                const trackName = sd?.name || "";
                
                const lyricsRes = await fetch(`${API_URL}/api/songs/${songId}/lyrics?artistName=${encodeURIComponent(artistName)}&trackName=${encodeURIComponent(trackName)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (lyricsRes.ok && !cancelled) {
                    const lyricsData = await lyricsRes.json();
                    setLyrics(lyricsData.lyrics);
                }

                const reviewsRes = await fetch(`${API_URL}/api/songs/${songId}/reviews`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewsRes.ok && !cancelled) {
                    const reviewsData = await reviewsRes.json();
                    setReviews(reviewsData);
                }
            } catch (e) {
                console.error("Erreur de chargement d'arrière-plan :", e);
            }
        }

        async function fetchSongData() {
            setLoading(true);
            setError('');

            // 1. Tenter d'utiliser les données transmises par la navigation (state)
            if (location.state?.songData) {
                const sd = location.state.songData;
                const formattedSong = {
                    id: sd.id,
                    name: sd.name,
                    durationMs: sd.duration_ms || sd.durationMs || 0,
                    previewUrl: sd.preview_url || sd.previewUrl || null,
                    isAlbum: sd.isAlbum || false,
                    album: {
                        id: sd.album?.id || "",
                        name: sd.album?.name || sd.albumName || "",
                        cover: sd.album?.images?.[0]?.url || sd.album?.cover || sd.albumCover || "",
                        releaseDate: sd.album?.release_date || sd.album?.releaseDate || null
                    },
                    artists: sd.artists?.map(art => ({
                        id: art.id || "",
                        name: art.name
                    })) || [{ id: "", name: sd.artistName || "" }]
                };
                setSong(formattedSong);
                setLoading(false);
                fetchLyricsAndReviews();
                return;
            }

            try {
                // Fetch song details
                let songData = null;
                const songRes = await fetch(`${API_URL}/api/songs/${songId}/details`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (songRes.ok) {
                    songData = await songRes.json();
                } else {
                    // Si l'API échoue, on tente de récupérer les critiques locales pour reconstruire les métadonnées
                    const reviewsRes = await fetch(`${API_URL}/api/songs/${songId}/reviews`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (reviewsRes.ok) {
                        const reviewsData = await reviewsRes.json();
                        setReviews(reviewsData);
                        if (reviewsData.length > 0) {
                            const first = reviewsData[0];
                            songData = {
                                id: songId,
                                name: first.albumName,
                                isAlbum: false,
                                album: { cover: first.albumCover },
                                artists: [{ name: first.artistName }]
                            };
                        }
                    }
                    
                    if (!songData) {
                        const errData = await songRes.json().catch(() => ({}));
                        throw new Error(errData.error || `Erreur ${songRes.status} : Impossible de charger la chanson`);
                    }
                }
                
                if (cancelled) return;
                setSong(songData);

                // Fetch lyrics
                const artistName = songData?.artists?.[0]?.name || "";
                const trackName = songData?.name || "";
                const lyricsRes = await fetch(`${API_URL}/api/songs/${songId}/lyrics?artistName=${encodeURIComponent(artistName)}&trackName=${encodeURIComponent(trackName)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (lyricsRes.ok) {
                    const lyricsData = await lyricsRes.json();
                    setLyrics(lyricsData.lyrics);
                }

                // Charger les avis s'ils ne l'ont pas été
                if (reviews.length === 0) {
                    const reviewsRes = await fetch(`${API_URL}/api/songs/${songId}/reviews`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (reviewsRes.ok) {
                        const reviewsData = await reviewsRes.json();
                        setReviews(reviewsData);
                    }
                }

                setLoading(false);
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Erreur lors du chargement des données');
                    setLoading(false);
                }
            }
        }

        fetchSongData();
        return () => { 
            cancelled = true; 
            if (audioRef.current) {
                audioRef.current.pause();
            }
            window.spotifyIsPlaying = false;
            window.dispatchEvent(new CustomEvent('spotify-pause'));
        };
    }, [songId, token, location.state]);

    // GSAP animations
    useLayoutEffect(() => {
        if (!song || loading) return;

        const ctx = gsap.context(() => {
            if (bannerRef.current) {
                gsap.fromTo(bannerRef.current,
                    { opacity: 0, y: -20 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
                );
            }
            if (lyricsColRef.current) {
                gsap.fromTo(lyricsColRef.current,
                    { opacity: 0, x: -30 },
                    { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
                );
            }
            if (reviewColRef.current) {
                gsap.fromTo(reviewColRef.current,
                    { opacity: 0, x: 30 },
                    { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
                );
            }
        });

        return () => ctx.revert();
    }, [song, loading]);

    // Toggle Preview Playback
    const togglePlayback = () => {
        if (!song?.previewUrl) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(song.previewUrl);
            audioRef.current.volume = 0.4;
            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
                window.dispatchEvent(new CustomEvent('spotify-pause'));
            });
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            window.dispatchEvent(new CustomEvent('spotify-pause'));
        } else {
            audioRef.current.play().catch(err => console.error("Audio playback error:", err));
            setIsPlaying(true);
            window.dispatchEvent(new CustomEvent('spotify-play', {
                detail: {
                    id: song.id,
                    name: song.name,
                    artist: song.artists?.map(a => a.name).join(', ') || '',
                    cover: song.album?.cover || ''
                }
            }));
        }
    };

    // Submit Review Form (Create or Edit)
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setReviewError('');
        setReviewSuccess('');

        const isEditing = editingReviewId !== null;
        const url = isEditing
            ? `${API_URL}/api/reviews/${editingReviewId}`
            : `${API_URL}/api/reviews`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: reviewContent,
                    rating: rating,
                    spotifyAlbumId: song.id,
                    albumName: song.name,
                    artistName: song.artists?.map(a => a.name).join(', ') || '',
                    albumCover: song.album?.cover || ''
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Erreur lors de l'enregistrement");
            }

            setReviewSuccess(isEditing ? "Avis modifié !" : "Avis publié !");
            
            // Reload reviews
            const reviewsRes = await fetch(`${API_URL}/api/songs/${songId}/reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setReviews(reviewsData);
            }

            setTimeout(() => {
                setReviewContent('');
                setRating(5);
                setEditingReviewId(null);
                setReviewSuccess('');
            }, 1500);

        } catch (err) {
            setReviewError(err.message);
        }
    };

    // Edit Click Handler
    const handleEditClick = (review) => {
        setEditingReviewId(review.id);
        setReviewContent(review.content);
        setRating(review.rating);
        // Scroll slightly to the review form
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    // Delete Review Handler
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cet avis ?")) return;

        try {
            const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setReviews(reviews.filter(r => r.id !== reviewId));
            }
        } catch (err) {
            console.error("Error deleting review:", err);
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <NeobrutalLoader isLoading={loading} />
            <Sidebar
                user={user}
                currentTab="search"
                setCurrentTab={(tab) => navigate('/', { state: { tab } })}
                handleLogout={() => { localStorage.clear(); navigate('/login'); }}
            />

            <div className="song-page-content flex-1 bg-[#12101b] md:my-2 md:mr-2 md:rounded-lg no-scrollbar flex flex-col pb-24 md:pb-8 p-4 md:p-8">
                {/* Loading */}
                {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Disc size={52} className="text-violet-500 animate-spin" style={{ animationDuration: '2.5s' }} />
                        <p className="text-zinc-400 font-semibold text-sm tracking-wide">Chargement de la musique...</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <Music size={48} className="text-zinc-700" />
                        <p className="text-zinc-400 font-semibold">{error}</p>
                        <button onClick={() => navigate(-1)} className="text-violet-400 hover:text-violet-300 text-sm font-bold transition cursor-pointer bg-transparent border-none p-0">
                            ← Retour
                        </button>
                    </div>
                )}

                {/* Content */}
                {!loading && song && (
                    <div className="space-y-6">
                        {/* ── Header / Back ── */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-white/20 hover:border-white text-zinc-300 hover:text-white transition duration-200 text-sm font-bold bg-[#1a1824]"
                            >
                                <ArrowLeft size={16} /> Retour
                            </button>

                            <a
                                href={`https://open.spotify.com/track/${song.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-violet-400 transition-colors font-semibold"
                            >
                                Ouvrir sur Spotify <ExternalLink size={12} />
                            </a>
                        </div>

                        {/* ── Banner / Hero ── */}
                        <div 
                            ref={bannerRef}
                            className="relative overflow-hidden rounded-3xl border-2 border-white bg-gradient-to-r from-violet-900/40 to-fuchsia-950/40 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center shadow-[6px_6px_0px_rgba(255,255,255,0.1)]"
                        >
                            <div className="w-40 h-40 bg-zinc-800 rounded-2xl border-2 border-white overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center">
                                {song.album?.cover ? (
                                    <img src={song.album.cover} alt={song.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Disc size={64} className="text-zinc-650 animate-spin-slow" />
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left min-w-0">
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-wide text-stroke-dark mb-2">
                                    {song.name}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                                    {song.artists?.map((artist, idx) => (
                                        <span 
                                            key={artist.id}
                                            onClick={() => navigate(`/artist/${artist.id}`)}
                                            className="text-lg font-bold text-violet-400 hover:text-violet-300 cursor-pointer transition"
                                        >
                                            {artist.name}{idx < song.artists.length - 1 ? ',' : ''}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1.5 text-xs text-zinc-400">
                                    {song.isAlbum ? (
                                        <span>Type : <span className="text-white font-semibold">Album</span></span>
                                    ) : song.album?.name && (
                                        <span>Album : <span className="text-white font-semibold">{song.album.name}</span></span>
                                    )}
                                    {song.album?.releaseDate && (
                                        <span>Sortie : <span className="text-white font-semibold">{new Date(song.album.releaseDate).getFullYear()}</span></span>
                                    )}
                                    {!song.isAlbum && song.durationMs && (
                                        <span>Durée : <span className="text-white font-semibold">
                                            {Math.floor(song.durationMs / 60000)}:
                                            {String(Math.floor((song.durationMs % 60000) / 1000)).padStart(2, '0')}
                                        </span></span>
                                    )}
                                </div>
                            </div>

                            {/* Play Preview Button */}
                            {song.previewUrl && (
                                <button
                                    onClick={togglePlayback}
                                    className="neobrutal-btn w-16 h-16 rounded-full bg-violet-500 hover:bg-violet-400 text-black flex items-center justify-center cursor-pointer transition shadow-lg shrink-0"
                                >
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                </button>
                            )}
                        </div>

                        {/* ── Two Column Content ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            
                            {/* ── Left Column: Lyrics or Album Tracklist ── */}
                            <div ref={lyricsColRef} className="lg:col-span-7 space-y-4">
                                <h3 className="font-mouse-memoirs uppercase tracking-widest text-xl text-fuchsia-400">
                                    {song.isAlbum ? "Pistes de l'album" : "Paroles"}
                                </h3>

                                <div className="neobrutal-card p-6 md:p-8 bg-black/40">
                                    {song.isAlbum ? (
                                        <div className="divide-y divide-zinc-800/40">
                                            {song.tracks?.length > 0 ? (
                                                song.tracks.map((track, idx) => (
                                                    <div 
                                                        key={track.id}
                                                        onClick={() => navigate(`/song/${track.id}`, {
                                                             state: {
                                                                songData: {
                                                                    id: track.id,
                                                                    name: track.name,
                                                                    albumName: song.name,
                                                                    albumCover: song.album?.cover || "",
                                                                    album: { cover: song.album?.cover || "", name: song.name },
                                                                    artistName: song.artists?.map(a => a.name).join(', ') || "",
                                                                    artists: song.artists,
                                                                    durationMs: track.durationMs,
                                                                    previewUrl: track.previewUrl
                                                                }
                                                             }
                                                         })}
                                                        className="flex items-center justify-between py-3 hover:bg-zinc-800/30 px-3 rounded-xl transition duration-150 cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-bold text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">
                                                                {track.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-zinc-500 font-semibold">
                                                            {Math.floor(track.durationMs / 60000)}:
                                                            {String(Math.floor((track.durationMs % 60000) / 1000)).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-zinc-500 text-xs italic text-center py-8">Aucune piste répertoriée.</p>
                                            )}
                                        </div>
                                    ) : lyrics ? (
                                        <div className="space-y-3 leading-relaxed font-sans text-sm md:text-base text-zinc-300">
                                            {lyrics.split('\n').map((line, i) => (
                                                <p 
                                                    key={i} 
                                                    className="hover:text-white transition-colors duration-150 py-0.5 border-l-2 border-transparent hover:border-violet-500 hover:pl-2"
                                                >
                                                    {line || <span className="opacity-0">-</span>}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 gap-3">
                                            <Music size={32} />
                                            <p className="font-semibold text-sm">Aucune parole trouvée pour cette chanson.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Right Column: Reviews & Form ── */}
                            <div ref={reviewColRef} className="lg:col-span-5 space-y-6">
                                
                                {/* Rating/Review Form */}
                                <div className="neobrutal-card p-6 bg-[#1a1824]/70">
                                    <h3 className="font-mouse-memoirs uppercase tracking-widest text-lg text-fuchsia-400 mb-4">
                                        {editingReviewId ? "Modifier votre avis" : (song.isAlbum ? "Noter cet album" : "Noter ce morceau")}
                                    </h3>

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

                                    <form onSubmit={handleSubmitReview} className="space-y-4">
                                        {/* Stars selection */}
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">Note</label>
                                            <div className="flex items-center gap-1.5">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <button
                                                        type="button"
                                                        key={num}
                                                        onClick={() => setRating(num)}
                                                        className="hover:scale-110 transition cursor-pointer"
                                                    >
                                                        <Star
                                                            size={26}
                                                            fill={num <= rating ? "#8B5CF6" : "none"}
                                                            className={num <= rating ? "text-violet-400 drop-shadow-[0_0_4px_rgba(139,92,246,0.35)]" : "text-zinc-700"}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Comment input */}
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">Votre avis</label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={reviewContent}
                                                onChange={(e) => setReviewContent(e.target.value)}
                                                placeholder="Qu'avez-vous pensé de cette musique..."
                                                className="w-full text-sm resize-none h-24"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-1">
                                            {editingReviewId && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingReviewId(null);
                                                        setReviewContent('');
                                                        setRating(5);
                                                    }}
                                                    className="px-4 py-1.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition text-xs font-semibold"
                                                >
                                                    Annuler
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                className="neobrutal-btn px-5 py-1.5 text-xs font-mouse-memoirs uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white border-2 border-white"
                                            >
                                                {editingReviewId ? "Enregistrer" : "Publier l'avis"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Community reviews */}
                                <div className="space-y-4">
                                    <h3 className="font-mouse-memoirs uppercase tracking-widest text-lg text-fuchsia-400">
                                        Avis de la communauté ({reviews.length})
                                    </h3>

                                    <div data-lenis-prevent className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                                        {reviews.length === 0 ? (
                                            <div className="neo-empty p-8 text-center text-zinc-500 text-xs italic">
                                                Aucun avis sur ce morceau pour le moment. Soyez le premier !
                                            </div>
                                        ) : (
                                            reviews.map((rev) => (
                                                <ReviewCard
                                                    key={rev.id}
                                                    review={rev}
                                                    onEdit={rev.authorId === user?.id ? handleEditClick : null}
                                                    onDelete={rev.authorId === user?.id || user?.role === 'ADMIN' ? handleDeleteReview : null}
                                                    currentUserId={user?.id}
                                                    currentUserRole={user?.role}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

export default SongPage;
