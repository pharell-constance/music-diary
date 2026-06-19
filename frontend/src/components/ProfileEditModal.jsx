import API_URL from '../config.js';
import { useState } from 'react';
import { X, User } from 'lucide-react';

function ProfileEditModal({ user, onSave, onClose }) {
    const [pseudo, setPseudo] = useState(user?.pseudo || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [statusEmoji, setStatusEmoji] = useState(user?.statusEmoji || '');
    const [statusText, setStatusText] = useState(user?.statusText || '');
    const [favArtistId, setFavArtistId] = useState(user?.favArtistId || null);
    const [favArtistName, setFavArtistName] = useState(user?.favArtistName || '');
    const [favArtistImage, setFavArtistImage] = useState(user?.favArtistImage || '');
    const [artistQuery, setArtistQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearchArtist = async () => {
        if (!artistQuery.trim()) return;
        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(artistQuery)}&type=artist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.artists && data.artists.items) {
                setSearchResults(data.artists.items);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error("Erreur recherche artiste:", err);
        } finally {
            setSearching(false);
        }
    };
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

        if (!pseudo.trim()) {
            setError("Le pseudo est obligatoire.");
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
            const response = await fetch('${API_URL}/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pseudo: pseudo.trim(),
                    bio: bio.trim(),
                    statusEmoji: statusEmoji.trim(),
                    statusText: statusText.trim(),
                    favArtistId: favArtistId,
                    favArtistName: favArtistName,
                    favArtistImage: favArtistImage,
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
            <div className="profile-edit-modal bg-[#1a1824] border border-zinc-800 p-6 rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                
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
                        <label className="block text-sm font-bold text-zinc-300 mb-2">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Décrivez-vous en quelques mots..."
                            rows={3}
                            className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-sm text-white outline-none resize-none custom-scrollbar"
                            maxLength={160}
                        />
                        <p className="text-[10px] text-zinc-500 font-medium text-right mt-1">{bio.length}/160</p>
                    </div>

                    <div className="bg-[#292738]/20 p-4 rounded-xl border border-zinc-800/80 space-y-3">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Statut (Style GitHub)</label>
                        <div className="flex gap-2.5">
                            {/* Emoji Picker / Select */}
                            <div className="w-16">
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={statusEmoji}
                                    onChange={(e) => setStatusEmoji(e.target.value)}
                                    placeholder="💬"
                                    className="w-full text-center bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-lg outline-none text-white"
                                    title="Emoji de statut"
                                />
                            </div>
                            {/* Text Input */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    maxLength={30}
                                    value={statusText}
                                    onChange={(e) => setStatusText(e.target.value)}
                                    placeholder="Qu'avez-vous en tête ?"
                                    className="w-full bg-[#292738] border border-transparent focus:border-zinc-500 p-3 rounded text-sm text-white outline-none"
                                />
                            </div>
                        </div>
                        {/* Quick select suggestions for premium UX */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {['🎧 Écoute', '🚀 Dispo', '💻 Dev', '📚 Étudie', '😴 Fatigué', '🔥 En forme'].map((suggest) => {
                                const [em, ...txtParts] = suggest.split(' ');
                                const txt = txtParts.join(' ');
                                return (
                                    <button
                                        key={suggest}
                                        type="button"
                                        onClick={() => {
                                            setStatusEmoji(em);
                                            setStatusText(txt);
                                        }}
                                        className="bg-[#292738] hover:bg-zinc-700 text-zinc-300 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                                    >
                                        {suggest}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusEmoji('');
                                    setStatusText('');
                                }}
                                className="bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                            >
                                Effacer
                            </button>
                        </div>
                    </div>

                    {/* Artiste Préféré Section */}
                    <div className="bg-[#292738]/20 p-4 rounded-xl border border-zinc-800/80 space-y-4">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Artiste Préféré</label>
                        
                        {/* Display currently selected artist */}
                        {favArtistId ? (
                            <div className="flex items-center justify-between bg-[#292738]/40 p-3 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
                                        {favArtistImage ? (
                                            <img src={favArtistImage} alt={favArtistName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-400">?</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{favArtistName}</div>
                                        <div className="text-[10px] text-zinc-500 font-medium">Artiste sélectionné</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFavArtistId(null);
                                        setFavArtistName('');
                                        setFavArtistImage('');
                                    }}
                                    className="bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 font-bold py-1 px-3.5 rounded-full text-[10px] cursor-pointer transition"
                                >
                                    Retirer
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={artistQuery}
                                        onChange={(e) => setArtistQuery(e.target.value)}
                                        placeholder="Rechercher un artiste sur Spotify..."
                                        className="flex-1 bg-[#292738] border border-transparent focus:border-zinc-500 p-2.5 rounded text-xs text-white outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearchArtist();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchArtist}
                                        disabled={searching}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-4 rounded text-xs transition cursor-pointer"
                                    >
                                        {searching ? "Recherche..." : "Chercher"}
                                    </button>
                                </div>

                                {/* Search results display */}
                                {searchResults.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar bg-[#12101b] border border-zinc-850 rounded-lg p-2 divide-y divide-zinc-800/40">
                                        {searchResults.map((art) => {
                                            const artImg = art.images?.[art.images.length - 1]?.url || art.images?.[0]?.url || '';
                                            return (
                                                <div
                                                    key={art.id}
                                                    onClick={() => {
                                                        setFavArtistId(art.id);
                                                        setFavArtistName(art.name);
                                                        setFavArtistImage(artImg);
                                                        setSearchResults([]);
                                                        setArtistQuery('');
                                                    }}
                                                    className="flex items-center gap-3 p-2 hover:bg-[#292738]/50 rounded-md cursor-pointer transition"
                                                >
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                                                        {artImg ? (
                                                            <img src={artImg} alt={art.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-850 flex items-center justify-center font-bold text-[8px] text-zinc-500">?</div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-zinc-200 hover:text-white truncate">{art.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
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
