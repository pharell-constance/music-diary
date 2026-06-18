import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    // --- LOGIQUE (Inchappée) ---
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
            const response = await fetch('http://127.0.0.1:5001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pseudo, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue");
            }

            setSuccess("Inscription réussie ! Redirection vers la connexion...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            setError(err.message);
        }
    };

    // --- DESIGN (Style Spotify v4) ---
    return (
        <div className="min-h-screen w-full bg-[#07050f] text-white font-sans overflow-y-auto flex flex-col items-center justify-center py-12 px-4 relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header simple avec le nom (simulant le logo) */}
            <div className="mb-8 text-center flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)]"></div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                    Music Diary
                </h1>
            </div>

            {/* Conteneur principal Premium Glassmorphism */}
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.07] p-8 md:p-12 rounded-3xl w-full max-w-[500px] shadow-2xl relative z-10">

                <h2 className="text-3xl font-black tracking-tight text-white mb-8 text-center">
                    Créer un compte
                </h2>

                {/* Messages d'erreur ou de succès */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3.5 mb-6 rounded-xl text-sm font-semibold text-center">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-violet-500/20 border border-violet-500/30 text-violet-200 p-3.5 mb-6 rounded-xl text-sm font-semibold text-center">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Champ Pseudo */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                            Pseudo
                        </label>
                        <input
                            type="text"
                            required
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/20 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 p-3.5 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-all duration-200"
                            placeholder="Votre pseudo"
                        />
                        <p className="text-[10px] text-zinc-500 font-medium">Il apparaîtra sur votre profil public.</p>
                    </div>



                    {/* Champ Mot de passe */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/20 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 p-3.5 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-all duration-200"
                            placeholder="Mot de passe (6 caractères min.)"
                        />
                    </div>

                    {/* Bouton S'inscrire */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(139,92,246,0.25)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        >
                            S'inscrire
                        </button>
                    </div>
                </form>

                {/* Séparateur horizontal discret */}
                <hr className="border-white/[0.06] my-8" />

                {/* Lien vers la connexion */}
                <p className="text-center text-zinc-400 text-xs font-medium">
                    Vous avez déjà un compte ?{' '}
                    <Link to="/login" className="text-white hover:text-violet-400 underline font-semibold transition-colors">
                        Connectez-vous ici
                    </Link>.
                </p>
            </div>
        </div>
    );
}

export default Register;