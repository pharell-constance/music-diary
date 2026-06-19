import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ReviewModal from '../components/ReviewModal';
import ConfirmModal from '../components/ConfirmModal';
import NotificationsTab from '../components/NotificationsTab';
import LandingPage from './landing';

import SearchTab from '../components/home/SearchTab';
import LibraryTab from '../components/home/LibraryTab';
import HomeJournalTab from '../components/home/HomeJournalTab';
import useHomeData from '../hooks/useHomeData';

function Home() {
    const navigate = useNavigate();
    const home = useHomeData();

    if (!home.user) {
        return <LandingPage />;
    }

    return (
        <div className="flex min-h-screen bg-black text-white font-sans">
            <Sidebar
                user={home.user}
                currentTab={home.currentTab}
                setCurrentTab={home.setCurrentTab}
                handleLogout={() => { localStorage.clear(); navigate('/login'); }}
            />

            <div className="flex-1 bg-[#12101b] md:my-2 md:mr-2 md:rounded-lg no-scrollbar flex flex-col p-4 md:p-8 pb-24 md:pb-8">
                {/* Vue Accueil / Journal */}
                {home.currentTab === 'home' && (
                    <HomeJournalTab home={home} />
                )}

                {/* Vue Recherche */}
                {home.currentTab === 'search' && (
                    <SearchTab
                        searchQuery={home.searchQuery}
                        setSearchQuery={home.setSearchQuery}
                        searchType={home.searchType}
                        handleSwitchSearchType={home.handleSwitchSearchType}
                        handleSearch={home.handleSearch}
                        loading={home.loading}
                        albums={home.albums}
                        artists={home.artists}
                        members={home.members}
                        tracks={home.tracks}
                        onSelectAlbum={(album) => { home.setEditingReviewId(null); home.setSelectedAlbum(album); }}
                    />
                )}

                {/* Vue Bibliothèque */}
                {home.currentTab === 'library' && (
                    <LibraryTab
                        user={home.user}
                        myReviews={home.myReviews}
                        onEditReview={home.handleEditClick}
                        onDeleteReview={home.handleDeleteReview}
                        onSelectAlbum={home.setSelectedAlbum}
                        onFetchMyReviews={home.fetchMyReviews}
                    />
                )}

                {/* Notifications */}
                {home.currentTab === 'notifications' && (
                    <NotificationsTab />
                )}
            </div>

            {home.selectedAlbum && (
                <ReviewModal
                    selectedAlbum={home.selectedAlbum}
                    editingReviewId={home.editingReviewId}
                    reviewContent={home.reviewContent}
                    setReviewContent={home.setReviewContent}
                    rating={home.rating}
                    setRating={home.setRating}
                    reviewError={home.reviewError}
                    reviewSuccess={home.reviewSuccess}
                    onSubmit={home.handleSubmitReview}
                    onClose={() => { home.setSelectedAlbum(null); home.setEditingReviewId(null); }}
                />
            )}

            {home.confirmModalData && (
                <ConfirmModal
                    title={home.confirmModalData.title}
                    message={home.confirmModalData.message}
                    type={home.homeSubTab === 'trending' ? 'danger' : home.confirmModalData.type}
                    confirmText={home.confirmModalData.confirmText}
                    onConfirm={home.confirmModalData.onConfirm}
                    onCancel={() => home.setConfirmModalData(null)}
                />
            )}
        </div>
    );
}

export default Home;