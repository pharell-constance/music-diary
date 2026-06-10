import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    // --- LOGIQUE (Inchappée) ---
    const [pseudo, setPseudo] = useState('');
    const [email, setEmail] = useState('');
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
                body: JSON.stringify({ pseudo, email, password }),
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
        <div className="flex flex-col items-center justify-center pt-10 px-4">

            {/* Header simple avec le nom (simulant le logo) */}
            <div className="mb-12 text-center flex items-center gap-2">
                {/* Un petit cercle vert pour rappeler l'icône Spotify */}
                <div className="w-8 h-8 bg-[#1DB954] rounded-full"></div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Music Diary
                </h1>
            </div>

            {/* Conteneur principal (Gris foncé #121212, coins arrondis) */}
            <div className="bg-[#121212] p-10 md:p-14 rounded-lg w-full max-w-[734px]">

                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white mb-10 text-center">
                    Inscrivez-vous pour commencer à écouter
                </h2>

                {/* Messages d'erreur ou de succès stylisés Spotify */}
                {error && (
                    <div className="bg-[#E91429] text-white p-3 mb-6 rounded text-sm font-semibold text-center">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-[#1DB954] text-white p-3 mb-6 rounded text-sm font-semibold text-center">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">

                    {/* Champ Pseudo */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Comment devrions-nous vous appeler ?
                        </label>
                        <input
                            type="text"
                            required
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] p-3 rounded text-base text-zinc-100 placeholder:text-[#727272] outline-none transition"
                            placeholder="Saisissez un pseudo profile."
                        />
                        <p className="text-xs text-[#A7A7A7] mt-1.5">Il apparaîtra sur votre profil.</p>
                    </div>

                    {/* Champ Email */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Quel est votre e-mail ?
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] p-3 rounded text-base text-zinc-100 placeholder:text-[#727272] outline-none transition"
                            placeholder="Saisissez votre e-mail."
                        />
                    </div>

                    {/* Champ Mot de passe */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Créez un mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#121212] border border-[#727272] hover:border-white focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] p-3 rounded text-base text-zinc-100 placeholder:text-[#727272] outline-none transition"
                            placeholder="Créez un mot de passe."
                        />
                    </div>

                    {/* Bouton S'inscrire (Vert Spotify, Texte noir gras, Totalement arrondi) */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            className="bg-[#1DB954] hover:bg-[#1ED760] hover:scale-105 text-black font-bold py-3.5 px-12 rounded-full text-base transition-all duration-100 ease-in-out active:scale-100"
                        >
                            S'inscrire
                        </button>
                    </div>
                </form>

                {/* Séparateur horizontal discret style Spotify */}
                <hr className="border-[#292929] my-10" />

                {/* Lien vers la connexion */}
                <p className="text-center text-[#A7A7A7] text-sm">
                    Vous avez déjà un compte ?{' '}
                    <Link to="/login" className="text-white hover:text-[#1DB954] underline">
                        Connectez-vous ici
                    </Link>.
                </p>
            </div>
        </div>
    );
}

export default Register;