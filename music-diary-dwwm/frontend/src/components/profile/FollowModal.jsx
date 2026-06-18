import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { User, X } from 'lucide-react';
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="neo-modal w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 pb-4 border-b-2 border-white/[0.07] flex items-center justify-between">
                    <h3 className="font-mouse-memoirs uppercase tracking-wide text-xl text-white">
                        {type === 'followers' ? 'Abonnés' : 'Abonnements'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl border-2 border-white/20 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* List Area */}
                <div className="p-4 max-h-[350px] overflow-y-auto flex-1 space-y-2 custom-scrollbar">
                    {loadingFollowList ? (
                        <div className="space-y-2 py-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="skeleton h-14 w-full" />
                            ))}
                        </div>
                    ) : followList.length === 0 ? (
                        <div className="text-center py-10 font-mouse-memoirs uppercase tracking-wider text-zinc-500 text-sm">
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
                                className="neo-list-item flex items-center gap-3 p-3 cursor-pointer group bg-transparent hover:bg-violet-500/[0.04]"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 border-2 border-white shadow-[2px_2px_0px_rgba(255,255,255,0.1)] flex items-center justify-center font-bold text-sm text-white flex-shrink-0 overflow-hidden">
                                    {usr.avatar ? (
                                        <img src={usr.avatar} alt={usr.pseudo} className="w-full h-full object-cover" />
                                    ) : (
                                        usr.pseudo ? usr.pseudo.substring(0, 2).toUpperCase() : <User size={16} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <div className="font-mouse-memoirs uppercase tracking-wider text-sm text-white truncate group-hover:text-violet-400 transition-colors duration-200">
                                        {usr.pseudo}
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
