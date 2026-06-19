import { BookOpen, Quote, Disc, TrendingUp } from 'lucide-react';

function ProfileTabs({ profileTab, setProfileTab, connected }) {
    const tabs = [
        { key: 'journal', label: 'Journal de Bord', icon: BookOpen },
        { key: 'mur', label: 'Mur de Lyrics', icon: Quote },
        ...(connected ? [{ key: 'spotify', label: 'Stats Spotify', icon: Disc }] : []),
        { key: 'stats', label: 'Analyses & Wrapped', icon: TrendingUp },
    ];

    return (
        <div className="flex gap-2 flex-wrap select-none mb-2">
            {tabs.map(({ key, label, icon: Icon }) => (
                <button
                    key={key}
                    onClick={() => setProfileTab(key)}
                    className={`pill-btn px-5 py-2 flex items-center gap-2 ${profileTab === key ? 'active' : 'inactive'}`}
                >
                    <Icon size={14} />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}

export default ProfileTabs;

