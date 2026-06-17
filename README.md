# 🎵 Music Diary

Music Diary est une application web moderne de journal intime musical et de réseau social. Elle permet aux passionnés de musique de tenir un journal de leurs écoutes, d'écrire des critiques d'albums, de connecter leur compte Spotify, de découvrir les tendances mondiales et de suivre l'activité d'autres membres.

---

## 🌟 Fonctionnalités

### 🎧 Intégration Spotify
- **Écoute en direct** : Affiche l'activité d'écoute en temps réel de l'utilisateur sur son profil.
- **Statistiques personnalisées** : Top artistes, morceaux, albums et genres préférés sur différentes périodes.
- **Spotify Wrapped** : Rétrospective visuelle des statistiques musicales de l'utilisateur.
- **Classement des tendances** : Intégration en temps réel du **Top 50 Global** via le flux de charts public de Spotify.

### 📝 Journal & Critiques
- **Journal musical** : Ajoutez, modifiez ou supprimez des chroniques d'albums avec une note sur 5 et un commentaire textuel.
- **Fil d'activité social** : Suivez d'autres membres de la communauté pour voir leurs dernières critiques dans votre flux d'actualités.
- **Mur de Paroles (Lyric Wall)** : Épinglez vos citations de chansons préférées directement sur votre profil public.

### 🛡️ Dashboard d'Administration & Modération
- **Supervision globale** : Visualisation des statistiques clés (utilisateurs inscrits, critiques publiées, comptes Spotify associés).
- **Gestion des membres** : Modification des rôles (Standard, Admin), avertissements et bannissements (avec motifs).
- **Modération du contenu** : Traitement des signalements de membres ou de critiques inappropriées (conserver le contenu, archiver le signalement, supprimer définitivement).

---

## 🛠️ Stack Technique

### Frontend
- **Framework** : React (Vite)
- **Styling** : TailwindCSS, Vanilla CSS (thème sombre, Glassmorphism, dégradés vibrants)
- **Animations** : GSAP (GreenSock Animation Platform) pour des transitions fluides et modernes
- **Icônes** : Lucide React

### Backend
- **Framework** : Node.js / Express
- **Base de données & ORM** : Prisma (avec base de données relationnelle)
- **Sécurité** : Authentification par jeton JWT

---

## 📁 Architecture & Refactorisation

Pour garantir une maintenance optimale et un code propre, la base de code frontend suit le modèle de conception **Separation of Concerns (Container-Presenter)** :
- **Hooks personnalisés (`src/hooks/`)** : Toute la logique métier, la gestion d'état React, les cycles de vie (`useEffect`) et les appels d'API ont été isolés dans :
  - `useHomeData.js`
  - `useProfileData.js`
  - `useAdminDashboard.js`
- **Composants de présentation (`src/components/`)** : Les composants d'interface utilisateur complexes ont été extraits dans des fichiers autonomes réutilisables (ex. `AdminUsersTab`, `ProfileModals`, `AdminFilters`).
- **Impact** : Cette organisation a permis de réduire les fichiers de pages principaux à **moins de 150 lignes de code** chacun, facilitant grandement la lisibilité.

---

## 🚀 Installation et Lancement

### Prérequis
- Node.js (v18+)
- Un compte développeur Spotify (pour les identifiants Client ID & Secret)

### 1. Configuration du Backend

1. Naviguez dans le dossier du backend :
   ```bash
   cd music-diary-dwwm/backend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Créez un fichier `.env` dans le dossier `backend` et configurez vos variables d'environnement :
   ```env
   PORT=5001
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="votre_secret_jwt"
   SPOTIFY_CLIENT_ID="votre_spotify_client_id"
   SPOTIFY_CLIENT_SECRET="votre_spotify_client_secret"
   SPOTIFY_REDIRECT_URI="http://localhost:5001/api/spotify/callback"
   FRONTEND_URL="http://localhost:5173"
   ```
4. Exécutez les migrations de base de données :
   ```bash
   npx prisma migrate dev
   ```
5. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

### 2. Configuration du Frontend

1. Naviguez dans le dossier du frontend :
   ```bash
   cd ../frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez l'application en mode développement :
   ```bash
   npm run dev
   ```
4. Ouvrez votre navigateur à l'adresse [http://localhost:5173](http://localhost:5173).
