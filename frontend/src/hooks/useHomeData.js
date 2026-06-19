import API_URL from '../config.js';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function useHomeData() {
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
    const [tracks, setTracks] = useState([]);

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

    useEffect(() => {
        if (location.state?.tab) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentTab(location.state.tab);
        }
    }, [location.state]);

    useEffect(() => {
        fetchMyReviews();
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            window.spotifyIsPlaying = false;
            window.dispatchEvent(new CustomEvent('spotify-pause'));
        };
    }, []);

    useEffect(() => {
        if (homeSubTab === 'social-feed') fetchSocialFeed();
        if (homeSubTab === 'trending') fetchTrending(trendingLimit);
    }, [homeSubTab]);

    useEffect(() => {
        if (homeSubTab === 'trending') fetchTrending(trendingLimit);
    }, [trendingLimit]);

    useEffect(() => {
        if (playingPreview === null) {
            window.dispatchEvent(new CustomEvent('spotify-pause'));
        }
    }, [playingPreview]);

    async function fetchSocialFeed() {
        const token = localStorage.getItem('token');
        setLoadingSocialFeed(true);
        try {
            const response = await fetch('${API_URL}/api/social/feed', {
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
            const res = await fetch(`${API_URL}/api/spotify/trending?limit=${limit}`);
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
            window.dispatchEvent(new CustomEvent('spotify-play', {
                detail: {
                    id: track.id,
                    name: track.name,
                    artist: track.artistName || (typeof track.artists === 'string' ? track.artists : (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(', ') : '')),
                    cover: track.albumCover || track.album?.images?.[0]?.url || ''
                }
            }));
        }
    }

    async function fetchMyReviews() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('${API_URL}/api/reviews', {
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
                    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
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

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setReviewError('');
        setReviewSuccess('');
        const token = localStorage.getItem('token');

        const isEditing = editingReviewId !== null;
        const url = isEditing
            ? `${API_URL}/api/reviews/${editingReviewId}`
            : '${API_URL}/api/reviews';
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
                    spotifyAlbumId: selectedAlbum.id,
                    albumName: selectedAlbum.name,
                    artistName: selectedAlbum.artists.map(a => a.name).join(', '),
                    albumCover: selectedAlbum.images?.[0]?.url || ''
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Erreur lors de l'enregistrement");
            }

            setReviewSuccess(isEditing ? "Chronique modifiée !" : "Chronique enregistrée !");

            // Refresh reviews
            await fetchMyReviews();

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

    const triggerSearch = async (query, type) => {
        if (!query.trim()) return;
        setLoading(true);
        console.log(`[Search] query: "${query}", type: "${type}"`);
        const token = localStorage.getItem('token');
        try {
            if (type === 'albums') {
                const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}&type=album`);
                const data = await response.json();
                if (data.albums?.items) setAlbums(data.albums.items);
            } else if (type === 'artists') {
                const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}&type=artist`);
                const data = await response.json();
                if (data.artists?.items) setArtists(data.artists.items);
            } else if (type === 'tracks') {
                const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}&type=track`);
                const data = await response.json();
                console.log("[Search] tracks returned:", data.tracks?.items?.length || 0);
                if (data.tracks?.items) setTracks(data.tracks.items);
            } else {
                const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) setMembers(data || []);
            }
        } catch (error) {
            console.error("[Search] error:", error);
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
        setAlbums([]);
        setArtists([]);
        setTracks([]);
        setMembers([]);
        // Si une recherche est déjà en cours, on la relance pour le nouveau type choisi
        if (searchQuery.trim()) {
            triggerSearch(searchQuery, type);
        }
    };

    return {
        user,
        currentTab,
        setCurrentTab,
        searchQuery,
        setSearchQuery,
        albums,
        setAlbums,
        artists,
        setArtists,
        loading,
        searchType,
        setSearchType,
        members,
        setMembers,
        tracks,
        setTracks,
        myReviews,
        setMyReviews,
        socialFeed,
        setSocialFeed,
        homeSubTab,
        setHomeSubTab,
        loadingSocialFeed,
        selectedAlbum,
        setSelectedAlbum,
        reviewContent,
        setReviewContent,
        rating,
        setRating,
        reviewError,
        setReviewError,
        reviewSuccess,
        setReviewSuccess,
        editingReviewId,
        setEditingReviewId,
        confirmModalData,
        setConfirmModalData,
        trending,
        loadingTrending,
        trendingLimit,
        setTrendingLimit,
        playingPreview,
        setPlayingPreview,
        audioRef,
        formatDuration,
        togglePreview,
        handleEditClick,
        handleDeleteReview,
        handleSubmitReview,
        handleSearch,
        handleSwitchSearchType,
        fetchMyReviews
    };
}
