import { useState, useEffect, useRef } from 'react';
import { X, Ban, AlertOctagon } from 'lucide-react';
import gsap from 'gsap';

function BanModal({ userToBan, onConfirm, onClose }) {
    const [reason, setReason] = useState('');
    const [presetReason, setPresetReason] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const backdropRef = useRef(null);
    const modalRef = useRef(null);

    const presets = [
        "Comportement haineux ou harcèlement répétitif",
        "Spam, publicité non autorisée ou comportement de bot",
        "Pseudo, bio ou avatar inapproprié",
        "Non respect des conditions d'utilisation",
        "Autre motif (préciser ci-dessous)"
    ];

    useEffect(() => {
        gsap.fromTo(backdropRef.current, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.25, ease: 'power2.out' }
        );
        gsap.fromTo(modalRef.current, 
            { y: 25, scale: 0.96, opacity: 0 }, 
            { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.1)', delay: 0.03 }
        );
    }, []);

    const handleClose = () => {
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
                    onComplete: onClose
                });
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        let finalReason = presetReason;
        if (!presetReason) {
            setError("Veuillez choisir ou spécifier un motif.");
            return;
        }

        if (presetReason.includes("Autre") && !reason.trim()) {
            setError("Veuillez préciser la raison dans le champ de saisie.");
            return;
        }

        if (reason.trim()) {
            finalReason = reason.trim();
        }

        setSubmitting(true);
        try {
            await onConfirm(finalReason);
            handleClose();
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors du bannissement.");
            setSubmitting(false);
        }
    };

    return (
        <div 
            ref={backdropRef} 
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
            onClick={handleClose}
        >
            <div 
                ref={modalRef} 
                className="bg-[#1a1824] border border-zinc-800 p-6 rounded-2xl w-full max-w-md relative shadow-2xl flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={handleClose} 
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:scale-105 transition duration-200 cursor-pointer"
                    disabled={submitting}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                        <Ban size={22} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-white">Bannir un membre</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Membre ciblé : <span className="text-zinc-300 font-bold">{userToBan?.pseudo}</span> ({userToBan?.email})
                        </p>
                    </div>
                </div>

                {/* Warning Card */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3.5 flex gap-3 text-xs text-red-400">
                    <AlertOctagon size={18} className="flex-shrink-0 mt-0.5 text-red-500" />
                    <div>
                        <span className="font-bold">Attention :</span> Cet utilisateur ne pourra plus se connecter et toutes ses requêtes d'API seront rejetées. Ses critiques et profil resteront masqués ou inaccessibles.
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-950/50 text-red-400 p-3 text-center rounded-xl text-xs font-semibold border border-red-500/10">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reason presets */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Motif du bannissement</label>
                        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                            {presets.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => {
                                        setPresetReason(preset);
                                        if (!preset.includes("Autre")) {
                                            setReason('');
                                        }
                                    }}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition border flex items-center justify-between cursor-pointer ${
                                        presetReason === preset
                                            ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-sm'
                                             : 'bg-[#292738] border-zinc-800/40 text-zinc-300 hover:text-white hover:bg-[#2c2c2c]'
                                    }`}
                                >
                                    <span>{preset}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom detail reason input */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Description / Précisions</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Saisissez des précisions sur le bannissement..."
                            rows={3}
                            className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded-xl text-xs text-white outline-none resize-none h-20 transition"
                            disabled={submitting}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800/40">
                        <button 
                            type="button" 
                            onClick={handleClose} 
                            className="text-zinc-500 hover:text-white font-bold py-2 px-4 rounded-full text-xs transition cursor-pointer"
                            disabled={submitting}
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className="bg-red-500 hover:bg-red-600 text-black font-black py-2 px-6 rounded-full text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? "Bannissement..." : "Confirmer le bannissement"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default BanModal;
