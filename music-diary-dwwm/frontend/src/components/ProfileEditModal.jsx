import { useState } from 'react';
import { X, User } from 'lucide-react';

function ProfileEditModal({ user, onSave, onClose }) {
    const [pseudo, setPseudo] = useState(user?.pseudo || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatar, setAvatar] = useState(user?.avatar || null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');

        if (!file.type.startsWith('image/')) {
            setError("Le fichier sélectionné doit être une image.");
            return;
        }

        // Limit size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            setError("L'image est trop volumineuse (max 5 Mo).");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!pseudo.trim() || !email.trim()) {
            setError("Le pseudo et l'email sont obligatoires.");
            return;
        }

        if (password) {
            if (password.length < 6) {
                setError("Le mot de passe doit faire au moins 6 caractères.");
                return;
            }
            if (password !== confirmPassword) {
                setError("Les mots de passe ne correspondent pas.");
                return;
            }
        }

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://127.0.0.1:5001/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pseudo: pseudo.trim(),
                    email: email.trim(),
                    password: password || undefined,
                    avatar: avatar // Base64 DataURL or null
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue lors de la mise à jour.");
            }

            setSuccess("Profil mis à jour avec succès !");
            onSave(data.user);
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#1a1824] border border-zinc-800 p-6 rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer">
                    <X size={20} />
                </button>

                <h3 className="font-extrabold text-xl text-white mb-6 border-b border-zinc-800 pb-4">
                    Modifier mon profil
                </h3>

                {error && (
                    <div className="bg-red-950/50 border border-red-500/30 text-red-400 p-3 mb-4 text-center rounded text-sm font-semibold">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 p-3 mb-4 text-center rounded text-sm font-semibold">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image de profil (PFP) Upload */}
                    <div className="flex flex-col items-center gap-3 mb-6 bg-[#292738]/40 p-4 rounded-lg border border-zinc-800/60">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Photo de profil</label>
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-700 bg-[#12101b] flex items-center justify-center group shadow-inner">
                            {avatar ? (
                                <img src={avatar} alt="Aperçu" className="w-full h-full object-cover" />
                            ) : (
                                <User size={36} className="text-zinc-500" />
                            )}
                        </div>
                        <div className="flex gap-2">
                            <label className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-1.5 px-4 rounded-full text-xs cursor-pointer transition select-none">
                                Choisir une image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            {avatar && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    className="bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/40 font-bold py-1.5 px-4 rounded-full text-xs cursor-pointer transition"
                                >
                                    Supprimer
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-300 mb-2">Pseudo</label>
                        <input
                            type="text"
                            required
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            placeholder="Votre pseudo"
                            className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-sm text-white outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-zinc-300 mb-2">Adresse Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Votre adresse email"
                            className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-sm text-white outline-none"
                        />
                    </div>

                    <div className="border-t border-zinc-800 pt-4 mt-4">
                        <h4 className="text-sm font-bold text-zinc-400 mb-3">Changer le mot de passe (optionnel)</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Laissez vide si inchangé"
                                    className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-sm text-white outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Confirmer le nouveau mot de passe</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirmez le mot de passe"
                                    className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-[#A7A7A7] hover:text-white font-bold py-2.5 px-5 rounded-full text-xs cursor-pointer transition"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="bg-[#8B5CF6] hover:bg-[#A78BFA] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black py-2.5 px-6 rounded-full text-xs cursor-pointer transition shadow-lg"
                            disabled={loading}
                        >
                            {loading ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfileEditModal;
