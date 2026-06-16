import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
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
            const response = await fetch('http://127.0.0.1:5001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Identifiants incorrects");
            }

            // --- LE POINT CRUCIAL POUR LE JURY ---
            // On sauvegarde le token JWT et les infos de l'utilisateur dans le LocalStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setSuccess("Connexion réussie ! Redirection...");

            setTimeout(() => {
                navigate('/'); // Redirection vers la page d'accueil
            }, 1500);

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center pt-10 px-4">

            {/* Logo / Header */}
            <div className="mb-12 text-center flex items-center gap-2">
                <div className="w-8 h-8 bg-[#8B5CF6] rounded-full"></div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Music Diary
                </h1>
            </div>

            {/* Conteneur Formulaire style Spotify */}
            <div className="bg-[#12101b] p-10 md:p-14 rounded-lg w-full max-w-[734px]">

                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white mb-10 text-center">
                    Connectez-vous à Music Diary
                </h2>

                {error && (
                    <div className="bg-[#E91429] text-white p-3 mb-6 rounded text-sm font-semibold text-center">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-[#8B5CF6] text-white p-3 mb-6 rounded text-sm font-semibold text-center">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Adresse e-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#12101b] border border-[#727272] hover:border-white focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] p-3 rounded text-base text-zinc-100 placeholder:text-[#727272] outline-none transition"
                            placeholder="Adresse e-mail"
                        />
                    </div>

                    {/* Mot de passe */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#12101b] border border-[#727272] hover:border-white focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] p-3 rounded text-base text-zinc-100 placeholder:text-[#727272] outline-none transition"
                            placeholder="Mot de passe"
                        />
                    </div>

                    {/* Bouton Connexion */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            className="bg-[#8B5CF6] hover:bg-[#A78BFA] hover:scale-105 text-black font-bold py-3.5 px-12 rounded-full text-base transition-all duration-100 ease-in-out active:scale-100"
                        >
                            Se connecter
                        </button>
                    </div>
                </form>

                <hr className="border-[#292929] my-10" />

                <p className="text-center text-[#A7A7A7] text-sm">
                    Vous n'avez pas de compte ?{' '}
                    <Link to="/register" className="text-white hover:text-[#8B5CF6] underline">
                        Inscrivez-vous ici
                    </Link>.
                </p>
            </div>
        </div>
    );
}

export default Login;