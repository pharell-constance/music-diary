import API_URL from '../config.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAdminDashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [stats, setStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [reviewsList, setReviewsList] = useState([]);
    const [reportsList, setReportsList] = useState([]);
    const [activeTab, setActiveTab] = useState('reports'); // 'reports', 'users', 'reviews'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');
    const [confirmModalData, setConfirmModalData] = useState(null);
    const [banModalUser, setBanModalUser] = useState(null);

    // Search queries
    const [userSearch, setUserSearch] = useState('');
    const [reviewSearch, setReviewSearch] = useState('');
    const [reportSearch, setReportSearch] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset pagination on filter or tab change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, userSearch, reviewSearch, reportSearch]);

    // Verify admin access and fetch stats/data
    useEffect(() => {
        if (!token || !user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
            navigate('/', { replace: true });
            return;
        }

        async function fetchAdminData() {
            setLoading(true);
            try {
                // Fetch stats
                const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!statsRes.ok) throw new Error("Erreur de récupération des stats");
                const statsData = await statsRes.json();
                setStats(statsData);

                // Fetch users
                const usersRes = await fetch(`${API_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!usersRes.ok) throw new Error("Erreur de récupération des utilisateurs");
                const usersData = await usersRes.json();
                setUsersList(usersData);

                // Fetch reviews
                const reviewsRes = await fetch(`${API_URL}/api/admin/reviews`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!reviewsRes.ok) throw new Error("Erreur de récupération des critiques");
                const reviewsData = await reviewsRes.json();
                setReviewsList(reviewsData);

                // Fetch reports
                const reportsRes = await fetch(`${API_URL}/api/admin/reports`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!reportsRes.ok) throw new Error("Erreur de récupération des signalements");
                const reportsData = await reportsRes.json();
                setReportsList(reportsData);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Erreur lors du chargement des données');
                setLoading(false);
            }
        }

        fetchAdminData();
    }, [token, user, navigate]);

    // Toggle user role
    const handleToggleRole = (targetUser) => {
        if (targetUser.id === user.id) {
            showActionError("Action impossible : vous ne pouvez pas modifier votre propre rôle.");
            return;
        }

        setConfirmModalData({
            title: "Modifier le rôle",
            message: `Voulez-vous vraiment changer le rôle de ${targetUser.pseudo} en ${targetUser.role === 'ADMIN' ? 'Standard USER' : 'ADMIN'} ?`,
            type: "warning",
            confirmText: "Modifier",
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/role`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erreur de changement de rôle");

                    setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: data.user.role } : u));
                    showActionSuccess(data.message);
                } catch (err) {
                    showActionError(err.message);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    // Delete user
    const handleDeleteUser = (targetUser) => {
        if (targetUser.id === user.id) {
            showActionError("Action impossible : vous ne pouvez pas supprimer votre propre compte.");
            return;
        }

        setConfirmModalData({
            title: "Supprimer l'utilisateur",
            message: `ÊTES-VOUS ABSOLUMENT SÛR ? Supprimer l'utilisateur "${targetUser.pseudo}" effacera également toutes ses critiques et abonnements de manière permanente.`,
            type: "danger",
            confirmText: "Supprimer",
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erreur de suppression");

                    setUsersList(prev => prev.filter(u => u.id !== targetUser.id));
                    setStats(prev => ({
                        ...prev,
                        totalUsers: prev.totalUsers - 1,
                        totalReviews: prev.totalReviews - (targetUser._count?.reviews || 0)
                    }));
                    showActionSuccess(data.message);
                } catch (err) {
                    showActionError(err.message);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    // Delete review
    const handleDeleteReview = (reviewId) => {
        setConfirmModalData({
            title: "Supprimer la critique",
            message: "Voulez-vous vraiment supprimer cette critique définitivement ?",
            type: "danger",
            confirmText: "Supprimer",
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/admin/reviews/${reviewId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erreur de suppression de la critique");

                    setReviewsList(prev => prev.filter(r => r.id !== reviewId));
                    setStats(prev => ({ ...prev, totalReviews: prev.totalReviews - 1 }));
                    showActionSuccess(data.message);
                } catch (err) {
                    showActionError(err.message);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    // Resolve report (keep content)
    const handleResolveReport = async (reportId) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/reports/${reportId}/resolve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la résolution du signalement");
            setReportsList(prev => prev.filter(r => r.id !== reportId));
            setStats(prev => ({ ...prev, activeReports: Math.max(0, prev.activeReports - 1) }));
            showActionSuccess(data.message);
        } catch (err) {
            showActionError(err.message);
        }
    };

    // Dismiss report (delete report row)
    const handleDismissReport = (reportId) => {
        setConfirmModalData({
            title: "Rejeter le signalement",
            message: "Supprimer ce signalement ? (Le contenu restera en ligne)",
            type: "info",
            confirmText: "Rejeter",
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression du signalement");
                    setReportsList(prev => prev.filter(r => r.id !== reportId));
                    setStats(prev => ({ ...prev, activeReports: Math.max(0, prev.activeReports - 1) }));
                    showActionSuccess(data.message);
                } catch (err) {
                    showActionError(err.message);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    // Delete reported content & automatically resolve report
    const handleDeleteReportedContent = (report) => {
        const isReview = !!report.reportedReviewId;
        const targetId = isReview ? report.reportedReviewId : report.reportedUserId;
        const targetName = isReview ? `la critique de "${report.reportedReview.albumName}"` : `le membre "${report.reportedUser.pseudo}"`;

        setConfirmModalData({
            title: "Supprimer le contenu",
            message: `Voulez-vous supprimer définitivement ${targetName} ? Cela résoudra également ce signalement.`,
            type: "danger",
            confirmText: "Supprimer",
            onConfirm: async () => {
                try {
                    const deleteUrl = isReview 
                        ? `${API_URL}/api/admin/reviews/${targetId}`
                        : `${API_URL}/api/admin/users/${targetId}`;

                    const deleteRes = await fetch(deleteUrl, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const deleteData = await deleteRes.json();
                    if (!deleteRes.ok) throw new Error(deleteData.error || "Erreur lors de la suppression");

                    const resolveRes = await fetch(`${API_URL}/api/admin/reports/${report.id}/resolve`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!resolveRes.ok) console.error("Erreur de résolution auto du signalement");

                    setReportsList(prev => prev.filter(r => r.id !== report.id));
                    setStats(prev => ({ ...prev, activeReports: Math.max(0, prev.activeReports - 1) }));
                    
                    if (isReview) {
                        setReviewsList(prev => prev.filter(r => r.id !== targetId));
                        setStats(prev => ({ ...prev, totalReviews: prev.totalReviews - 1 }));
                    } else {
                        setUsersList(prev => prev.filter(u => u.id !== targetId));
                        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
                        setReportsList(prev => prev.filter(r => r.reportedUserId !== targetId));
                    }

                    showActionSuccess("Contenu supprimé et signalement archivé.");
                } catch (err) {
                    showActionError(err.message);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    // Warn user (increment warnings count)
    const handleWarnUser = (targetUser) => {
        if (targetUser.id === user.id) {
            showActionError("Action impossible : vous ne pouvez pas vous avertir.");
            return;
        }

        setConfirmModalData({
            title: "Envoyer un avertissement",
            message: `Voulez-vous envoyer un avertissement officiel à ${targetUser.pseudo} ?`,
            type: "warning",
            confirmText: "Avertir",
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/warn`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erreur lors de l'avertissement");

                    // Update user in lists
                    setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, warningsCount: data.user.warningsCount } : u));
                    setReportsList(prev => prev.map(r => {
                        let updated = { ...r };
                        if (r.reportedUser && r.reportedUser.id === targetUser.id) {
                            updated.reportedUser = { ...r.reportedUser, warningsCount: data.user.warningsCount };
                        }
                        if (r.reportedReview?.author && r.reportedReview.author.id === targetUser.id) {
                            updated.reportedReview = { 
                                ...r.reportedReview, 
                                author: { ...r.reportedReview.author, warningsCount: data.user.warningsCount } 
                            };
                        }
                        return updated;
                    }));
                    showActionSuccess(data.message);
                } catch (err) {
                    showActionError(err.message);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    // Ban user
    const handleBanUserSubmit = async (reason) => {
        const targetUser = banModalUser;
        if (!targetUser) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/ban`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur de bannissement");

            // Update state
            setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, isBanned: true, banReason: reason } : u));
            setReportsList(prev => prev.map(r => {
                let updated = { ...r };
                if (r.reportedUser && r.reportedUser.id === targetUser.id) {
                    updated.reportedUser = { ...r.reportedUser, isBanned: true, banReason: reason };
                }
                if (r.reportedReview?.author && r.reportedReview.author.id === targetUser.id) {
                    updated.reportedReview = { 
                        ...r.reportedReview, 
                        author: { ...r.reportedReview.author, isBanned: true, banReason: reason } 
                    };
                }
                return updated;
            }));
            showActionSuccess(data.message);
        } catch (err) {
            showActionError(err.message);
        } finally {
            setBanModalUser(null);
        }
    };

    // Unban user
    const handleUnbanUser = (targetUser) => {
        setConfirmModalData({
            title: "Débannir l'utilisateur",
            message: `Voulez-vous vraiment lever le bannissement de ${targetUser.pseudo} ?`,
            type: "success",
            confirmText: "Débannir",
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/admin/users/${targetUser.id}/unban`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Erreur");

                    setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, isBanned: false, banReason: null } : u));
                    setReportsList(prev => prev.map(r => {
                        let updated = { ...r };
                        if (r.reportedUser && r.reportedUser.id === targetUser.id) {
                            updated.reportedUser = { ...r.reportedUser, isBanned: false, banReason: null };
                        }
                        if (r.reportedReview?.author && r.reportedReview.author.id === targetUser.id) {
                            updated.reportedReview = { 
                                ...r.reportedReview, 
                                author: { ...r.reportedReview.author, isBanned: false, banReason: null } 
                            };
                        }
                        return updated;
                    }));
                    showActionSuccess(data.message);
                } catch (err) {
                    showActionError(err.message);
                } finally {
                    setConfirmModalData(null);
                }
            }
        });
    };

    // Helper alerts
    const showActionSuccess = (msg) => {
        setActionMessage(msg);
        setActionError('');
        setTimeout(() => setActionMessage(''), 4000);
    };

    const showActionError = (msg) => {
        setActionError(msg);
        setActionMessage('');
        setTimeout(() => setActionError(''), 4000);
    };

    // Filter lists based on search queries
    const filteredUsers = usersList.filter(u => 
        u.pseudo.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredReviews = reviewsList.filter(r => 
        r.albumName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.artistName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.author.pseudo.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.content.toLowerCase().includes(reviewSearch.toLowerCase())
    );

    const filteredReports = reportsList.filter(r => {
        const query = reportSearch.toLowerCase();
        const reasonMatch = r.reason.toLowerCase().includes(query);
        const reporterMatch = r.reporter?.pseudo.toLowerCase().includes(query);
        const reviewMatch = r.reportedReview ? (r.reportedReview.albumName.toLowerCase().includes(query) || r.reportedReview.artistName.toLowerCase().includes(query)) : false;
        const userMatch = r.reportedUser ? r.reportedUser.pseudo.toLowerCase().includes(query) : false;
        return reasonMatch || reporterMatch || reviewMatch || userMatch;
    });

    // Pagination slicing
    const currentList = activeTab === 'users' 
        ? filteredUsers 
        : activeTab === 'reviews' 
        ? filteredReviews 
        : filteredReports;

    const totalItems = currentList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedList = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return {
        user,
        stats,
        activeTab,
        setActiveTab,
        loading,
        error,
        actionMessage,
        actionError,
        confirmModalData,
        setConfirmModalData,
        banModalUser,
        setBanModalUser,
        userSearch,
        setUserSearch,
        reviewSearch,
        setReviewSearch,
        reportSearch,
        setReportSearch,
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        filteredUsers,
        filteredReviews,
        filteredReports,
        paginatedList,
        handleToggleRole,
        handleDeleteUser,
        handleDeleteReview,
        handleResolveReport,
        handleDismissReport,
        handleDeleteReportedContent,
        handleWarnUser,
        handleBanUserSubmit,
        handleUnbanUser
    };
}
