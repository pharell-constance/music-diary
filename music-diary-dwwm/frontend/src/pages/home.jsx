import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Music, Flame, Play, Pause, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ReviewCard from '../components/ReviewCard';
import AlbumCard from '../components/AlbumCard';
import LibraryGrid from '../components/LibraryGrid';
import ReviewModal from '../components/ReviewModal';
import ConfirmModal from '../components/ConfirmModal';
import NotificationsTab from '../components/NotificationsTab';
import LandingPage from './landing';

function Home() {
    const [user] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const location = useLocation();
    const [currentTab, setCurrentTab] = useState(() => {
        return location.state?.tab || 'home';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [albums, setAlbums] = useState([]);
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState('albums');
    const [members, setMembers] = useState([]);

    const [myReviews, setMyReviews] = useState([]);
    const [socialFeed, setSocialFeed] = useState([]);
    const [homeSubTab, setHomeSubTab] = useState('my-journal');
    const [loadingSocialFeed, setLoadingSocialFeed] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [reviewContent, setReviewContent] = useState('');
    const [rating, setRating] = useState(5);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [confirmModalData, setConfirmModalData] = useState(null);

    // ── Tendances
    const [trending, setTrending] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(false);
    const [trendingLimit, setTrendingLimit] = useState(20);
    const [playingPreview, setPlayingPreview] = useState(null);
    const audioRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.tab) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentTab(location.state.tab);
        }
    }, [location.state]);

    useEffect(() => {
        fetchMyReviews();
    }, []);

    useEffect(() => {
        if (homeSubTab === 'social-feed') fetchSocialFeed();
        if (homeSubTab === 'trending') fetchTrending(trendingLimit);
    }, [homeSubTab]);

    useEffect(() => {
        if (homeSubTab === 'trending') fetchTrending(trendingLimit);
    }, [trendingLimit]);

    async function fetchSocialFeed() {
        const token = localStorage.getItem('token');
        setLoadingSocialFeed(true);
        try {
            const response = await fetch('http://127.0.0.1:5001/api/social/feed', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setSocialFeed(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSocialFeed(false);
        }
    }

    async function fetchTrending(limit = 20) {
        setLoadingTrending(true);
        try {
            const res = await fetch(`http://127.0.0.1:5001/api/spotify/trending?limit=${limit}`);
            const data = await res.json();
            if (res.ok) setTrending(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTrending(false);
        }
    }

    function formatDuration(ms) {
        if (!ms) return '';
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function togglePreview(track) {
        if (!track.previewUrl) return;
        if (playingPreview === track.id) {
            audioRef.current?.pause();
            setPlayingPreview(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = track.previewUrl;
                audioRef.current.play();
            }
            setPlayingPreview(track.id);
        }
    }

    async function fetchMyReviews() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:5001/api/reviews', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setMyReviews(data);
        } catch (error) {
            console.error(error);
        }
    }

    const handleEditClick = (review) => {
        setEditingReviewId(review.id);
        setReviewContent(review.content);
        setRating(review.rating);
        setSelectedAlbum({
            id: review.spotifyAlbumId,
            name: review.albumName,
            artists: [{ name: review.artistName }],
            images: [{ url: review.albumCover }]
        });
    };

    const handleDeleteReview = (reviewId) => {
        setConfirmModalData({
            title: "Supprimer la critique",
            message: "Voulez-vous vraiment supprimer cette critique ? Cette action est irréversible et le contenu sera retiré définitivement.",
            type: "danger",
            confirmText: "Supprimer",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                try {
                    const response = await fetch(`http://127.0.0.1:5001/api/reviews/${reviewId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) setMyReviews(myReviews.filter(r => r.id !== reviewId));
                } catch (error) {
                    console.error(error);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    const triggerSearch = async (query, type) => {
        if (!query.trim()) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            if (type === 'albums') {
                const response = await fetch(`http://127.0.0.1:5001/api/search?q=${encodeURIComponent(query)}&type=album`);
                const data = await response.json();
                if (data.albums?.items) setAlbums(data.albums.items);
            } else if (type === 'artists') {
                const response = await fetch(`http://127.0.0.1:5001/api/search?q=${encodeURIComponent(query)}&type=artist`);
                const data = await response.json();
                if (data.artists?.items) setArtists(data.artists.items);
            } else {
                const response = await fetch(`http://127.0.0.1:5001/api/users/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) setMembers(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        triggerSearch(searchQuery, searchType);
    };

    const handleSwitchSearchType = (type) => {
        setSearchType(type);
        if (searchQuery.trim()) {
            triggerSearch(searchQuery, type);
        } else {
            setAlbums([]);
            setArtists([]);
            setMembers([]);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setReviewError('');
        setReviewSuccess('');
        const token = localStorage.getItem('token');

        const isEditing = editingReviewId !== null;
        const url = isEditing
            ? `http://127.0.0.1:5001/api/reviews/${editingReviewId}`
            : 'http://127.0.0.1:5001/api/reviews';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: reviewContent,
                    rating: rating,
                    spotifyAlbumId: selectedAlbum.id,
                    albumName: selectedAlbum.name,
                    artistName: selectedAlbum.artists.map(a => a.name).join(', '),
                    albumCover: selectedAlbum.images?.[0]?.url || ""
                })
            });

            if (!response.ok) throw new Error("Erreur lors de l'enregistrement");

            setReviewSuccess(isEditing ? "Chronique modifiée !" : "Chronique enregistrée !");
            fetchMyReviews();

            setTimeout(() => {
                setSelectedAlbum(null);
                setReviewContent('');
                setRating(5);
                setEditingReviewId(null);
                setReviewSuccess('');
            }, 1500);
        } catch (err) {
            setReviewError(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const token = localStorage.getItem('token');
    if (!token) {
        return <LandingPage />;
    }

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            
            {/* Barre latérale */}
            <Sidebar 
                user={user} 
                currentTab={currentTab} 
                setCurrentTab={setCurrentTab} 
                handleLogout={handleLogout} 
            />

            {/* Zone centrale */}
            <div className="flex-1 bg-[#12101b] my-2 mr-2 rounded-lg p-6 overflow-y-auto">
                
                {/* Vue Accueil */}
                {currentTab === 'home' && (
                    <div>
                        <header className="mb-6">
                            <h1 className="text-3xl font-extrabold tracking-tight">Mon Journal de Bord</h1>
                            <p className="text-[#A7A7A7] mt-1">Vos albums analysés et notés.</p>
                        </header>

                        {/* Navigation des sous-onglets */}
                        <div className="flex gap-6 border-b border-zinc-800/40 pb-2 mb-6 overflow-x-auto">
                            <button
                                onClick={() => setHomeSubTab('my-journal')}
                                className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                    homeSubTab === 'my-journal'
                                        ? 'border-emerald-500 text-white'
                                        : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                            >
                                Mon Journal
                            </button>
                            <button
                                onClick={() => setHomeSubTab('social-feed')}
                                className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                                    homeSubTab === 'social-feed'
                                        ? 'border-emerald-500 text-white'
                                        : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                            >
                                Fil d'activité
                            </button>
                            <button
                                onClick={() => setHomeSubTab('trending')}
                                className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                    homeSubTab === 'trending'
                                        ? 'border-emerald-500 text-white'
                                        : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                            >
                                <Flame size={14} className={homeSubTab === 'trending' ? 'text-orange-400' : ''} />
                                Tendances
                            </button>
                        </div>

                        {homeSubTab === 'my-journal' ? (
                            <div className="mt-4">
                                {myReviews.length === 0 ? (
                                    <div className="text-center py-12 bg-[#1a1824] rounded-md border border-zinc-800/50">
                                        <Music size={40} className="mx-auto text-zinc-600 mb-3" />
                                        <p className="text-zinc-400 text-sm">Aucune critique pour le moment.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {myReviews.map((review) => (
                                            <ReviewCard 
                                                key={review.id} 
                                                review={review} 
                                                onEdit={handleEditClick} 
                                                onDelete={handleDeleteReview}
                                                currentUserId={user?.id}
                                                currentUserRole={user?.role}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : homeSubTab === 'social-feed' ? (
                            <div className="mt-4">
                                {loadingSocialFeed ? (
                                    <p className="text-zinc-400 text-sm italic">Chargement du fil d'activité...</p>
                                ) : socialFeed.length === 0 ? (
                                    <div className="text-center py-12 bg-[#1a1824] rounded-md border border-zinc-800/50">
                                        <Music size={40} className="mx-auto text-zinc-600 mb-3" />
                                        <p className="text-zinc-400 text-sm">Aucune activité dans votre fil. Suivez d'autres membres pour voir leurs critiques !</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {socialFeed.map((review) => (
                                            <ReviewCard 
                                                key={review.id} 
                                                review={review} 
                                                currentUserId={user?.id}
                                                currentUserRole={user?.role}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── Tendances ── */
                            <div className="mt-4 space-y-5">
                                {/* Filtre de nombre */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                        <Flame size={14} className="text-orange-400" />
                                        <span className="font-semibold">Global Top 50 Spotify · mis à jour chaque semaine</span>
                                    </div>
                                    <div className="bg-[#1a1824] p-1 rounded-full flex gap-1 border border-zinc-800/40 text-xs font-semibold">
                                        {[10, 20, 50].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setTrendingLimit(n)}
                                                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                                                    trendingLimit === n
                                                        ? 'bg-zinc-700 text-white'
                                                        : 'text-zinc-400 hover:text-zinc-200'
                                                }`}
                                            >
                                                Top {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Liste */}
                                {loadingTrending ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <div key={i} className="h-16 bg-zinc-800/40 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-[#1a1824]/30 rounded-xl border border-zinc-800/50 overflow-hidden divide-y divide-zinc-800/40">
                                        {trending.map((track) => (
                                            <div
                                                key={track.id}
                                                className="p-4 flex items-center gap-4 group hover:bg-[#262433]/50 transition-colors duration-150"
                                            >
                                                {/* Rang */}
                                                <span className={`text-xs font-black w-6 text-center flex-shrink-0 ${
                                                    track.rank <= 3 ? 'text-emerald-400' : 'text-zinc-500'
                                                }`}>
                                                    {track.rank <= 3 ? ['🥇','🥈','🥉'][track.rank - 1] : track.rank}
                                                </span>

                                                {/* Cover + bouton play */}
                                                <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 shadow-md">
                                                    {track.albumCover && (
                                                        <img src={track.albumCover} alt={track.albumName} className="w-full h-full object-cover" />
                                                    )}
                                                    {track.previewUrl && (
                                                        <button
                                                            onClick={() => togglePreview(track)}
                                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                                                        >
                                                            {playingPreview === track.id
                                                                ? <Pause size={16} className="text-white" />
                                                                : <Play size={16} className="text-white" />}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Infos */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                                                        {track.name}
                                                        {playingPreview === track.id && (
                                                            <span className="ml-2 text-emerald-400 text-[10px] font-black animate-pulse">▶ EN COURS</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-zinc-400 truncate mt-0.5">{track.artists}</div>
                                                    {/* Barre de popularité */}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-[120px]">
                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{ width: `${track.popularity}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[9px] text-zinc-500 font-semibold">{track.popularity}%</span>
                                                    </div>
                                                </div>

                                                {/* Album + durée */}
                                                <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                                                    <span className="text-[10px] text-zinc-500 truncate max-w-[120px] text-right">{track.albumName}</span>
                                                    <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                        <Clock size={9} /> {formatDuration(track.durationMs)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Audio player caché */}
                                <audio
                                    ref={audioRef}
                                    onEnded={() => setPlayingPreview(null)}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Vue Recherche */}
                {currentTab === 'search' && (
                    <div>
                        <header className="mb-8">
                            <h1 className="text-3xl font-extrabold tracking-tight mb-6">Rechercher</h1>
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => handleSwitchSearchType('albums')}
                                    className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                                        searchType === 'albums'
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-[#1a1824] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                                    }`}
                                >
                                    Albums
                                </button>
                                <button
                                    onClick={() => handleSwitchSearchType('artists')}
                                    className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                                        searchType === 'artists'
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-[#1a1824] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                                    }`}
                                >
                                    Artistes
                                </button>
                                <button
                                    onClick={() => handleSwitchSearchType('members')}
                                    className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                                        searchType === 'members'
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-[#1a1824] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                                    }`}
                                >
                                    Membres
                                </button>
                            </div>
                            <form onSubmit={handleSearch} className="max-w-md">
                                <div className="relative flex items-center">
                                    <Search size={20} className="absolute left-4 text-zinc-400" />
                                    <input 
                                        type="text" 
                                        value={searchQuery} 
                                        onChange={(e) => setSearchQuery(e.target.value)} 
                                        placeholder={
                                            searchType === 'albums' 
                                                ? "Que souhaitez-vous écouter ?" 
                                                : searchType === 'artists'
                                                ? "Rechercher un artiste..."
                                                : "Rechercher un membre par pseudo ou email..."
                                        } 
                                        className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 pl-12 pr-4 py-3 rounded-full text-sm font-medium outline-none text-white transition" 
                                    />
                                </div>
                            </form>
                        </header>

                        {loading ? (
                            <p className="text-zinc-400">Recherche...</p>
                        ) : searchType === 'albums' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {albums.map((album) => (
                                    <AlbumCard 
                                        key={album.id} 
                                        album={album} 
                                        onClick={() => { setEditingReviewId(null); setSelectedAlbum(album); }} 
                                    />
                                ))}
                            </div>
                        ) : searchType === 'artists' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {artists.length === 0 ? (
                                    <p className="text-zinc-500 text-sm">Aucun artiste trouvé.</p>
                                ) : (
                                    artists.map((art) => (
                                        <div 
                                            key={art.id} 
                                            onClick={() => navigate(`/artist/${art.id}`)}
                                            className="bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/40 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col items-center text-center shadow-md"
                                        >
                                            <div className="w-24 h-24 rounded-full bg-zinc-800 shadow-lg flex items-center justify-center font-black text-2xl text-white border-2 border-zinc-800 group-hover:border-emerald-500/40 transition-colors duration-300 overflow-hidden mb-3">
                                                {art.images?.[0]?.url ? (
                                                    <img src={art.images[0].url} alt={art.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Music size={32} className="text-zinc-500" />
                                                )}
                                            </div>
                                            <div className="text-sm font-bold text-white truncate w-full group-hover:text-emerald-400 transition-colors duration-300">
                                                {art.name}
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-1">
                                                Artiste Spotify
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {members.length === 0 ? (
                                    <p className="text-zinc-500 text-sm">Aucun membre trouvé.</p>
                                ) : (
                                    members.map((member) => (
                                        <div 
                                            key={member.id} 
                                            onClick={() => navigate(`/profile/${member.id}`)}
                                            className="bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/40 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group cursor-pointer flex flex-col items-center text-center shadow-md"
                                        >
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg flex items-center justify-center font-black text-2xl text-black border-2 border-zinc-800 group-hover:border-emerald-500/40 transition-colors duration-300 overflow-hidden mb-3">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.pseudo} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.pseudo.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div className="text-sm font-bold text-white truncate w-full group-hover:text-emerald-400 transition-colors duration-300">
                                                {member.pseudo}
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-1">
                                                Membre Music Diary
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Vue Bibliothèque */}
                {currentTab === 'library' && (
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
                            <LibraryGrid reviews={myReviews} onItemClick={handleEditClick} />
                        )}
                    </div>
                )}

                {/* Vue Notifications */}
                {currentTab === 'notifications' && (
                    <NotificationsTab />
                )}
            </div>

            {/* Modal de note/chronique */}
            {selectedAlbum && (
                <ReviewModal 
                    selectedAlbum={selectedAlbum}
                    editingReviewId={editingReviewId}
                    reviewContent={reviewContent}
                    setReviewContent={setReviewContent}
                    rating={rating}
                    setRating={setRating}
                    reviewError={reviewError}
                    reviewSuccess={reviewSuccess}
                    onSubmit={handleSubmitReview}
                    onClose={() => { setSelectedAlbum(null); setEditingReviewId(null); }}
                />
            )}

            {/* Modal de confirmation personnalisée */}
            {confirmModalData && (
                <ConfirmModal
                    title={confirmModalData.title}
                    message={confirmModalData.message}
                    type={confirmModalData.type}
                    confirmText={confirmModalData.confirmText}
                    onConfirm={confirmModalData.onConfirm}
                    onCancel={() => setConfirmModalData(null)}
                />
            )}

        </div>
    );
}

export default Home;