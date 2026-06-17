import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileHero from '../components/profile/ProfileHero';
import ProfileTabs from '../components/profile/ProfileTabs';
import JournalTab from '../components/profile/JournalTab';
import SpotifyTab from '../components/profile/SpotifyTab';
import StatsTab from '../components/profile/StatsTab';
import LyricWall from '../components/profile/LyricWall';
import ProfileModals from '../components/profile/ProfileModals';
import useProfileData from '../hooks/useProfileData';

function Profile() {
    const navigate = useNavigate();
    const profile = useProfileData();

    return (
        <div className="flex h-screen bg-[#07050f] text-white overflow-hidden font-sans relative">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            <Sidebar
                user={profile.user}
                currentTab="profile"
                setCurrentTab={(tab) => navigate('/', { state: { tab } })}
                handleLogout={profile.handleLogout}
            />

            <div className="flex-1 bg-white/[0.01] backdrop-blur-xl border border-white/[0.05] my-2 mr-2 rounded-2xl overflow-y-auto flex flex-col relative z-10">
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
                        />

                        <div className="p-8 space-y-8">
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

                        <ProfileModals profile={profile} />
                    </>
                )}
            </div>
        </div>
    );
}

export default Profile;
