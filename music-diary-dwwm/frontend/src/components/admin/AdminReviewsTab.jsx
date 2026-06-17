import { useNavigate } from 'react-router-dom';
import { Disc, Trash2 } from 'lucide-react';

function AdminReviewsTab({ paginatedReviews, onDeleteReview }) {
    const navigate = useNavigate();

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-bold bg-[#1a1824]/60">
                        <th className="py-4 px-6">Album / Artiste</th>
                        <th className="py-4 px-6 text-center">Note</th>
                        <th className="py-4 px-6">Critique</th>
                        <th className="py-4 px-6">Auteur</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                    {paginatedReviews.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="py-8 text-center text-zinc-500 text-sm font-semibold">Aucune critique trouvée.</td>
                        </tr>
                    ) : (
                        paginatedReviews.map((rev) => (
                            <tr key={rev.id} className="hover:bg-zinc-800/10 transition duration-150 text-sm font-medium">
                                <td className="py-3.5 px-6 min-w-[200px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-800/60">
                                            {rev.albumCover ? (
                                                <img src={rev.albumCover} alt={rev.albumName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Disc size={16} className="text-zinc-600" /></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-white truncate">{rev.albumName}</div>
                                            <div className="text-xs text-zinc-500 truncate mt-0.5">{rev.artistName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3.5 px-6 text-center">
                                    <span className="text-emerald-400 font-black text-sm">{rev.rating}<span className="text-xs text-zinc-500 font-normal">/5</span></span>
                                </td>
                                <td className="py-3.5 px-6 max-w-xs">
                                    <p className="text-zinc-300 truncate text-xs leading-relaxed" title={rev.content}>
                                        {rev.content}
                                    </p>
                                </td>
                                <td className="py-3.5 px-6 min-w-[120px]">
                                    <div 
                                        onClick={() => rev.author?.id && navigate(`/profile/${rev.author.id}`)}
                                        className="font-bold text-zinc-200 cursor-pointer hover:text-emerald-400 transition-colors"
                                    >
                                        {rev.author?.pseudo}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{rev.author?.email}</div>
                                </td>
                                <td className="py-3.5 px-6 text-xs text-zinc-500 whitespace-nowrap">
                                    {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                    <button
                                        onClick={() => onDeleteReview(rev.id)}
                                        className="bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg transition cursor-pointer"
                                        title="Supprimer la critique définitivement"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AdminReviewsTab;
