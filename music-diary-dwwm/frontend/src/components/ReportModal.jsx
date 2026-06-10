import { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import gsap from 'gsap';

function ReportModal({ reportedType, reportedName, onSubmit, onClose }) {
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const backdropRef = useRef(null);
    const modalRef = useRef(null);

    const presetReasons = reportedType === 'review' 
        ? [
            "Propos inappropriés / Injurieux",
            "Contenu haineux / Discriminatoire",
            "Spam / Publicité indésirable",
            "Autre (préciser ci-dessous)"
          ]
        : [
            "Pseudo / Avatar inapproprié",
            "Comportement suspect / Harcèlement",
            "Spam / Bot",
            "Autre (préciser ci-dessous)"
          ];

    // GSAP entrance
    useEffect(() => {
        gsap.fromTo(backdropRef.current, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        gsap.fromTo(modalRef.current, 
            { y: 30, scale: 0.96, opacity: 0 }, 
            { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.15)', delay: 0.05 }
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedReason) {
            setError("Veuillez sélectionner un motif de signalement.");
            return;
        }

        let finalReason = selectedReason;
        if (selectedReason.includes("Autre") && !details.trim()) {
            setError("Veuillez préciser la raison dans le champ de texte.");
            return;
        }

        if (details.trim()) {
            finalReason = `${selectedReason} : ${details.trim()}`;
        }

        setSubmitting(true);
        try {
            await onSubmit(finalReason);
        } catch (err) {
            setError(err.message || "Une erreur est survenue.");
            setSubmitting(false);
        }
    };

    return (
        <div ref={backdropRef} className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div ref={modalRef} className="bg-[#181818] border border-zinc-800 p-6 rounded-2xl w-full max-w-md relative shadow-2xl flex flex-col gap-4">
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:scale-105 transition duration-200 cursor-pointer"
                    disabled={submitting}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-white">Signaler du contenu</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Cible : <span className="text-zinc-300 font-bold">{reportedName}</span> ({reportedType === 'review' ? 'Chronique' : 'Membre'})
                        </p>
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
                    <div className="space-y-2.5">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Motif du signalement</label>
                        <div className="flex flex-col gap-2">
                            {presetReasons.map((reason) => (
                                <button
                                    key={reason}
                                    type="button"
                                    onClick={() => setSelectedReason(reason)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition border flex items-center justify-between cursor-pointer ${
                                        selectedReason === reason
                                            ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-sm'
                                            : 'bg-[#242424] border-zinc-800/40 text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                                    }`}
                                >
                                    <span>{reason}</span>
                                    {selectedReason === reason && <Check size={14} className="text-red-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Details input */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Précisions (optionnel)</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder={selectedReason.includes("Autre") ? "Veuillez expliquer en détail..." : "Ajoutez des précisions complémentaires..."}
                            rows={3}
                            className="w-full bg-[#242424] border border-transparent focus:border-zinc-500 p-3 rounded-xl text-xs text-white outline-none resize-none h-20 transition"
                            disabled={submitting}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800/40">
                        <button 
                            type="button" 
                            onClick={onClose} 
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
                            {submitting ? "Envoi..." : "Envoyer le signalement"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default ReportModal;
