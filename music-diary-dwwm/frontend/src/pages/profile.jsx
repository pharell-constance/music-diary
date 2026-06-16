import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileEditModal from '../components/ProfileEditModal';
import ReviewModal from '../components/ReviewModal';
import ReportModal from '../components/ReportModal';
import ConfirmModal from '../components/ConfirmModal';
import MusicWrappedModal from '../components/MusicWrappedModal';

// Profile sub-components
import ProfileHero from '../components/profile/ProfileHero';
import ProfileTabs from '../components/profile/ProfileTabs';
import JournalTab from '../components/profile/JournalTab';
import SpotifyTab from '../components/profile/SpotifyTab';
import StatsTab from '../components/profile/StatsTab';
import FollowModal from '../components/profile/FollowModal';

function Profile() {
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
                const res = await fetch(`http://127.0.0.1:5001/api/users/${profileId}/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Utilisateur non trouvé");
                const data = await res.json();
                setProfileUser(data);
                setConnected(data.connected);
                if (data.connected) {
                    const recentUrl = isOwnProfile
                        ? 'http://127.0.0.1:5001/api/spotify/me/recent'
                        : `http://127.0.0.1:5001/api/users/${profileId}/spotify/recent`;
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
                const res = await fetch(`http://127.0.0.1:5001/api/users/${profileId}/live`, {
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
                const apiBase = isOwnProfile
                    ? 'http://127.0.0.1:5001/api/spotify/me'
                    : `http://127.0.0.1:5001/api/users/${userId}/spotify`;
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
                if (activeSubTab === 'artists') setTopArtists(data || []);
                else if (activeSubTab === 'tracks') setTopTracks(data || []);
                else if (activeSubTab === 'albums') setTopAlbums(data || []);
                else if (activeSubTab === 'genres') setTopGenres(data || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchSpotifyData();
    }, [token, connected, timeRange, activeSubTab, isOwnProfile, userId]);

    useEffect(() => {
        async function fetchReviews() {
            try {
                const url = isOwnProfile
                    ? 'http://127.0.0.1:5001/api/reviews'
                    : `http://127.0.0.1:5001/api/users/${userId}/reviews`;
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                setReviews((await res.json()) || []);
            } catch (err) {
                console.error(err);
            }
        }
        fetchReviews();
    }, [token, userId, isOwnProfile]);

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────

    async function fetchUserStats(profileId) {
        setLoadingStats(true);
        try {
            const res = await fetch(`http://127.0.0.1:5001/api/users/${profileId}/stats`, {
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
            const res = await fetch(`http://127.0.0.1:5001/api/users/${profileId}/${action}`, {
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
        const res = await fetch('http://127.0.0.1:5001/api/reports', {
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
            const res = await fetch(`http://127.0.0.1:5001/api/users/${profileId}/${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setFollowList((await res.json()) || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFollowList(false);
        }
    }

    async function handleConnect() {
        try {
            const res = await fetch('http://127.0.0.1:5001/api/spotify/authorize-url', {
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
                    const response = await fetch(`http://127.0.0.1:5001/api/reviews/${reviewId}`, {
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
        const url = isEditing ? `http://127.0.0.1:5001/api/reviews/${editingReviewId}` : 'http://127.0.0.1:5001/api/reviews';
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
            const reviewsUrl = isOwnProfile ? 'http://127.0.0.1:5001/api/reviews' : `http://127.0.0.1:5001/api/users/${userId}/reviews`;
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

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">

            <Sidebar
                user={user}
                currentTab="profile"
                setCurrentTab={(tab) => navigate('/', { state: { tab } })}
                handleLogout={handleLogout}
            />

            <div className="flex-1 bg-[#121212] my-2 mr-2 rounded-lg overflow-y-auto flex flex-col">

                {loadingProfile ? (
                    <div className="p-8 text-center text-zinc-400">Chargement du profil...</div>
                ) : !profileUser ? (
                    <div className="p-8 text-center text-zinc-400">Utilisateur non trouvé.</div>
                ) : (
                    <>
                        <ProfileHero
                            profileUser={profileUser}
                            isOwnProfile={isOwnProfile}
                            connected={connected}
                            livePlaying={livePlaying}
                            onEditClick={() => setShowEditModal(true)}
                            onFollowToggle={handleFollowToggle}
                            onReportUser={handleReportUser}
                            onOpenFollowModal={handleOpenFollowModal}
                        />

                        <div className="p-8 space-y-8">
                            <ProfileTabs
                                profileTab={profileTab}
                                setProfileTab={setProfileTab}
                                connected={connected}
                            />

                            {profileTab === 'journal' && (
                                <JournalTab
                                    connected={connected}
                                    isOwnProfile={isOwnProfile}
                                    reviews={reviews}
                                    user={user}
                                    onConnect={handleConnect}
                                    onEditReview={handleEditClick}
                                    onDeleteReview={handleDeleteReview}
                                    onReportReview={handleReportReview}
                                    onSelectAlbum={setSelectedAlbum}
                                />
                            )}

                            {profileTab === 'spotify' && connected && (
                                <SpotifyTab
                                    activeSubTab={activeSubTab}
                                    setActiveSubTab={setActiveSubTab}
                                    timeRange={timeRange}
                                    setTimeRange={setTimeRange}
                                    topArtists={topArtists}
                                    topTracks={topTracks}
                                    topAlbums={topAlbums}
                                    topGenres={topGenres}
                                    recent={recent}
                                    onArtistClick={(id) => navigate(`/artist/${id}`)}
                                    onSelectAlbum={setSelectedAlbum}
                                />
                            )}

                            {profileTab === 'stats' && (
                                <StatsTab
                                    userStats={userStats}
                                    loadingStats={loadingStats}
                                    onShowWrapped={() => setShowWrapped(true)}
                                />
                            )}
                        </div>

                        {/* ── Modals ── */}

                        {showEditModal && isOwnProfile && (
                            <ProfileEditModal
                                user={user}
                                onSave={(updatedUser) => {
                                    setUser(updatedUser);
                                    setProfileUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
                                    localStorage.setItem('user', JSON.stringify(updatedUser));
                                }}
                                onClose={() => setShowEditModal(false)}
                            />
                        )}

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

                        <FollowModal
                            show={showFollowModal}
                            type={followModalType}
                            followList={followList}
                            loadingFollowList={loadingFollowList}
                            onClose={() => setShowFollowModal(false)}
                        />

                        {reportModalData && (
                            <ReportModal
                                reportedType={reportModalData.type}
                                reportedName={reportModalData.name}
                                onSubmit={handleReportSubmit}
                                onClose={() => setReportModalData(null)}
                            />
                        )}

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

                        {showWrapped && userStats && (
                            <MusicWrappedModal
                                stats={userStats}
                                onClose={() => setShowWrapped(false)}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Profile;
