import ProfileEditModal from '../ProfileEditModal';
import ReviewModal from '../ReviewModal';
import FollowModal from './FollowModal';
import ReportModal from '../ReportModal';
import ConfirmModal from '../ConfirmModal';
import MusicWrappedModal from '../MusicWrappedModal';

export default function ProfileModals({ profile }) {
    return (
        <>
            {profile.showEditModal && profile.isOwnProfile && (
                <ProfileEditModal
                    user={profile.user}
                    onSave={(updatedUser) => {
                        profile.setUser(updatedUser);
                        profile.setProfileUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }}
                    onClose={() => profile.setShowEditModal(false)}
                />
            )}

            {profile.selectedAlbum && (
                <ReviewModal
                    selectedAlbum={profile.selectedAlbum}
                    editingReviewId={profile.editingReviewId}
                    reviewContent={profile.reviewContent}
                    setReviewContent={profile.setReviewContent}
                    rating={profile.rating}
                    setRating={profile.setRating}
                    reviewError={profile.reviewError}
                    reviewSuccess={profile.reviewSuccess}
                    onSubmit={profile.handleSubmitReview}
                    onClose={() => { profile.setSelectedAlbum(null); profile.setEditingReviewId(null); }}
                />
            )}

            <FollowModal
                show={profile.showFollowModal}
                type={profile.followModalType}
                followList={profile.followList}
                loadingFollowList={profile.loadingFollowList}
                onClose={() => profile.setShowFollowModal(false)}
            />

            {profile.reportModalData && (
                <ReportModal
                    reportedType={profile.reportModalData.type}
                    reportedName={profile.reportModalData.name}
                    onSubmit={profile.handleReportSubmit}
                    onClose={() => profile.setReportModalData(null)}
                />
            )}

            {profile.confirmModalData && (
                <ConfirmModal
                    title={profile.confirmModalData.title}
                    message={profile.confirmModalData.message}
                    type={profile.confirmModalData.type}
                    confirmText={profile.confirmModalData.confirmText}
                    onConfirm={profile.confirmModalData.onConfirm}
                    onCancel={() => profile.setConfirmModalData(null)}
                />
            )}

            {profile.showWrapped && profile.userStats && (
                <MusicWrappedModal
                    stats={profile.userStats}
                    onClose={() => profile.setShowWrapped(false)}
                />
            )}
        </>
    );
}
