import { Shield } from 'lucide-react';

export default function AdminHeader({ actionMessage, actionError }) {
    return (
        <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border-2 border-violet-500/40 flex items-center justify-center text-violet-400">
                        <Shield size={20} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-mouse-memoirs uppercase tracking-wide text-white text-stroke-dark">
                        Dashboard Admin
                    </h1>
                </div>
                <p className="text-zinc-400 text-sm font-medium mt-1">Supervision de Music Diary, modération des membres et des critiques.</p>
            </div>
            
            {/* Action Feedback Messages */}
            {actionMessage && (
                <div className="border-2 border-violet-500/40 bg-violet-500/10 text-violet-300 px-4 py-2 rounded-2xl text-xs font-mouse-memoirs uppercase tracking-widest animate-pulse self-start sm:self-center">
                    {actionMessage}
                </div>
            )}
            {actionError && (
                <div className="border-2 border-red-500/40 bg-red-500/10 text-red-300 px-4 py-2 rounded-2xl text-xs font-mouse-memoirs uppercase tracking-widest animate-pulse self-start sm:self-center">
                    {actionError}
                </div>
            )}
        </div>
    );
}
