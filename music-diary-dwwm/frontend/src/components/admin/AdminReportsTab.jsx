import { useNavigate } from 'react-router-dom';
import { Disc, AlertTriangle, Ban, Trash2 } from 'lucide-react';

function AdminReportsTab({
    paginatedReports,
    currentUser,
    onWarnUser,
    onBanUser,
    onResolveReport,
    onDeleteReportedContent,
    onDismissReport
}) {
    const navigate = useNavigate();

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-bold bg-[#1a1824]/60">
                        <th className="py-4 px-6">Type / Cible</th>
                        <th className="py-4 px-6">Motif du signalement</th>
                        <th className="py-4 px-6">Signalé par</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                    {paginatedReports.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-zinc-500 text-sm font-semibold">Aucun signalement en attente.</td>
                        </tr>
                    ) : (
                        paginatedReports.map((report) => (
                            <tr key={report.id} className="hover:bg-zinc-800/10 transition duration-150 text-sm font-medium">
                                <td className="py-3.5 px-6 min-w-[200px]">
                                    {report.reportedReview ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-800/60 flex items-center justify-center text-zinc-500">
                                                {report.reportedReview.albumCover ? (
                                                    <img src={report.reportedReview.albumCover} alt={report.reportedReview.albumName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Disc size={18} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Critique</span>
                                                <div className="font-bold text-white truncate mt-1">{report.reportedReview.albumName}</div>
                                                <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                                                    Auteur: <span 
                                                        onClick={() => report.reportedReview.author?.id && navigate(`/profile/${report.reportedReview.author.id}`)}
                                                        className="cursor-pointer hover:text-emerald-400 transition-colors font-bold text-zinc-300"
                                                    >
                                                        {report.reportedReview.author?.pseudo}
                                                    </span>
                                                </div>
                                                {report.reportedReview.author && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {report.reportedReview.author.isBanned ? (
                                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase">Banni</span>
                                                        ) : report.reportedReview.author.warningsCount > 0 ? (
                                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-1">
                                                                <AlertTriangle size={10} className="text-amber-450" />
                                                                <span>{report.reportedReview.author.warningsCount} {report.reportedReview.author.warningsCount > 1 ? 'Averts' : 'Avert'}</span>
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : report.reportedUser ? (
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => report.reportedUser?.id && navigate(`/profile/${report.reportedUser.id}`)}
                                                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-emerald-400 overflow-hidden border border-zinc-700/50 flex-shrink-0 cursor-pointer hover:opacity-80 transition duration-150"
                                            >
                                                {report.reportedUser.avatar ? (
                                                    <img src={report.reportedUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    report.reportedUser.pseudo.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">Membre</span>
                                                <div 
                                                    onClick={() => report.reportedUser?.id && navigate(`/profile/${report.reportedUser.id}`)}
                                                    className="font-bold text-white truncate mt-1 cursor-pointer hover:text-emerald-400 transition-colors"
                                                >
                                                    {report.reportedUser.pseudo}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 truncate">{report.reportedUser.email}</div>
                                                {report.reportedUser && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {report.reportedUser.isBanned ? (
                                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase">Banni</span>
                                                        ) : report.reportedUser.warningsCount > 0 ? (
                                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-1">
                                                                <AlertTriangle size={10} className="text-amber-450" />
                                                                <span>{report.reportedUser.warningsCount} {report.reportedUser.warningsCount > 1 ? 'Averts' : 'Avert'}</span>
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-500 italic">Contenu supprimé</span>
                                    )}
                                </td>
                                <td className="py-3.5 px-6 max-w-xs">
                                    <p className="text-zinc-200 text-xs leading-relaxed font-semibold italic">"{report.reason}"</p>
                                    {report.reportedReview && (
                                        <div className="text-[10px] text-zinc-500 bg-black/25 p-2 rounded border border-zinc-800/40 mt-1.5 max-h-12 overflow-y-auto no-scrollbar font-normal">
                                            Contenu: "{report.reportedReview.content}"
                                        </div>
                                    )}
                                </td>
                                <td className="py-3.5 px-6">
                                    <div 
                                         onClick={() => report.reporter?.id && navigate(`/profile/${report.reporter.id}`)}
                                         className="font-bold text-zinc-300 cursor-pointer hover:text-emerald-400 transition-colors"
                                     >
                                         {report.reporter?.pseudo}
                                     </div>
                                     <div className="text-[10px] text-zinc-500 mt-0.5">{report.reporter?.email}</div>
                                 </td>
                                <td className="py-3.5 px-6 text-xs text-zinc-500 whitespace-nowrap">
                                    {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {/* Quick Sanctions for reported author */}
                                        {(() => {
                                            const author = report.reportedReview ? report.reportedReview.author : report.reportedUser;
                                            if (!author || author.id === currentUser?.id || author.role === 'OWNER') return null;
                                            return (
                                                <div className="flex gap-1 border-r border-zinc-800/80 pr-2 mr-1">
                                                    <button
                                                        onClick={() => onWarnUser(author)}
                                                        disabled={author.isBanned}
                                                        className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black p-1.5 rounded transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={`Avertir ${author.pseudo}`}
                                                    >
                                                        <AlertTriangle size={12} />
                                                    </button>
                                                    {!author.isBanned && (
                                                        <button
                                                            onClick={() => onBanUser(author)}
                                                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1.5 rounded transition cursor-pointer"
                                                            title={`Bannir ${author.pseudo}`}
                                                        >
                                                            <Ban size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        <button
                                            onClick={() => onResolveReport(report.id)}
                                            className="bg-[#292738] hover:bg-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                                            title="Conserver le contenu signalé et archiver le signalement"
                                        >
                                            Conserver
                                        </button>
                                        {(report.reportedReview || report.reportedUser) && (
                                            <button
                                                onClick={() => onDeleteReportedContent(report)}
                                                className="bg-red-500 hover:bg-red-600 text-black px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1"
                                                title="Supprimer définitivement le contenu signalé"
                                            >
                                                <Trash2 size={12} fill="black" /> Supprimer
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onDismissReport(report.id)}
                                            className="bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 p-1.5 rounded-lg transition cursor-pointer"
                                            title="Rejeter et supprimer le signalement"
                                        >
                                            Rejeter
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AdminReportsTab;
