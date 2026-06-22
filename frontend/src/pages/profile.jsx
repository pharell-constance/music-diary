import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileHero from '../components/profile/ProfileHero';
import ProfileTabs from '../components/profile/ProfileTabs';
import JournalTab from '../components/profile/JournalTab';
import SpotifyTab from '../components/profile/SpotifyTab';
import StatsTab from '../components/profile/StatsTab';
import LyricWall from '../components/profile/LyricWall';
import ProfileModals from '../components/profile/ProfileModals';
import useProfileData from '../hooks/useProfileData';
import NeobrutalLoader from '../components/NeobrutalLoader';

function Profile() {
    const navigate = useNavigate();
    const profile = useProfileData();

    useEffect(() => {
        if (profile.user && (profile.user.role === 'ADMIN' || profile.user.role === 'OWNER') && profile.isOwnProfile) {
            navigate('/admin');
        }
    }, [profile.user, profile.isOwnProfile, navigate]);

    const isProfileLoading = profile.loadingProfile || profile.loadingStats || profile.loadingFollowList;

    return (
        <div className="flex min-h-screen bg-[#07050f] text-white font-sans relative">
            <NeobrutalLoader isLoading={isProfileLoading} />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            <Sidebar
                user={profile.user}
                currentTab="profile"
                setCurrentTab={(tab) => navigate('/', { state: { tab } })}
                handleLogout={profile.handleLogout}
            />

            <div className="flex-1 bg-white/[0.01] backdrop-blur-xl border-x-0 border-y border-white/[0.05] md:border md:border-white/[0.05] md:my-2 md:mr-2 md:rounded-2xl flex flex-col relative z-10 pb-24 md:pb-0">
                {profile.loadingProfile ? (
                    <div className="p-8 text-center text-zinc-400">Chargement du profil...</div>
                ) : !profile.profileUser ? (
                    <div className="p-8 text-center text-zinc-400">Utilisateur non trouvé.</div>
                ) : (
                    <>
                        <ProfileHero
                            profileUser={profile.profileUser}
                            isOwnProfile={profile.isOwnProfile}
                            connected={profile.connected}
                            livePlaying={profile.livePlaying}
                            onEditClick={() => profile.setShowEditModal(true)}
                            onFollowToggle={profile.handleFollowToggle}
                            onReportUser={profile.handleReportUser}
                            onOpenFollowModal={profile.handleOpenFollowModal}
                            onLogoutClick={profile.handleLogout}
                        />

                        <div className="p-4 md:p-8 space-y-8">
                            <ProfileTabs
                                profileTab={profile.profileTab}
                                setProfileTab={profile.setProfileTab}
                                connected={profile.connected}
                            />

                            {profile.profileTab === 'journal' && (
                                <JournalTab
                                    connected={profile.connected}
                                    isOwnProfile={profile.isOwnProfile}
                                    reviews={profile.reviews}
                                    user={profile.user}
                                    onConnect={profile.handleConnect}
                                    onEditReview={profile.handleEditClick}
                                    onDeleteReview={profile.handleDeleteReview}
                                    onReportReview={profile.handleReportReview}
                                    onSelectAlbum={profile.setSelectedAlbum}
                                />
                            )}

                            {profile.profileTab === 'mur' && (
                                <LyricWall
                                    pins={profile.lyricPins}
                                    isOwnProfile={profile.isOwnProfile}
                                    onAdd={profile.handleAddPin}
                                    onDelete={profile.handleDeletePin}
                                    token={profile.token}
                                />
                            )}

                            {profile.profileTab === 'spotify' && profile.connected && (
                                <SpotifyTab
                                    activeSubTab={profile.activeSubTab}
                                    setActiveSubTab={profile.setActiveSubTab}
                                    timeRange={profile.timeRange}
                                    setTimeRange={profile.setTimeRange}
                                    topArtists={profile.topArtists}
                                    topTracks={profile.topTracks}
                                    topAlbums={profile.topAlbums}
                                    topGenres={profile.topGenres}
                                    recent={profile.recent}
                                    onArtistClick={(id) => navigate(`/artist/${id}`)}
                                    onSelectAlbum={profile.setSelectedAlbum}
                                />
                            )}

                            {profile.profileTab === 'stats' && (
                                <StatsTab
                                    userStats={profile.userStats}
                                    loadingStats={profile.loadingStats}
                                    onShowWrapped={() => profile.setShowWrapped(true)}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
            <ProfileModals profile={profile} />
        </div>
    );
}

export default Profile;
