import { useEffect, useState } from 'react';

export default function NeobrutalLoader({ isLoading }) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let timer;
        if (isLoading) {
            setVisible(true);
            setProgress(0);
            
            // Simuler la progression jusqu'à 92%
            timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 92) {
                        clearInterval(timer);
                        return 92;
                    }
                    // Progression asymptotique (ralentit en approchant de la fin)
                    const step = Math.max(1, Math.floor((100 - prev) * 0.15));
                    return prev + step;
                });
            }, 60);
        } else {
            setProgress(100);
            timer = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 300);
        }

        return () => {
            clearInterval(timer);
            clearTimeout(timer);
        };
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none select-none">
            {/* Barre de progression neobrutaliste */}
            <div className="w-full h-3 bg-white dark:bg-[#121214] border-b-3 border-black relative overflow-hidden">
                <div 
                    className="h-full bg-[#facc15] border-r-3 border-black transition-all duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            {/* Badge flottant avec pourcentage */}
            <div 
                className="absolute top-5 right-6 bg-[#db2777] text-white border-3 border-black rounded-xl px-4 py-1.5 font-mouse-memoirs text-sm tracking-widest shadow-[3px_3px_0px_#000000] flex items-center gap-2 transition-all duration-200"
                style={{ 
                    transform: progress === 100 ? 'scale(0.8) translateY(-10px)' : 'scale(1) translateY(0)',
                    opacity: progress === 100 ? 0 : 1
                }}
            >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>CHARGEMENT... {progress}%</span>
            </div>
        </div>
    );
}
