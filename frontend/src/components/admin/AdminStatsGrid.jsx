import { Users, MessageSquare, Headphones } from 'lucide-react';

export default function AdminStatsGrid({ stats }) {
    const cards = [
        {
            icon: <Users size={22} />,
            iconBg: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
            label: 'Membres inscrits',
            value: stats?.totalUsers || 0,
        },
        {
            icon: <MessageSquare size={22} />,
            iconBg: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
            label: 'Critiques totales',
            value: stats?.totalReviews || 0,
        },
        {
            icon: <Headphones size={22} />,
            iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
            label: 'Comptes Spotify liés',
            value: stats?.spotifyConnectedUsers || 0,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map((card, i) => (
                <div key={i} className="neo-stat-card p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                        {card.icon}
                    </div>
                    <div>
                        <div className="text-[10px] font-mouse-memoirs uppercase tracking-widest text-zinc-500">{card.label}</div>
                        <div className="text-3xl font-modak text-white mt-0.5 text-stroke-dark">{card.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
