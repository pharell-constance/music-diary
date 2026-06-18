function ProfileTabs({ profileTab, setProfileTab, connected }) {
    const tabs = [
        { key: 'journal', label: 'Journal de Bord' },
        { key: 'mur', label: 'Mur de Lyrics' },
        ...(connected ? [{ key: 'spotify', label: 'Stats Spotify' }] : []),
        { key: 'stats', label: 'Analyses & Wrapped' },
    ];

    return (
        <div className="flex gap-2 flex-wrap select-none mb-2">
            {tabs.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setProfileTab(key)}
                    className={`pill-btn px-5 py-2 ${profileTab === key ? 'active' : 'inactive'}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

export default ProfileTabs;
