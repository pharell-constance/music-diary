export default function AdminPagination({
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    itemsPerPage
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between p-4 border-t-2 border-white/[0.05] bg-[#1a1824]/30 select-none flex-wrap gap-3">
            <div className="text-xs font-mouse-memoirs uppercase tracking-wider text-zinc-500">
                <span className="text-zinc-300">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' – '}
                <span className="text-zinc-300">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
                {' sur '}
                <span className="text-zinc-300">{totalItems}</span>
                {' résultats'}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="pill-btn inactive px-4 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    ← Précédent
                </button>
                
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                            if (pageNum === 2 || pageNum === totalPages - 1) {
                                return <span key={pageNum} className="text-zinc-600 text-xs px-0.5">…</span>;
                            }
                            return null;
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-xl text-xs font-mouse-memoirs uppercase transition flex items-center justify-center cursor-pointer border-2 ${
                                    currentPage === pageNum
                                        ? 'bg-violet-600 text-white border-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)]'
                                        : 'bg-transparent text-zinc-400 hover:text-white border-zinc-700 hover:border-white'
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
                    className="pill-btn inactive px-4 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Suivant →
                </button>
            </div>
        </div>
    );
}
