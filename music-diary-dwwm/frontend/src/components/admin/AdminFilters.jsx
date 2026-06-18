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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1824]/60 p-4 border border-zinc-800/40 rounded-2xl">
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'users'
                            ? 'bg-white text-black shadow-md'
                            : 'bg-[#292738] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                    }`}
                >
                    Utilisateurs ({filteredUsersCount})
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'reviews'
                            ? 'bg-white text-black shadow-md'
                            : 'bg-[#292738] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                    }`}
                >
                    Critiques ({filteredReviewsCount})
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === 'reports'
                            ? 'bg-white text-black shadow-md'
                            : 'bg-[#292738] text-[#A7A7A7] hover:text-white hover:bg-zinc-800/40 border border-zinc-800/30'
                    }`}
                >
                    <Flag size={12} className={activeTab === 'reports' ? 'text-red-500' : 'text-zinc-500'} />
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
                        className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 px-4 py-2 rounded-full text-xs font-medium outline-none text-white transition" 
                    />
                ) : activeTab === 'reviews' ? (
                    <input 
                        type="text" 
                        value={reviewSearch} 
                        onChange={(e) => setReviewSearch(e.target.value)} 
                        placeholder="Filtrer par album, auteur, contenu..." 
                        className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 px-4 py-2 rounded-full text-xs font-medium outline-none text-white transition" 
                    />
                ) : (
                    <input 
                        type="text" 
                        value={reportSearch} 
                        onChange={(e) => setReportSearch(e.target.value)} 
                        placeholder="Filtrer par motif, auteur, cible..." 
                        className="w-full bg-[#292738] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-zinc-500 px-4 py-2 rounded-full text-xs font-medium outline-none text-white transition" 
                    />
                )}
            </div>
        </div>
    );
}
