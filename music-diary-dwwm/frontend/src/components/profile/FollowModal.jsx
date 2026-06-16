import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function FollowModal({ show, type, followList, loadingFollowList, onClose }) {
    const navigate = useNavigate();
    const modalRef = useRef(null);

    useLayoutEffect(() => {
        if (!modalRef.current || !show) return;
        gsap.fromTo(
            modalRef.current,
            { y: 40, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }
        );
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="bg-[#1a1824] border border-zinc-800 w-full max-w-md overflow-hidden flex flex-col shadow-2xl rounded-2xl">
                {/* Header */}
                <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tight text-white capitalize">
                        {type === 'followers' ? 'Abonnés' : 'Abonnements'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-semibold p-1 bg-transparent border-none outline-none"
                    >
                        Fermer
                    </button>
                </div>

                {/* List Area */}
                <div className="p-4 max-h-[350px] overflow-y-auto flex-1 space-y-2">
                    {loadingFollowList ? (
                        <div className="text-center py-8 text-zinc-400 text-sm">
                            Chargement...
                        </div>
                    ) : followList.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-sm">
                            {type === 'followers'
                                ? "Aucun abonné pour le moment."
                                : "Aucun abonnement pour le moment."}
                        </div>
                    ) : (
                        followList.map((usr) => (
                            <div
                                key={usr.id}
                                onClick={() => {
                                    onClose();
                                    navigate(`/profile/${usr.id}`);
                                }}
                                className="flex items-center gap-3 p-3 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/30 rounded-xl transition-all duration-200 cursor-pointer group hover:border-emerald-500/20"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md flex items-center justify-center font-bold text-sm text-black border border-zinc-800 group-hover:border-emerald-500/40 transition-colors duration-200 flex-shrink-0 overflow-hidden">
                                    {usr.avatar ? (
                                        <img src={usr.avatar} alt={usr.pseudo} className="w-full h-full object-cover" />
                                    ) : (
                                        usr.pseudo ? usr.pseudo.substring(0, 2).toUpperCase() : <User size={16} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-200">
                                        {usr.pseudo}
                                    </div>
                                    <div className="text-xs text-zinc-500 truncate mt-0.5">
                                        {usr.email}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default FollowModal;
