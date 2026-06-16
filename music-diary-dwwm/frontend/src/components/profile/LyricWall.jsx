import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Plus, X, Music, Search, Quote } from 'lucide-react';

const PALETTES = [
    { label: 'Vert', value: '#8B5CF6' },
    { label: 'Violet', value: '#7C3AED' },
    { label: 'Rose', value: '#EC4899' },
    { label: 'Bleu', value: '#3B82F6' },
    { label: 'Orange', value: '#F97316' },
    { label: 'Rouge', value: '#EF4444' },
    { label: 'Cyan', value: '#06B6D4' },
];

/** Mélange une couleur hex pour le fond des cartes (version sombre) */
function hexToCardStyle(hex) {
    return {
        background: `linear-gradient(135deg, ${hex}22 0%, ${hex}11 100%)`,
        borderColor: `${hex}44`,
        accentColor: hex,
    };
}

// ── Formulaire d'ajout ─────────────────────────────────────────────────────────
function AddPinForm({ onAdd, onClose, token }) {
    const [lyric, setLyric] = useState('');
    const [trackName, setTrackName] = useState('');
    const [artistName, setArtistName] = useState('');
    const [albumCover, setAlbumCover] = useState('');
    const [color, setColor] = useState('#8B5CF6');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(formRef.current,
            { y: 40, opacity: 0, scale: 0.96 },
            { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }
        );
    }, []);

    async function handleSearch(e) {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`http://127.0.0.1:5001/api/search?q=${encodeURIComponent(searchQuery)}&type=track`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSearchResults((data.tracks?.items || []).slice(0, 6));
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }

    function selectTrack(track) {
        setTrackName(track.name);
        setArtistName(track.artists?.map(a => a.name).join(', ') || '');
        setAlbumCover(track.album?.images?.[0]?.url || '');
        setSearchResults([]);
        setSearchQuery('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!lyric.trim() || !trackName.trim() || !artistName.trim()) {
            setError('Paroles, titre et artiste sont requis.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('http://127.0.0.1:5001/api/lyric-pins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ lyric, trackName, artistName, albumCover, color })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            onAdd(data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={formRef} className="bg-[#1a1824] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Quote size={18} className="text-emerald-400" />
                        <h3 className="text-base font-black text-white">Épingler des paroles</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Recherche Spotify */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rechercher le morceau</label>
                        <div className="flex gap-2">
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
                                placeholder="Nom du morceau ou artiste…"
                                className="flex-1 bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 transition"
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2.5 rounded-xl border border-zinc-700/50 transition cursor-pointer"
                            >
                                {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                            </button>
                        </div>
                        {searchResults.length > 0 && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/60">
                                {searchResults.map(track => (
                                    <button
                                        key={track.id}
                                        type="button"
                                        onClick={() => selectTrack(track)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 transition cursor-pointer text-left"
                                    >
                                        <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                                            {track.album?.images?.[0] && <img src={track.album.images[0].url} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-white truncate">{track.name}</div>
                                            <div className="text-[10px] text-zinc-400 truncate">{track.artists?.map(a => a.name).join(', ')}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Morceau sélectionné */}
                    {(trackName || artistName) && (
                        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                            {albumCover && <img src={albumCover} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">{trackName}</div>
                                <div className="text-[10px] text-zinc-400 truncate">{artistName}</div>
                            </div>
                            <button type="button" onClick={() => { setTrackName(''); setArtistName(''); setAlbumCover(''); }} className="ml-auto text-zinc-500 hover:text-zinc-300 cursor-pointer bg-transparent border-none flex-shrink-0">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Champs manuels si pas de Spotify */}
                    {!trackName && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Titre</label>
                                <input value={trackName} onChange={e => setTrackName(e.target.value)} placeholder="Titre du morceau" className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 transition" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Artiste</label>
                                <input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artiste" className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 transition" />
                            </div>
                        </div>
                    )}

                    {/* Paroles */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Paroles à épingler</label>
                        <textarea
                            value={lyric}
                            onChange={e => setLyric(e.target.value)}
                            placeholder="Colle ici les paroles qui te touchent…"
                            rows={4}
                            className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 transition resize-none leading-relaxed"
                        />
                    </div>

                    {/* Couleur */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Couleur de la carte</label>
                        <div className="flex gap-2 flex-wrap">
                            {PALETTES.map(p => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setColor(p.value)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${color === p.value ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: p.value }}
                                    title={p.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Aperçu */}
                    <div className="rounded-xl p-4 border" style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`, borderColor: `${color}44` }}>
                        <Quote size={14} style={{ color }} className="mb-2 opacity-70" />
                        <p className="text-white text-sm font-medium leading-relaxed italic whitespace-pre-wrap">
                            {lyric || 'Aperçu de tes paroles…'}
                        </p>
                        {(trackName || artistName) && (
                            <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTopColor: `${color}33`, borderTopWidth: 1 }}>
                                {albumCover && <img src={albumCover} alt="" className="w-6 h-6 rounded object-cover" />}
                                <span className="text-[10px] text-zinc-400 font-semibold truncate">{trackName} {artistName && `— ${artistName}`}</span>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-400 text-xs font-semibold">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-3 rounded-xl text-sm transition cursor-pointer active:scale-95"
                    >
                        {submitting ? 'Épinglage…' : 'Épingler sur le mur'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Carte lyric ────────────────────────────────────────────────────────────────
function LyricCard({ pin, isOwnProfile, onDelete }) {
    const style = hexToCardStyle(pin.color);

    return (
        <div
            className="anim-card relative group rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl break-inside-avoid mb-4"
            style={{ background: style.background, borderColor: style.borderColor }}
        >
            {/* Bouton suppression */}
            {isOwnProfile && (
                <button
                    onClick={() => onDelete(pin.id)}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/40 hover:bg-red-500 text-zinc-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer border-none"
                >
                    <X size={12} />
                </button>
            )}

            {/* Guillemets décoratifs */}
            <Quote size={18} style={{ color: style.accentColor }} className="mb-3 opacity-60" />

            {/* Paroles */}
            <p className="text-white text-sm font-medium leading-relaxed italic whitespace-pre-wrap">
                {pin.lyric}
            </p>

            {/* Infos morceau */}
            <div
                className="flex items-center gap-2 mt-4 pt-3"
                style={{ borderTopColor: `${pin.color}33`, borderTopWidth: 1 }}
            >
                {pin.albumCover ? (
                    <img src={pin.albumCover} alt={pin.trackName} className="w-8 h-8 rounded object-cover flex-shrink-0 shadow" />
                ) : (
                    <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${pin.color}22` }}>
                        <Music size={14} style={{ color: style.accentColor }} />
                    </div>
                )}
                <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">{pin.trackName}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{pin.artistName}</div>
                </div>
            </div>
        </div>
    );
}

// ── Composant principal ────────────────────────────────────────────────────────
function LyricWall({ pins, isOwnProfile, onAdd, onDelete, token }) {
    const [showForm, setShowForm] = useState(false);
    const wallRef = useRef(null);

    useEffect(() => {
        if (!wallRef.current || !pins.length) return;
        const cards = wallRef.current.querySelectorAll('.anim-card');
        gsap.fromTo(
            cards,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: { each: 0.05, from: 'start' }, ease: 'power3.out', clearProps: 'all' }
        );
    }, [pins]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Quote className="text-emerald-400" size={24} />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Mur de Lyrics</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {pins.length === 0 ? 'Aucune parole épinglée' : `${pins.length} parole${pins.length > 1 ? 's' : ''} épinglée${pins.length > 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>
                {isOwnProfile && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-4 py-2 rounded-full text-xs transition cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={14} />
                        Épingler des paroles
                    </button>
                )}
            </div>

            {/* Mur masonry */}
            {pins.length === 0 ? (
                <div className="text-center py-20 bg-[#1a1824]/40 rounded-2xl border border-zinc-800/40">
                    <Quote size={40} className="text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 text-sm font-medium">
                        {isOwnProfile
                            ? 'Ton mur est vide — épingle tes paroles préférées !'
                            : 'Cet utilisateur n\'a pas encore épinglé de paroles.'}
                    </p>
                    {isOwnProfile && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-5 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-5 py-2.5 rounded-full text-xs transition cursor-pointer active:scale-95"
                        >
                            <Plus size={14} /> Commencer
                        </button>
                    )}
                </div>
            ) : (
                <div
                    ref={wallRef}
                    style={{
                        columnCount: 'auto',
                        columnWidth: '280px',
                        columnGap: '1rem',
                    }}
                >
                    {pins.map(pin => (
                        <LyricCard
                            key={pin.id}
                            pin={pin}
                            isOwnProfile={isOwnProfile}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}

            {/* Modal formulaire */}
            {showForm && (
                <AddPinForm
                    token={token}
                    onAdd={onAdd}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
}

export default LyricWall;
