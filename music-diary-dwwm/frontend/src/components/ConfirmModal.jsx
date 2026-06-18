import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Trash2, HelpCircle, Info } from 'lucide-react';
import gsap from 'gsap';

function ConfirmModal({ 
    title = "Confirmation", 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Confirmer", 
    cancelText = "Annuler",
    type = "danger"
}) {
    const backdropRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(backdropRef.current, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.25, ease: 'power2.out' }
        );
        gsap.fromTo(modalRef.current, 
            { y: 20, scale: 0.96, opacity: 0 }, 
            { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.1)', delay: 0.02 }
        );
    }, []);

    const handleClose = (callback) => {
        gsap.to(modalRef.current, { 
            y: 15, 
            scale: 0.96, 
            opacity: 0, 
            duration: 0.2, 
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(backdropRef.current, {
                    opacity: 0,
                    duration: 0.15,
                    ease: 'power2.in',
                    onComplete: callback
                });
            }
        });
    };

    const handleConfirm = () => handleClose(onConfirm);
    const handleCancel = () => handleClose(onCancel);

    const getThemeConfig = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <Trash2 size={22} />,
                    iconClass: "bg-red-500/10 border-2 border-red-500/40 text-red-400",
                    btnClass: "bg-red-500 hover:bg-red-600 text-white font-mouse-memoirs border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]",
                };
            case 'warning':
                return {
                    icon: <AlertTriangle size={22} />,
                    iconClass: "bg-amber-500/10 border-2 border-amber-500/40 text-amber-400",
                    btnClass: "bg-amber-500 hover:bg-amber-600 text-black font-mouse-memoirs border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]",
                };
            case 'success':
                return {
                    icon: <Info size={22} />,
                    iconClass: "bg-violet-500/10 border-2 border-violet-500/40 text-violet-400",
                    btnClass: "bg-violet-500 hover:bg-violet-400 text-white font-mouse-memoirs border-2 border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]",
                };
            case 'info':
            default:
                return {
                    icon: <HelpCircle size={22} />,
                    iconClass: "bg-fuchsia-500/10 border-2 border-fuchsia-500/40 text-fuchsia-400",
                    btnClass: "bg-white hover:bg-zinc-200 text-black font-mouse-memoirs border-2 border-white",
                };
        }
    };

    const theme = getThemeConfig();

    return (
        <div 
            ref={backdropRef} 
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
            onClick={handleCancel}
        >
            <div 
                ref={modalRef} 
                className="neo-modal w-full max-w-md relative p-7 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={handleCancel} 
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl border-2 border-white/20 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition duration-200 cursor-pointer"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3.5 pb-4 border-b-2 border-white/[0.07]">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${theme.iconClass}`}>
                        {theme.icon}
                    </div>
                    <h3 className="font-mouse-memoirs uppercase tracking-wider text-xl text-white">{title}</h3>
                </div>

                {/* Message */}
                <div className="py-1">
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t-2 border-white/[0.05]">
                    <button 
                        onClick={handleCancel} 
                        className="neobrutal-btn text-zinc-400 hover:text-white font-mouse-memoirs uppercase tracking-widest py-2 px-5 rounded-full text-xs border-2 border-zinc-600 hover:border-white transition cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className={`${theme.btnClass} py-2 px-6 rounded-full text-xs transition cursor-pointer uppercase tracking-widest active:scale-95`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
