import { useEffect, useState, useRef } from 'react';
import { Bell, UserPlus, AlertTriangle, Info, Trash2, Check, CheckCheck, Disc } from 'lucide-react';
import gsap from 'gsap';

function NotificationsTab() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    const containerRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    // GSAP animation
    useEffect(() => {
        if (!loading && notifications.length > 0 && containerRef.current) {
            gsap.fromTo(containerRef.current.children,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
            );
        }
    }, [loading, notifications.length]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:5001/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Impossible de charger les notifications.");
            const data = await res.json();
            setNotifications(data || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const res = await fetch(`http://127.0.0.1:5001/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                // Dispatch event to update unread badge in other components
                window.dispatchEvent(new Event('unread-notifications-changed'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`http://127.0.0.1:5001/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // GSAP exit animation on target item could go here, for simplicity we update state
                setNotifications(prev => prev.filter(n => n.id !== id));
                window.dispatchEvent(new Event('unread-notifications-changed'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const res = await fetch('http://127.0.0.1:5001/api/notifications/read', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                window.dispatchEvent(new Event('unread-notifications-changed'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearAll = async () => {
        const confirmClear = window.confirm("Voulez-vous supprimer toutes vos notifications ?");
        if (!confirmClear) return;

        try {
            const res = await fetch('http://127.0.0.1:5001/api/notifications', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications([]);
                window.dispatchEvent(new Event('unread-notifications-changed'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to get notification design system parameters
    const getNotificationStyles = (type) => {
        switch (type) {
            case 'FOLLOW':
                return {
                    icon: <UserPlus size={18} />,
                    iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
                    borderClass: 'border-purple-500/10'
                };
            case 'WARNING':
                return {
                    icon: <AlertTriangle size={18} />,
                    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                    borderClass: 'border-amber-500/10'
                };
            case 'SYSTEM':
            default:
                return {
                    icon: <Info size={18} />,
                    iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
                    borderClass: 'border-blue-500/10'
                };
        }
    };

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/40 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">Centre de Notifications</h1>
                    <p className="text-[#A7A7A7] text-sm">Restez informé de l'activité sur votre compte Music Diary.</p>
                </div>

                {notifications.length > 0 && (
                    <div className="flex gap-2.5">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="bg-[#242424] hover:bg-zinc-800 border border-zinc-800/60 text-zinc-300 px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <CheckCheck size={14} /> Tout lu
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Trash2 size={14} /> Tout effacer
                        </button>
                    </div>
                )}
            </header>

            {/* Error view */}
            {error && (
                <div className="bg-red-950/20 border border-red-500/10 text-red-400 p-4 rounded-xl text-center text-sm font-semibold">
                    {error}
                </div>
            )}

            {/* Loading view */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Disc size={44} className="text-[#1DB954] animate-spin" style={{ animationDuration: '2s' }} />
                    <p className="text-zinc-500 font-semibold text-xs tracking-wider">Chargement des notifications...</p>
                </div>
            )}

            {/* Empty view */}
            {!loading && notifications.length === 0 && (
                <div className="text-center py-20 bg-[#181818]/60 border border-zinc-800/30 rounded-2xl flex flex-col items-center justify-center p-6 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 shadow-inner">
                        <Bell size={24} />
                    </div>
                    <h3 className="font-bold text-base text-zinc-300">Aucune notification</h3>
                    <p className="text-zinc-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                        Vous recevrez des alertes ici lorsque d'autres membres s'abonneront à votre compte ou lors des décisions de modération.
                    </p>
                </div>
            )}

            {/* Notifications List */}
            {!loading && notifications.length > 0 && (
                <div ref={containerRef} className="flex flex-col gap-3">
                    {notifications.map((notif) => {
                        const styles = getNotificationStyles(notif.type);
                        return (
                            <div
                                key={notif.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group ${
                                    notif.read 
                                        ? 'bg-[#181818]/20 border-zinc-800/30 opacity-70' 
                                        : `bg-[#181818] border-zinc-800/80 hover:border-zinc-700/80 shadow-md`
                                }`}
                            >
                                {/* Unread dot indicator */}
                                {!notif.read && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954] flex-shrink-0 animate-pulse" title="Non lu" />
                                )}

                                {/* Icon Category */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${styles.iconBg}`}>
                                    {styles.icon}
                                </div>

                                {/* Content message */}
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`text-xs sm:text-sm font-semibold leading-relaxed break-words ${notif.read ? 'text-zinc-400' : 'text-white'}`}>
                                        {notif.content}
                                    </p>
                                    <span className="text-[10px] text-zinc-500 font-medium block mt-1.5">
                                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {/* Action controls */}
                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                                    {!notif.read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            className="p-2 bg-[#242424] hover:bg-[#1DB954] text-zinc-400 hover:text-black rounded-lg transition cursor-pointer"
                                            title="Marquer comme lu"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notif.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition cursor-pointer"
                                        title="Supprimer la notification"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default NotificationsTab;
