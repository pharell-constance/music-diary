import { Flag } from 'lucide-react';

export default function AdminFilters({
    activeTab,
    setActiveTab,
    filteredUsersCount,
    filteredReviewsCount,
    filteredReportsCount,
    activeReportsCount,
    userSearch,
    setUserSearch,
    reviewSearch,
    setReviewSearch,
    reportSearch,
    setReportSearch
}) {
    return (
        <div className="neobrutal-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#1a1824]">
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pill-btn px-5 py-2 ${activeTab === 'users' ? 'active' : 'inactive'}`}
                >
                    Utilisateurs ({filteredUsersCount})
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pill-btn px-5 py-2 ${activeTab === 'reviews' ? 'active' : 'inactive'}`}
                >
                    Critiques ({filteredReviewsCount})
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`pill-btn px-5 py-2 flex items-center gap-2 ${activeTab === 'reports' ? 'active' : 'inactive'}`}
                >
                    <Flag size={11} />
                    Signalements ({filteredReportsCount})
                    {activeReportsCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                            {activeReportsCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Live Search Filters */}
            <div className="w-full md:max-w-xs">
                {activeTab === 'users' ? (
                    <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Filtrer par pseudo, rôle..."
                        className="w-full px-4 py-2.5 text-xs"
                    />
                ) : activeTab === 'reviews' ? (
                    <input
                        type="text"
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        placeholder="Filtrer par album, auteur, contenu..."
                        className="w-full px-4 py-2.5 text-xs"
                    />
                ) : (
                    <input
                        type="text"
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        placeholder="Filtrer par motif, auteur, cible..."
                        className="w-full px-4 py-2.5 text-xs"
                    />
                )}
            </div>
        </div>
    );
}
