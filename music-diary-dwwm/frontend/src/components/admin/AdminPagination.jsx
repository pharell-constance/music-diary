export default function AdminPagination({
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between p-4 border-t border-zinc-850 bg-[#1a1824]/40 select-none">
            <div className="text-xs text-zinc-500 font-semibold">
                Affichage de <span className="text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="text-zinc-300">{Math.min(currentPage * itemsPerPage, totalItems)}</span> sur <span className="text-zinc-300">{totalItems}</span> résultats
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl bg-[#292738] hover:bg-zinc-800 text-xs font-bold text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition duration-150 cursor-pointer border border-zinc-700/20"
                >
                    Précédent
                </button>
                
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                            if (pageNum === 2 || pageNum === totalPages - 1) {
                                return <span key={pageNum} className="text-zinc-600 text-xs px-0.5">...</span>;
                            }
                            return null;
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                    currentPage === pageNum
                                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/10'
                                        : 'bg-[#292738]/50 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl bg-[#292738] hover:bg-zinc-800 text-xs font-bold text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition duration-150 cursor-pointer border border-zinc-700/20"
                >
                    Suivant
                </button>
            </div>
        </div>
    );
}
