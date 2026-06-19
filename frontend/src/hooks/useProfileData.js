import API_URL from '../config.js';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function useProfileData() {
    const { userId } = useParams();
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const isOwnProfile = !userId || parseInt(userId) === user?.id;

    // ── Profile data
    const [connected, setConnected] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [livePlaying, setLivePlaying] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // ── Spotify data
    const [topArtists, setTopArtists] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const [topAlbums, setTopAlbums] = useState([]);
    const [topGenres, setTopGenres] = useState([]);
    const [recent, setRecent] = useState([]);
    const [timeRange, setTimeRange] = useState('short_term');
    const [activeSubTab, setActiveSubTab] = useState('artists');

    // ── Stats / Wrapped
    const [userStats, setUserStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [showWrapped, setShowWrapped] = useState(false);

    // ── Reviews
    const [reviews, setReviews] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [reviewContent, setReviewContent] = useState('');
    const [rating, setRating] = useState(5);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);

    // ── Lyric Pins
    const [lyricPins, setLyricPins] = useState([]);
    const [loadingPins, setLoadingPins] = useState(false);

    // ── UI state
    const [profileTab, setProfileTab] = useState('journal');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState('followers');
    const [followList, setFollowList] = useState([]);
    const [loadingFollowList, setLoadingFollowList] = useState(false);
    const [reportModalData, setReportModalData] = useState(null);
    const [confirmModalData, setConfirmModalData] = useState(null);

    // ─────────────────────────────────────────────────────────────────────────
    // Data fetching
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        async function fetchProfileData() {
            const profileId = userId || user?.id;
            if (!profileId) return;
            setLoadingProfile(true);
            try {
                const res = await fetch(`${API_URL}/api/users/${profileId}/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Utilisateur non trouvé");
                const data = await res.json();
                setProfileUser(data);
                setConnected(data.connected);
                if (data.connected) {
                    const recentUrl = isOwnProfile
                        ? '${API_URL}/api/spotify/me/recent'
                        : `${API_URL}/api/users/${profileId}/spotify/recent`;
                    const recentRes = await fetch(recentUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const recentData = await recentRes.json();
                    setRecent(recentData || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingProfile(false);
            }
        }
        fetchProfileData();
    }, [token, userId, isOwnProfile, user]);

    useEffect(() => {
        const profileId = userId || user?.id;
        if (!profileId || !token) return;
        let intervalId;
        const fetchLivePlaying = async () => {
            try {
                const res = await fetch(`${API_URL}/api/users/${profileId}/live`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setLivePlaying(await res.json());
            } catch (err) {
                console.error("Error fetching live listening status:", err);
            }
        };
        fetchLivePlaying();
        intervalId = setInterval(fetchLivePlaying, 15000);
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [userId, user, token]);

    useEffect(() => {
        const profileId = userId || user?.id;
        if (!profileId || !token) return;
        if (profileTab === 'stats' && !userStats) fetchUserStats(profileId);
    }, [profileTab, userId, user, token, userStats]);

    useEffect(() => {
        if (!connected) return;
        async function fetchSpotifyData() {
            try {
                if (activeSubTab === 'tracks' && timeRange === 'week') {
                    const weeklyUrl = isOwnProfile
                        ? '${API_URL}/api/spotify/me/weekly-top'
                        : `${API_URL}/api/users/${userId}/spotify/weekly-top`;
                    const res = await fetch(weeklyUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setTopTracks(Array.isArray(data) ? data : []);
                    return;
                }

                const apiBase = isOwnProfile
                    ? '${API_URL}/api/spotify/me'
                    : `${API_URL}/api/users/${userId}/spotify`;
                const urlMap = {
                    artists: `${apiBase}/top-artists?limit=10&time_range=${timeRange}`,
                    tracks:  `${apiBase}/top-tracks?limit=10&time_range=${timeRange}`,
                    albums:  `${apiBase}/top-albums?limit=10&time_range=${timeRange}`,
                    genres:  `${apiBase}/top-genres?limit=10&time_range=${timeRange}`,
                };
                const res = await fetch(urlMap[activeSubTab], {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                const arr = Array.isArray(data) ? data : [];
                if (activeSubTab === 'artists') setTopArtists(arr);
                else if (activeSubTab === 'tracks') setTopTracks(arr);
                else if (activeSubTab === 'albums') setTopAlbums(arr);
                else if (activeSubTab === 'genres') setTopGenres(arr);
            } catch (err) {
                console.error(err);
                if (activeSubTab === 'artists') setTopArtists([]);
                else if (activeSubTab === 'tracks') setTopTracks([]);
                else if (activeSubTab === 'albums') setTopAlbums([]);
                else if (activeSubTab === 'genres') setTopGenres([]);
            }
        }
        fetchSpotifyData();
    }, [token, connected, timeRange, activeSubTab, isOwnProfile, userId]);

    useEffect(() => {
        async function fetchReviews() {
            try {
                const url = isOwnProfile
                    ? '${API_URL}/api/reviews'
                    : `${API_URL}/api/users/${userId}/reviews`;
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                setReviews((await res.json()) || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchReviews();
    }, [token, userId, isOwnProfile]);

    useEffect(() => {
        const profileId = userId || user?.id;
        if (!profileId || !token) return;
        setLoadingPins(true);
        const url = isOwnProfile
            ? '${API_URL}/api/lyric-pins'
            : `${API_URL}/api/users/${profileId}/lyric-pins`;
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => setLyricPins(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoadingPins(false));
    }, [token, userId, isOwnProfile, user]);

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────

    async function fetchUserStats(profileId) {
        setLoadingStats(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${profileId}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUserStats(await res.json());
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setLoadingStats(false);
        }
    }

    async function handleFollowToggle() {
        const profileId = userId || user?.id;
        if (!profileId || isOwnProfile || !profileUser) return;
        const action = profileUser.isFollowing ? 'unfollow' : 'follow';
        try {
            const res = await fetch(`${API_URL}/api/users/${profileId}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setProfileUser(prev => {
                    if (!prev) return null;
                    const change = prev.isFollowing ? -1 : 1;
                    return { ...prev, isFollowing: !prev.isFollowing, followersCount: prev.followersCount + change };
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    function handleReportUser() {
        const profileId = userId || user?.id;
        if (!profileId || isOwnProfile || !profileUser) return;
        setReportModalData({ type: 'member', id: parseInt(profileId), name: profileUser.pseudo });
    }

    function handleReportReview(reviewId) {
        const review = reviews.find(r => r.id === reviewId);
        if (!review) return;
        setReportModalData({ type: 'review', id: parseInt(reviewId), name: `Chronique de "${review.albumName}"` });
    }

    async function handleReportSubmit(reason) {
        if (!reportModalData) return;
        const isReview = reportModalData.type === 'review';
        const res = await fetch('${API_URL}/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                reason,
                reportedReviewId: isReview ? reportModalData.id : null,
                reportedUserId: !isReview ? reportModalData.id : null
            })
        });
        const data = await res.json();
        if (res.ok) { alert(data.message); setReportModalData(null); }
        else throw new Error(data.error || "Erreur lors du signalement");
    }

    async function handleOpenFollowModal(type) {
        const profileId = userId || user?.id;
        if (!profileId) return;
        setFollowModalType(type);
        setShowFollowModal(true);
        setLoadingFollowList(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${profileId}/${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setFollowList((await res.json()) || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFollowList(false);
        }
    }

    async function handleAddPin(newPin) {
        setLyricPins(prev => [newPin, ...prev]);
    }

    async function handleDeletePin(pinId) {
        try {
            await fetch(`${API_URL}/api/lyric-pins/${pinId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setLyricPins(prev => prev.filter(p => p.id !== pinId));
        } catch (err) {
            console.error(err);
        }
    }

    async function handleConnect() {
        try {
            const res = await fetch('${API_URL}/api/spotify/authorize-url', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error(err);
        }
    }

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

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
                const tk = localStorage.getItem('token');
                try {
                    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${tk}` }
                    });
                    if (response.ok) setReviews(reviews.filter(r => r.id !== reviewId));
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
        const tk = localStorage.getItem('token');
        const isEditing = editingReviewId !== null;
        const url = isEditing ? `${API_URL}/api/reviews/${editingReviewId}` : '${API_URL}/api/reviews';
        try {
            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tk}` },
                body: JSON.stringify({
                    content: reviewContent,
                    rating,
                    spotifyAlbumId: selectedAlbum.id,
                    albumName: selectedAlbum.name,
                    artistName: selectedAlbum.artists.map(a => a.name).join(', '),
                    albumCover: selectedAlbum.images?.[0]?.url || ""
                })
            });
            if (!response.ok) throw new Error("Erreur lors de l'enregistrement");
            setReviewSuccess(isEditing ? "Chronique modifiée !" : "Chronique enregistrée !");
            const reviewsUrl = isOwnProfile ? '${API_URL}/api/reviews' : `${API_URL}/api/users/${userId}/reviews`;
            const reviewsRes = await fetch(reviewsUrl, { headers: { 'Authorization': `Bearer ${tk}` } });
            setReviews((await reviewsRes.json()) || []);
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

    return {
        userId,
        token,
        user,
        setUser,
        isOwnProfile,
        connected,
        profileUser,
        setProfileUser,
        livePlaying,
        loadingProfile,
        topArtists,
        topTracks,
        topAlbums,
        topGenres,
        recent,
        timeRange,
        setTimeRange,
        activeSubTab,
        setActiveSubTab,
        userStats,
        loadingStats,
        showWrapped,
        setShowWrapped,
        reviews,
        selectedAlbum,
        setSelectedAlbum,
        reviewContent,
        setReviewContent,
        rating,
        setRating,
        reviewError,
        reviewSuccess,
        editingReviewId,
        setEditingReviewId,
        lyricPins,
        profileTab,
        setProfileTab,
        showEditModal,
        setShowEditModal,
        showFollowModal,
        setShowFollowModal,
        followModalType,
        followList,
        loadingFollowList,
        reportModalData,
        setReportModalData,
        confirmModalData,
        setConfirmModalData,
        handleFollowToggle,
        handleReportUser,
        handleReportReview,
        handleReportSubmit,
        handleOpenFollowModal,
        handleAddPin,
        handleDeletePin,
        handleConnect,
        handleLogout,
        handleEditClick,
        handleDeleteReview,
        handleSubmitReview
    };
}
