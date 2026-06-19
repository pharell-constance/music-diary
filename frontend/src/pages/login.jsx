import API_URL from '../config.js';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc } from 'lucide-react';

function Login() {
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pseudo, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Identifiants incorrects");
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setSuccess("Connexion réussie ! Redirection...");

            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#07050f] text-white font-sans overflow-y-auto flex flex-col items-center justify-center py-12 px-4 relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Logo / Header */}
            <div className="mb-10 text-center flex items-center justify-center gap-3.5 relative z-10 group cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
                <div className="w-11 h-11 bg-violet-600 border-2.5 border-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all duration-300">
                    <Disc className="text-white stroke-[2.5] animate-spin-slow" style={{ animationDuration: '8s' }} size={20} />
                </div>
                <span className="font-mouse-memoirs text-4xl tracking-widest uppercase leading-none text-stroke-dark text-violet-500 group-hover:text-fuchsia-500 transition-colors">
                    Music Diary
                </span>
            </div>

            {/* Neobrutalist Form Card with strong borders and offset shadow */}
            <div className="neobrutal-card bg-[#1a1824] border-4 border-white p-8 md:p-12 rounded-3xl w-full max-w-[480px] shadow-[8px_8px_0px_0px_var(--color-violet-500)] relative z-10">

                <h2 className="font-modak text-4xl sm:text-5xl text-violet-500 text-stroke-dark mb-8 text-center rotate-[-2deg] hover:rotate-0 hover:scale-105 transition duration-200">
                    Connexion
                </h2>

                {error && (
                    <div className="bg-red-500/10 border-2 border-red-500 text-red-200 p-3.5 mb-6 rounded-2xl text-sm font-semibold text-center shadow-[3px_3px_0px_rgba(239,68,68,0.15)]">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-violet-500/10 border-2 border-violet-500 text-violet-200 p-3.5 mb-6 rounded-2xl text-sm font-semibold text-center shadow-[3px_3px_0px_rgba(139,92,246,0.15)]">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Pseudo */}
                    <div className="space-y-2">
                        <label className="block text-lg font-mouse-memoirs uppercase tracking-widest text-fuchsia-400">
                            Pseudo
                        </label>
                        <input
                            type="text"
                            required
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            className="w-full bg-[#292738] border-2 border-white focus:border-violet-500 focus:ring-0 p-3.5 rounded-2xl text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-200 shadow-[3px_3px_0px_rgba(255,255,255,0.05)]"
                            placeholder="Votre pseudo"
                        />
                    </div>

                    {/* Mot de passe */}
                    <div className="space-y-2">
                        <label className="block text-lg font-mouse-memoirs uppercase tracking-widest text-fuchsia-400">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#292738] border-2 border-white focus:border-violet-500 focus:ring-0 p-3.5 rounded-2xl text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-200 shadow-[3px_3px_0px_rgba(255,255,255,0.05)]"
                            placeholder="Mot de passe"
                        />
                    </div>

                    {/* Bouton Connexion */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            className="w-full neobrutal-btn bg-violet-600 hover:bg-violet-500 text-white font-modak uppercase tracking-wider py-4 rounded-full text-xl shadow-[4px_4px_0px_#fff] hover:shadow-[5px_5px_0px_#fff] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-200"
                        >
                            Se connecter
                        </button>
                    </div>
                </form>

                <hr className="border-white/10 my-8" />

                <p className="text-center text-zinc-400 text-xs font-semibold">
                    Vous n'avez pas de compte ?{' '}
                    <Link to="/register" className="text-white hover:text-violet-400 underline font-bold transition-colors">
                        Inscrivez-vous ici
                    </Link>.
                </p>
            </div>
        </div>
    );
}

export default Login;