import { Users, MessageSquare, Headphones } from 'lucide-react';

export default function AdminStatsGrid({ stats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-zinc-800 transition duration-200">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Users size={24} />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Membres inscrits</div>
                    <div className="text-2xl font-black text-white mt-0.5">{stats?.totalUsers || 0}</div>
                </div>
            </div>

            <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-zinc-800 transition duration-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <MessageSquare size={24} />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Critiques totales</div>
                    <div className="text-2xl font-black text-white mt-0.5">{stats?.totalReviews || 0}</div>
                </div>
            </div>

            <div className="bg-[#1a1824] border border-zinc-800/40 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-zinc-800 transition duration-200">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Headphones size={24} />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Comptes Spotify liés</div>
                    <div className="text-2xl font-black text-white mt-0.5">{stats?.spotifyConnectedUsers || 0}</div>
                </div>
            </div>
        </div>
    );
}
