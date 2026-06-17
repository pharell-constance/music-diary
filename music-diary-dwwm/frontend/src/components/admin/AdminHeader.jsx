import { Shield } from 'lucide-react';

export default function AdminHeader({ actionMessage, actionError }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/40 pb-6">
            <div>
                <div className="flex items-center gap-2.5">
                    <Shield className="text-emerald-500" size={28} />
                    <h1 className="text-3xl font-extrabold tracking-tight">Dashboard d'Administration</h1>
                </div>
                <p className="text-zinc-400 mt-1">Supervision de Music Diary, modération des membres et des critiques.</p>
            </div>
            
            {/* Action Feedback Messages */}
            {actionMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-semibold animate-pulse self-start sm:self-center">
                    {actionMessage}
                </div>
            )}
            {actionError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-semibold animate-pulse self-start sm:self-center">
                    {actionError}
                </div>
            )}
        </div>
    );
}
