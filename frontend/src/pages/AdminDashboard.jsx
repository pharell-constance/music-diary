import { useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Disc } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import gsap from 'gsap';
import ConfirmModal from '../components/ConfirmModal';
import BanModal from '../components/BanModal';

import useAdminDashboard from '../hooks/useAdminDashboard';
import AdminHeader from '../components/admin/AdminHeader';
import AdminStatsGrid from '../components/admin/AdminStatsGrid';
import AdminFilters from '../components/admin/AdminFilters';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminReviewsTab from '../components/admin/AdminReviewsTab';
import AdminReportsTab from '../components/admin/AdminReportsTab';
import AdminPagination from '../components/admin/AdminPagination';

function AdminDashboard() {
    const navigate = useNavigate();
    const admin = useAdminDashboard();

    // GSAP refs
    const headerRef = useRef(null);
    const statsGridRef = useRef(null);
    const tabsRef = useRef(null);
    const contentAreaRef = useRef(null);

    useLayoutEffect(() => {
        if (admin.loading) return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            if (headerRef.current) tl.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
            if (statsGridRef.current) tl.fromTo(statsGridRef.current.children, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, '-=0.2');
            if (tabsRef.current) tl.fromTo(tabsRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 }, '-=0.1');
            if (contentAreaRef.current) tl.fromTo(contentAreaRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
        });
        return () => ctx.revert();
    }, [admin.loading]);

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            <Sidebar
                user={admin.user}
                currentTab="admin"
                setCurrentTab={(tab) => navigate('/', { state: { tab } })}
                handleLogout={() => { localStorage.clear(); navigate('/login'); }}
            />

            <div className="flex-1 bg-[#12101b] md:my-2 md:mr-2 md:rounded-lg overflow-y-auto no-scrollbar flex flex-col p-4 md:p-8 pb-24 md:pb-8">
                {admin.error && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <ShieldAlert size={48} className="text-red-500" />
                        <h2 className="text-2xl font-bold text-white">Accès refusé ou Erreur</h2>
                        <p className="text-zinc-400 max-w-sm">{admin.error}</p>
                        <button onClick={() => navigate('/')} className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-2.5 rounded-full font-bold transition flex items-center gap-2 mt-2">
                            <ArrowLeft size={16} /> Retour à l'accueil
                        </button>
                    </div>
                )}

                {!admin.error && admin.loading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Disc size={52} className="text-emerald-500 animate-spin" style={{ animationDuration: '2s' }} />
                        <p className="text-zinc-400 font-semibold text-sm tracking-wide">Chargement du dashboard...</p>
                    </div>
                )}

                {!admin.error && !admin.loading && (
                    <div className="space-y-8">
                        <div ref={headerRef}><AdminHeader actionMessage={admin.actionMessage} actionError={admin.actionError} /></div>
                        <div ref={statsGridRef}><AdminStatsGrid stats={admin.stats} /></div>
                        <div ref={tabsRef}>
                            <AdminFilters
                                activeTab={admin.activeTab}
                                setActiveTab={admin.setActiveTab}
                                filteredUsersCount={admin.filteredUsers.length}
                                filteredReviewsCount={admin.filteredReviews.length}
                                filteredReportsCount={admin.filteredReports.length}
                                activeReportsCount={admin.stats?.activeReports || 0}
                                userSearch={admin.userSearch}
                                setUserSearch={admin.setUserSearch}
                                reviewSearch={admin.reviewSearch}
                                setReviewSearch={admin.setReviewSearch}
                                reportSearch={admin.reportSearch}
                                setReportSearch={admin.setReportSearch}
                            />
                        </div>

                        <div ref={contentAreaRef} className="bg-[#1a1824]/30 border border-zinc-800/40 rounded-2xl overflow-hidden">
                            {admin.activeTab === 'users' && (
                                <AdminUsersTab
                                    paginatedUsers={admin.paginatedList}
                                    currentUser={admin.user}
                                    onWarnUser={admin.handleWarnUser}
                                    onBanUser={admin.setBanModalUser}
                                    onUnbanUser={admin.handleUnbanUser}
                                    onToggleRole={admin.handleToggleRole}
                                    onDeleteUser={admin.handleDeleteUser}
                                />
                            )}

                            {admin.activeTab === 'reviews' && (
                                <AdminReviewsTab
                                    paginatedReviews={admin.paginatedList}
                                    onDeleteReview={admin.handleDeleteReview}
                                />
                            )}

                            {admin.activeTab === 'reports' && (
                                <AdminReportsTab
                                    paginatedReports={admin.paginatedList}
                                    currentUser={admin.user}
                                    onWarnUser={admin.handleWarnUser}
                                    onBanUser={admin.setBanModalUser}
                                    onResolveReport={admin.handleResolveReport}
                                    onDeleteReportedContent={admin.handleDeleteReportedContent}
                                    onDismissReport={admin.handleDismissReport}
                                />
                            )}

                            <AdminPagination
                                currentPage={admin.currentPage}
                                setCurrentPage={admin.setCurrentPage}
                                totalPages={admin.totalPages}
                                totalItems={admin.totalItems}
                                itemsPerPage={admin.itemsPerPage}
                            />
                        </div>
                    </div>
                )}
            </div>

            {admin.confirmModalData && (
                <ConfirmModal
                    title={admin.confirmModalData.title}
                    message={admin.confirmModalData.message}
                    type={admin.confirmModalData.type}
                    confirmText={admin.confirmModalData.confirmText}
                    onConfirm={admin.confirmModalData.onConfirm}
                    onCancel={() => admin.setConfirmModalData(null)}
                />
            )}

            {admin.banModalUser && (
                <BanModal
                    userToBan={admin.banModalUser}
                    onConfirm={admin.handleBanUserSubmit}
                    onClose={() => admin.setBanModalUser(null)}
                />
            )}
        </div>
    );
}

export default AdminDashboard;
