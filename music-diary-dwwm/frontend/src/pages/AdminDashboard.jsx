import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Headphones, Trash2, Shield, ShieldAlert, ArrowLeft, Disc, Flag, AlertTriangle, Ban, Unlock, Crown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import gsap from 'gsap';
import ConfirmModal from '../components/ConfirmModal';
import BanModal from '../components/BanModal';

function AdminDashboard() {
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

    // GSAP refs
    const headerRef = useRef(null);
    const statsGridRef = useRef(null);
    const tabsRef = useRef(null);
    const contentAreaRef = useRef(null);

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
                const statsRes = await fetch('http://127.0.0.1:5001/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!statsRes.ok) throw new Error("Erreur de récupération des stats");
                const statsData = await statsRes.json();
                setStats(statsData);

                // Fetch users
                const usersRes = await fetch('http://127.0.0.1:5001/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!usersRes.ok) throw new Error("Erreur de récupération des utilisateurs");
                const usersData = await usersRes.json();
                setUsersList(usersData);

                // Fetch reviews
                const reviewsRes = await fetch('http://127.0.0.1:5001/api/admin/reviews', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!reviewsRes.ok) throw new Error("Erreur de récupération des critiques");
                const reviewsData = await reviewsRes.json();
                setReviewsList(reviewsData);

                // Fetch reports
                const reportsRes = await fetch('http://127.0.0.1:5001/api/admin/reports', {
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

    // GSAP animations
    useLayoutEffect(() => {
        if (loading) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            if (headerRef.current) {
                tl.fromTo(headerRef.current, 
                    { opacity: 0, y: -20 },
                    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
                );
            }

            if (statsGridRef.current) {
                const cards = statsGridRef.current.children;
                tl.fromTo(cards,
                    { opacity: 0, y: 15 },
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
                    '-=0.2'
                );
            }

            if (tabsRef.current) {
                tl.fromTo(tabsRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3 },
                    '-=0.1'
                );
            }

            if (contentAreaRef.current) {
                tl.fromTo(contentAreaRef.current,
                    { opacity: 0, y: 15 },
                    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
                    '-=0.2'
                );
            }
        });

        return () => ctx.revert();
    }, [loading]);

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
                    const res = await fetch(`http://127.0.0.1:5001/api/admin/users/${targetUser.id}/role`, {
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
                    const res = await fetch(`http://127.0.0.1:5001/api/admin/users/${targetUser.id}`, {
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
                    const res = await fetch(`http://127.0.0.1:5001/api/admin/reviews/${reviewId}`, {
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
            const res = await fetch(`http://127.0.0.1:5001/api/admin/reports/${reportId}/resolve`, {
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
                    const res = await fetch(`http://127.0.0.1:5001/api/admin/reports/${reportId}`, {
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
                        ? `http://127.0.0.1:5001/api/admin/reviews/${targetId}`
                        : `http://127.0.0.1:5001/api/admin/users/${targetId}`;

                    const deleteRes = await fetch(deleteUrl, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const deleteData = await deleteRes.json();
                    if (!deleteRes.ok) throw new Error(deleteData.error || "Erreur lors de la suppression");

                    const resolveRes = await fetch(`http://127.0.0.1:5001/api/admin/reports/${report.id}/resolve`, {
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
                    const res = await fetch(`http://127.0.0.1:5001/api/admin/users/${targetUser.id}/warn`, {
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

        const res = await fetch(`http://127.0.0.1:5001/api/admin/users/${targetUser.id}/ban`, {
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
                    const res = await fetch(`http://127.0.0.1:5001/api/admin/users/${targetUser.id}/unban`, {
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
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
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
        const reporterMatch = r.reporter?.pseudo.toLowerCase().includes(query) || r.reporter?.email.toLowerCase().includes(query);
        const reviewMatch = r.reportedReview ? (r.reportedReview.albumName.toLowerCase().includes(query) || r.reportedReview.artistName.toLowerCase().includes(query)) : false;
        const userMatch = r.reportedUser ? (r.reportedUser.pseudo.toLowerCase().includes(query) || r.reportedUser.email.toLowerCase().includes(query)) : false;
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

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            <Sidebar
                user={user}
                currentTab="admin"
                setCurrentTab={(tab) => navigate('/', { state: { tab } })}
                handleLogout={() => { localStorage.clear(); navigate('/login'); }}
            />

            <div className="flex-1 bg-[#12101b] my-2 mr-2 rounded-lg overflow-y-auto no-scrollbar flex flex-col p-6 md:p-8">
                
                {/* Error */}
                {error && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <ShieldAlert size={48} className="text-red-500" />
                        <h2 className="text-2xl font-bold text-white">Accès refuse ou Erreur</h2>
                        <p className="text-zinc-400 max-w-sm">{error}</p>
                        <button onClick={() => navigate('/')} className="bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-2.5 rounded-full font-bold transition flex items-center gap-2 mt-2">
                            <ArrowLeft size={16} /> Retour à l'accueil
                        </button>
                    </div>
                )}

                {/* Loading */}
                {!error && loading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Disc size={52} className="text-emerald-500 animate-spin" style={{ animationDuration: '2s' }} />
                        <p className="text-zinc-400 font-semibold text-sm tracking-wide">Chargement du dashboard...</p>
                    </div>
                )}

                {/* Content */}
                {!error && !loading && (
                    <div className="space-y-8">
                        
                        {/* Header */}
                        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/40 pb-6">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <Shield className="text-emerald-500" size={28} />
                                    <h1 className="text-3xl font-extrabold tracking-tight">Dashboard d'Administration</h1>
                                </div>
                                <p className="text-zinc-400 mt-1">Supervision de Music Diary, modération des membres et des critiques.</p>
                            </div>
                            
                            {/* Action Feedback Messages */}
                            {actionMessage && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold animate-pulse self-start sm:self-center">
                                    {actionMessage}
                                </div>
                            )}
                            {actionError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-semibold animate-pulse self-start sm:self-center">
                                    {actionError}
                                </div>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div ref={statsGridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-zinc-800 transition duration-200">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Membres inscrits</div>
                                    <div className="text-2xl font-black text-white mt-0.5">{stats?.totalUsers || 0}</div>
                                </div>
                            </div>

                            <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-zinc-800 transition duration-200">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Critiques totales</div>
                                    <div className="text-2xl font-black text-white mt-0.5">{stats?.totalReviews || 0}</div>
                                </div>
                            </div>

                            <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-zinc-800 transition duration-200">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                                    <Headphones size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Comptes Spotify liés</div>
                                    <div className="text-2xl font-black text-white mt-0.5">{stats?.spotifyConnectedUsers || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs & Search Header */}
                        <div ref={tabsRef} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1824]/60 p-4 border border-zinc-800/40 rounded-2xl">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                        activeTab === 'users'
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-[#292738] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                                    }`}
                                >
                                    Utilisateurs ({filteredUsers.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                                        activeTab === 'reviews'
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-[#292738] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                                    }`}
                                >
                                    Critiques ({filteredReviews.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('reports')}
                                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                                        activeTab === 'reports'
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-[#292738] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                                    }`}
                                >
                                    <Flag size={12} className={activeTab === 'reports' ? 'text-red-500' : 'text-zinc-500'} />
                                    Signalements ({filteredReports.length})
                                    {stats?.activeReports > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                                            {stats.activeReports}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Live Search Filters */}
                            <div className="w-full md:max-w-xs">
                                {activeTab === 'users' ? (
                                    <input 
                                        type="text" 
                                        value={userSearch} 
                                        onChange={(e) => setUserSearch(e.target.value)} 
                                        placeholder="Filtrer par pseudo, email, rôle..." 
                                        className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 px-4 py-2 rounded-full text-xs font-medium outline-none text-white transition" 
                                    />
                                ) : activeTab === 'reviews' ? (
                                    <input 
                                        type="text" 
                                        value={reviewSearch} 
                                        onChange={(e) => setReviewSearch(e.target.value)} 
                                        placeholder="Filtrer par album, auteur, contenu..." 
                                        className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 px-4 py-2 rounded-full text-xs font-medium outline-none text-white transition" 
                                    />
                                ) : (
                                    <input 
                                        type="text" 
                                        value={reportSearch} 
                                        onChange={(e) => setReportSearch(e.target.value)} 
                                        placeholder="Filtrer par motif, auteur, cible..." 
                                        className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 px-4 py-2 rounded-full text-xs font-medium outline-none text-white transition" 
                                    />
                                )}
                            </div>
                        </div>

                        {/* List Area */}
                        <div ref={contentAreaRef} className="bg-[#1a1824]/30 border border-zinc-800/40 rounded-2xl overflow-hidden">
                            
                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-bold bg-[#1a1824]/60">
                                                <th className="py-4 px-6">Avatar</th>
                                                <th className="py-4 px-6">Pseudo</th>
                                                <th className="py-4 px-6">Email</th>
                                                <th className="py-4 px-6">Rôle</th>
                                                <th className="py-4 px-6 text-center">Critiques</th>
                                                <th className="py-4 px-6 text-center">Sanctions</th>
                                                <th className="py-4 px-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/40">
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="py-8 text-center text-zinc-500 text-sm font-semibold">Aucun utilisateur trouvé.</td>
                                                </tr>
                                            ) : (
                                                paginatedList.map((targetUser) => (
                                                    <tr key={targetUser.id} className="hover:bg-zinc-800/10 transition duration-150 text-sm font-medium">
                                                        <td className="py-3.5 px-6">
                                                            <div 
                                                                onClick={() => navigate(`/profile/${targetUser.id}`)}
                                                                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-emerald-400 overflow-hidden border border-zinc-700/50 cursor-pointer hover:opacity-80 transition duration-150"
                                                            >
                                                                {targetUser.avatar ? (
                                                                    <img src={targetUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    targetUser.pseudo.substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td 
                                                            onClick={() => navigate(`/profile/${targetUser.id}`)}
                                                            className="py-3.5 px-6 text-white font-bold cursor-pointer hover:text-emerald-400 transition-colors"
                                                        >
                                                            {targetUser.pseudo}
                                                        </td>
                                                        <td className="py-3.5 px-6 text-zinc-400">{targetUser.email}</td>
                                                        <td className="py-3.5 px-6">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                                                                targetUser.role === 'OWNER'
                                                                    ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_12px_rgba(250,204,21,0.1)]'
                                                                    : targetUser.role === 'ADMIN'
                                                                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                                                    : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                                                            }`}>
                                                                {targetUser.role === 'OWNER' && <Crown size={10} />}
                                                                <span>{targetUser.role}</span>
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-6 text-center text-zinc-300 font-semibold">{targetUser._count?.reviews || 0}</td>
                                                        <td className="py-3.5 px-6 text-center">
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                {targetUser.isBanned ? (
                                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/10 border border-red-500/30 text-red-400" title={`Motif : ${targetUser.banReason}`}>
                                                                        Banni
                                                                    </span>
                                                                ) : targetUser.warningsCount > 0 ? (
                                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center gap-1">
                                                                        <AlertTriangle size={10} className="text-amber-450" />
                                                                        <span>{targetUser.warningsCount} {targetUser.warningsCount > 1 ? 'Averts' : 'Avert'}</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-zinc-600 text-xs font-medium">-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-6 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {/* Warn Button */}
                                                                <button
                                                                    onClick={() => handleWarnUser(targetUser)}
                                                                    disabled={targetUser.id === user.id || targetUser.isBanned || targetUser.role === 'OWNER'}
                                                                    className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black p-2 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                                    title={targetUser.role === 'OWNER' ? "Propriétaire non modifiable" : "Envoyer un avertissement"}
                                                                >
                                                                    <AlertTriangle size={14} />
                                                                </button>

                                                                {/* Ban/Unban Button */}
                                                                {targetUser.isBanned ? (
                                                                    <button
                                                                        onClick={() => handleUnbanUser(targetUser)}
                                                                        className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black p-2 rounded-lg transition cursor-pointer"
                                                                        title="Débannir l'utilisateur"
                                                                    >
                                                                        <Unlock size={14} />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setBanModalUser(targetUser)}
                                                                        disabled={targetUser.id === user.id || targetUser.role === 'OWNER'}
                                                                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                                        title={targetUser.role === 'OWNER' ? "Propriétaire non modifiable" : "Bannir l'utilisateur"}
                                                                    >
                                                                        <Ban size={14} />
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => handleToggleRole(targetUser)}
                                                                    disabled={targetUser.id === user.id || targetUser.isBanned || targetUser.role === 'OWNER'}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                                                        targetUser.role === 'ADMIN'
                                                                            ? 'bg-[#292738] hover:bg-zinc-800 text-zinc-300'
                                                                            : targetUser.role === 'OWNER'
                                                                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                                            : 'bg-white hover:bg-zinc-200 text-black border border-zinc-700/30'
                                                                    }`}
                                                                    title={targetUser.role === 'OWNER' ? "Le rôle du Propriétaire ne peut pas être modifié" : targetUser.role === 'ADMIN' ? "Rendre utilisateur standard" : "Promouvoir administrateur"}
                                                                >
                                                                    {targetUser.role === 'OWNER' ? 'OWNER' : targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(targetUser)}
                                                                    disabled={targetUser.id === user.id || targetUser.role === 'OWNER'}
                                                                    className="bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                                    title={targetUser.role === 'OWNER' ? "Impossible de supprimer le Propriétaire" : "Supprimer définitivement l'utilisateur"}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Reviews Tab */}
                            {activeTab === 'reviews' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-bold bg-[#1a1824]/60">
                                                <th className="py-4 px-6">Album / Artiste</th>
                                                <th className="py-4 px-6 text-center">Note</th>
                                                <th className="py-4 px-6">Critique</th>
                                                <th className="py-4 px-6">Auteur</th>
                                                <th className="py-4 px-6">Date</th>
                                                <th className="py-4 px-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/40">
                                            {filteredReviews.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center text-zinc-500 text-sm font-semibold">Aucune critique trouvée.</td>
                                                </tr>
                                            ) : (
                                                paginatedList.map((rev) => (
                                                    <tr key={rev.id} className="hover:bg-zinc-800/10 transition duration-150 text-sm font-medium">
                                                        <td className="py-3.5 px-6 min-w-[200px]">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-800/60">
                                                                    {rev.albumCover ? (
                                                                        <img src={rev.albumCover} alt={rev.albumName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center"><Disc size={16} className="text-zinc-600" /></div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-white truncate">{rev.albumName}</div>
                                                                    <div className="text-xs text-zinc-500 truncate mt-0.5">{rev.artistName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-6 text-center">
                                                            <span className="text-emerald-400 font-black text-sm">{rev.rating}<span className="text-xs text-zinc-500 font-normal">/5</span></span>
                                                        </td>
                                                        <td className="py-3.5 px-6 max-w-xs">
                                                            <p className="text-zinc-300 truncate text-xs leading-relaxed" title={rev.content}>
                                                                {rev.content}
                                                            </p>
                                                        </td>
                                                        <td className="py-3.5 px-6 min-w-[120px]">
                                                            <div 
                                                                onClick={() => rev.author?.id && navigate(`/profile/${rev.author.id}`)}
                                                                className="font-bold text-zinc-200 cursor-pointer hover:text-emerald-400 transition-colors"
                                                            >
                                                                {rev.author?.pseudo}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500 truncate mt-0.5">{rev.author?.email}</div>
                                                        </td>
                                                        <td className="py-3.5 px-6 text-xs text-zinc-500 whitespace-nowrap">
                                                            {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="py-3.5 px-6 text-right">
                                                            <button
                                                                onClick={() => handleDeleteReview(rev.id)}
                                                                className="bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg transition cursor-pointer"
                                                                title="Supprimer la critique définitivement"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Reports Tab */}
                            {activeTab === 'reports' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-bold bg-[#1a1824]/60">
                                                <th className="py-4 px-6">Type / Cible</th>
                                                <th className="py-4 px-6">Motif du signalement</th>
                                                <th className="py-4 px-6">Signalé par</th>
                                                <th className="py-4 px-6">Date</th>
                                                <th className="py-4 px-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/40">
                                            {filteredReports.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="py-8 text-center text-zinc-500 text-sm font-semibold">Aucun signalement en attente.</td>
                                                </tr>
                                            ) : (
                                                paginatedList.map((report) => (
                                                    <tr key={report.id} className="hover:bg-zinc-800/10 transition duration-150 text-sm font-medium">
                                                        <td className="py-3.5 px-6 min-w-[200px]">
                                                            {report.reportedReview ? (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-800/60 flex items-center justify-center text-zinc-500">
                                                                        {report.reportedReview.albumCover ? (
                                                                            <img src={report.reportedReview.albumCover} alt={report.reportedReview.albumName} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <Disc size={18} />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Critique</span>
                                                                        <div className="font-bold text-white truncate mt-1">{report.reportedReview.albumName}</div>
                                                                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                                                                            Auteur: <span 
                                                                                onClick={() => report.reportedReview.author?.id && navigate(`/profile/${report.reportedReview.author.id}`)}
                                                                                className="cursor-pointer hover:text-emerald-400 transition-colors font-bold text-zinc-300"
                                                                            >
                                                                                {report.reportedReview.author?.pseudo}
                                                                            </span>
                                                                        </div>
                                                                        {report.reportedReview.author && (
                                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                                {report.reportedReview.author.isBanned ? (
                                                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase">Banni</span>
                                                                                ) : report.reportedReview.author.warningsCount > 0 ? (
                                                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-1">
                                                                                        <AlertTriangle size={10} className="text-amber-450" />
                                                                                        <span>{report.reportedReview.author.warningsCount} {report.reportedReview.author.warningsCount > 1 ? 'Averts' : 'Avert'}</span>
                                                                                    </span>
                                                                                ) : null}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : report.reportedUser ? (
                                                                <div className="flex items-center gap-3">
                                                                    <div 
                                                                        onClick={() => report.reportedUser?.id && navigate(`/profile/${report.reportedUser.id}`)}
                                                                        className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-emerald-400 overflow-hidden border border-zinc-700/50 flex-shrink-0 cursor-pointer hover:opacity-80 transition duration-150"
                                                                    >
                                                                        {report.reportedUser.avatar ? (
                                                                            <img src={report.reportedUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            report.reportedUser.pseudo.substring(0, 2).toUpperCase()
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">Membre</span>
                                                                        <div 
                                                                            onClick={() => report.reportedUser?.id && navigate(`/profile/${report.reportedUser.id}`)}
                                                                            className="font-bold text-white truncate mt-1 cursor-pointer hover:text-emerald-400 transition-colors"
                                                                        >
                                                                            {report.reportedUser.pseudo}
                                                                        </div>
                                                                        <div className="text-[10px] text-zinc-500 truncate">{report.reportedUser.email}</div>
                                                                        {report.reportedUser && (
                                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                                {report.reportedUser.isBanned ? (
                                                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase">Banni</span>
                                                                                ) : report.reportedUser.warningsCount > 0 ? (
                                                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-1">
                                                                                        <AlertTriangle size={10} className="text-amber-450" />
                                                                                        <span>{report.reportedUser.warningsCount} {report.reportedUser.warningsCount > 1 ? 'Averts' : 'Avert'}</span>
                                                                                    </span>
                                                                                ) : null}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-zinc-500 italic">Contenu supprimé</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-6 max-w-xs">
                                                            <p className="text-zinc-200 text-xs leading-relaxed font-semibold italic">"{report.reason}"</p>
                                                            {report.reportedReview && (
                                                                <div className="text-[10px] text-zinc-500 bg-black/25 p-2 rounded border border-zinc-800/40 mt-1.5 max-h-12 overflow-y-auto no-scrollbar font-normal">
                                                                    Contenu: "{report.reportedReview.content}"
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-6">
                                                            <div 
                                                                 onClick={() => report.reporter?.id && navigate(`/profile/${report.reporter.id}`)}
                                                                 className="font-bold text-zinc-300 cursor-pointer hover:text-emerald-400 transition-colors"
                                                             >
                                                                 {report.reporter?.pseudo}
                                                             </div>
                                                             <div className="text-[10px] text-zinc-500 mt-0.5">{report.reporter?.email}</div>
                                                         </td>
                                                        <td className="py-3.5 px-6 text-xs text-zinc-500 whitespace-nowrap">
                                                            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td className="py-3.5 px-6 text-right">
                                                            <div className="flex justify-end items-center gap-2">
                                                                {/* Quick Sanctions for reported author */}
                                                                {(() => {
                                                                    const author = report.reportedReview ? report.reportedReview.author : report.reportedUser;
                                                                    if (!author || author.id === user.id || author.role === 'OWNER') return null;
                                                                    return (
                                                                        <div className="flex gap-1 border-r border-zinc-800/80 pr-2 mr-1">
                                                                            <button
                                                                                onClick={() => handleWarnUser(author)}
                                                                                disabled={author.isBanned}
                                                                                className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black p-1.5 rounded transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                                                title={`Avertir ${author.pseudo}`}
                                                                            >
                                                                                <AlertTriangle size={12} />
                                                                            </button>
                                                                            {!author.isBanned && (
                                                                                <button
                                                                                    onClick={() => setBanModalUser(author)}
                                                                                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1.5 rounded transition cursor-pointer"
                                                                                    title={`Bannir ${author.pseudo}`}
                                                                                >
                                                                                    <Ban size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}

                                                                <button
                                                                    onClick={() => handleResolveReport(report.id)}
                                                                    className="bg-[#292738] hover:bg-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                                                                    title="Conserver le contenu signalé et archiver le signalement"
                                                                >
                                                                    Conserver
                                                                </button>
                                                                {(report.reportedReview || report.reportedUser) && (
                                                                    <button
                                                                        onClick={() => handleDeleteReportedContent(report)}
                                                                        className="bg-red-500 hover:bg-red-600 text-black px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1"
                                                                        title="Supprimer définitivement le contenu signalé"
                                                                    >
                                                                        <Trash2 size={12} fill="black" /> Supprimer
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDismissReport(report.id)}
                                                                    className="bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 p-1.5 rounded-lg transition cursor-pointer"
                                                                    title="Rejeter et supprimer le signalement"
                                                                >
                                                                    Rejeter
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between p-4 border-t border-zinc-850 bg-[#1a1824]/40 select-none">
                                    <div className="text-xs text-zinc-500 font-semibold">
                                        Affichage de <span className="text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-zinc-300">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur <span className="text-zinc-300">{totalItems}</span> résultats
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 rounded-xl bg-[#292738] hover:bg-zinc-800 text-xs font-bold text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition duration-150 cursor-pointer border border-zinc-700/20"
                                        >
                                            Précédent
                                        </button>
                                        
                                        <div className="flex items-center gap-1.5">
                                            {Array.from({ length: totalPages }).map((_, idx) => {
                                                const pageNum = idx + 1;
                                                if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                                    if (pageNum === 2 || pageNum === totalPages - 1) {
                                                        return <span key={pageNum} className="text-zinc-600 text-xs px-0.5">...</span>;
                                                    }
                                                    return null;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                                            currentPage === pageNum
                                                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/10'
                                                                : 'bg-[#292738]/50 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 rounded-xl bg-[#292738] hover:bg-zinc-800 text-xs font-bold text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition duration-150 cursor-pointer border border-zinc-700/20"
                                        >
                                            Suivant
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
                )}

            </div>

            {/* Modal de confirmation */}
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

            {/* Modal de bannissement */}
            {banModalUser && (
                <BanModal
                    userToBan={banModalUser}
                    onConfirm={handleBanUserSubmit}
                    onClose={() => setBanModalUser(null)}
                />
            )}

        </div>
    );
}

export default AdminDashboard;
