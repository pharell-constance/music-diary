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
    type = "danger" // "danger", "warning", "info", "success"
}) {
    const backdropRef = useRef(null);
    const modalRef = useRef(null);

    // GSAP entrance
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

    // Handle close with GSAP exit animation to make it smooth
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

    const handleConfirm = () => {
        handleClose(onConfirm);
    };

    const handleCancel = () => {
        handleClose(onCancel);
    };

    // Styling configurations based on action type
    const getThemeConfig = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <Trash2 size={22} />,
                    iconClass: "bg-red-500/10 border border-red-500/20 text-red-400",
                    btnClass: "bg-red-500 hover:bg-red-600 text-black font-black",
                    borderHighlight: "border-red-500/10"
                };
            case 'warning':
                return {
                    icon: <AlertTriangle size={22} />,
                    iconClass: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
                    btnClass: "bg-amber-500 hover:bg-amber-600 text-black font-black",
                    borderHighlight: "border-amber-500/10"
                };
            case 'success':
                return {
                    icon: <Info size={22} />,
                    iconClass: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
                    btnClass: "bg-emerald-500 hover:bg-emerald-600 text-black font-black",
                    borderHighlight: "border-emerald-500/10"
                };
            case 'info':
            default:
                return {
                    icon: <HelpCircle size={22} />,
                    iconClass: "bg-blue-500/10 border border-blue-500/20 text-blue-400",
                    btnClass: "bg-white hover:bg-zinc-200 text-black font-black",
                    borderHighlight: "border-zinc-800/60"
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
                className="bg-[#1a1824] border border-zinc-800 p-6 rounded-2xl w-full max-w-md relative shadow-2xl flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={handleCancel} 
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:scale-105 transition duration-200 cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3.5 border-b border-zinc-800/80 pb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${theme.iconClass}`}>
                        {theme.icon}
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-white">{title}</h3>
                    </div>
                </div>

                {/* Message */}
                <div className="py-2">
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/40">
                    <button 
                        onClick={handleCancel} 
                        className="text-zinc-400 hover:text-white font-bold py-2 px-5 rounded-full text-xs transition cursor-pointer hover:bg-zinc-800/40"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className={`${theme.btnClass} py-2 px-6 rounded-full text-xs transition cursor-pointer active:scale-95 shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
