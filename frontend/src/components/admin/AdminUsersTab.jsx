import { useNavigate } from 'react-router-dom';
import { Crown, AlertTriangle, Unlock, Ban, Trash2 } from 'lucide-react';

function AdminUsersTab({
    paginatedUsers,
    currentUser,
    onWarnUser,
    onBanUser,
    onUnbanUser,
    onToggleRole,
    onDeleteUser
}) {
    const navigate = useNavigate();

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-zinc-800/40 text-[10px] uppercase tracking-wider text-zinc-500 font-bold bg-[#1a1824]/60 whitespace-nowrap">
                        <th className="py-4 px-6">Avatar</th>
                        <th className="py-4 px-6">Pseudo</th>

                        <th className="py-4 px-6">Rôle</th>
                        <th className="py-4 px-6 text-center">Critiques</th>
                        <th className="py-4 px-6 text-center">Sanctions</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                    {paginatedUsers.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="py-8 text-center text-zinc-500 text-sm font-semibold">Aucun utilisateur trouvé.</td>
                        </tr>
                    ) : (
                        paginatedUsers.map((targetUser) => (
                            <tr key={targetUser.id} className="hover:bg-zinc-800/10 transition duration-150 text-sm font-medium">
                                <td className="py-3.5 px-6">
                                    <div 
                                        onClick={() => navigate(`/profile/${targetUser.id}`)}
                                        className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-emerald-400 overflow-hidden border border-zinc-700/50 cursor-pointer hover:opacity-80 transition duration-150"
                                    >
                                        {targetUser.avatar ? (
                                            <img src={targetUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            targetUser.pseudo.substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                </td>
                                <td 
                                    onClick={() => navigate(`/profile/${targetUser.id}`)}
                                    className="py-3.5 px-6 text-white font-bold cursor-pointer hover:text-emerald-400 transition-colors"
                                >
                                    {targetUser.pseudo}
                                </td>

                                <td className="py-3.5 px-6">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                                        targetUser.role === 'OWNER'
                                            ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_12px_rgba(250,204,21,0.1)]'
                                            : targetUser.role === 'ADMIN'
                                            ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                            : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                                    }`}>
                                        {targetUser.role === 'OWNER' && <Crown size={10} />}
                                        <span>{targetUser.role}</span>
                                    </span>
                                </td>
                                <td className="py-3.5 px-6 text-center text-zinc-300 font-semibold">{targetUser._count?.reviews || 0}</td>
                                <td className="py-3.5 px-6 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        {targetUser.isBanned ? (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/10 border border-red-500/30 text-red-400" title={`Motif : ${targetUser.banReason}`}>
                                                Banni
                                            </span>
                                        ) : targetUser.warningsCount > 0 ? (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center gap-1">
                                                <AlertTriangle size={10} className="text-amber-450" />
                                                <span>{targetUser.warningsCount} {targetUser.warningsCount > 1 ? 'Averts' : 'Avert'}</span>
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600 text-xs font-medium">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {/* Warn Button */}
                                        <button
                                            onClick={() => onWarnUser(targetUser)}
                                            disabled={targetUser.id === currentUser?.id || targetUser.isBanned || targetUser.role === 'OWNER'}
                                            className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black p-2 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                            title={targetUser.role === 'OWNER' ? "Propriétaire non modifiable" : "Envoyer un avertissement"}
                                        >
                                            <AlertTriangle size={14} />
                                        </button>

                                        {/* Ban/Unban Button */}
                                        {targetUser.isBanned ? (
                                            <button
                                                onClick={() => onUnbanUser(targetUser)} // Wait, unban user is handled by onToggleRole or direct callback? Let's check: it's handleUnbanUser(targetUser) in the dashboard, so let's call onBanUser(targetUser) for both or onUnbanUser? Let's pass a dedicated prop or handle it in parent.
                                                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black p-2 rounded-lg transition cursor-pointer"
                                                title="Débannir l'utilisateur"
                                            >
                                                <Unlock size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onBanUser(targetUser)}
                                                disabled={targetUser.id === currentUser?.id || targetUser.role === 'OWNER'}
                                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={targetUser.role === 'OWNER' ? "Propriétaire non modifiable" : "Bannir l'utilisateur"}
                                            >
                                                <Ban size={14} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onToggleRole(targetUser)}
                                            disabled={targetUser.id === currentUser?.id || targetUser.isBanned || targetUser.role === 'OWNER'}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                                targetUser.role === 'ADMIN'
                                                    ? 'bg-[#292738] hover:bg-zinc-800 text-zinc-300'
                                                    : targetUser.role === 'OWNER'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : 'bg-white hover:bg-zinc-200 text-black border border-zinc-700/30'
                                            }`}
                                            title={targetUser.role === 'OWNER' ? "Le rôle du Propriétaire ne peut pas être modifié" : targetUser.role === 'ADMIN' ? "Rendre utilisateur standard" : "Promouvoir administrateur"}
                                        >
                                            {targetUser.role === 'OWNER' ? 'OWNER' : targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                                        </button>
                                        <button
                                            onClick={() => onDeleteUser(targetUser)}
                                            disabled={targetUser.id === currentUser?.id || targetUser.role === 'OWNER'}
                                            className="bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                            title={targetUser.role === 'OWNER' ? "Impossible de supprimer le Propriétaire" : "Supprimer définitivement l'utilisateur"}
                                        >
                                            <Trash2 size={14} />
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

export default AdminUsersTab;
