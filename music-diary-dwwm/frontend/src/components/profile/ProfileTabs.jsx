function ProfileTabs({ profileTab, setProfileTab, connected }) {
    return (
        <div className="flex gap-6 border-b border-zinc-800/40 pb-2 mb-2 text-sm">
            <button
                onClick={() => setProfileTab('journal')}
                className={`pb-2 font-bold border-b-2 transition-all cursor-pointer ${
                    profileTab === 'journal'
                        ? 'border-emerald-500 text-white'
                        : 'border-transparent text-zinc-400 hover:text-white'
                }`}
            >
                Journal de Bord
            </button>
            <button
                onClick={() => setProfileTab('mur')}
                className={`pb-2 font-bold border-b-2 transition-all cursor-pointer ${
                    profileTab === 'mur'
                        ? 'border-emerald-500 text-white'
                        : 'border-transparent text-zinc-400 hover:text-white'
                }`}
            >
                Mur de Lyrics
            </button>
            {connected && (
                <button
                    onClick={() => setProfileTab('spotify')}
                    className={`pb-2 font-bold border-b-2 transition-all cursor-pointer ${
                        profileTab === 'spotify'
                            ? 'border-emerald-500 text-white'
                            : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                >
                    Statistiques Spotify
                </button>
            )}
            <button
                onClick={() => setProfileTab('stats')}
                className={`pb-2 font-bold border-b-2 transition-all cursor-pointer ${
                    profileTab === 'stats'
                        ? 'border-emerald-500 text-white'
                        : 'border-transparent text-zinc-400 hover:text-white'
                }`}
            >
                Analyses & Wrapped
            </button>
        </div>
    );
}

export default ProfileTabs;

