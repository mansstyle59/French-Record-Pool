<div align="center">
<img width="1200" height="475" alt="French Record Pool Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🎵 French Record Pool

**La plateforme d'accès privilégié aux meilleures tracks françaises pour DJs exigeants.**

[![Deploy to Firebase Hosting](https://github.com/mansstyle59/French-Record-Pool/actions/workflows/deploy.yml/badge.svg)](https://github.com/mansstyle59/French-Record-Pool/actions/workflows/deploy.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

🌐 **[Voir le site en ligne](https://gen-lang-client-0064347139.web.app)**

</div>

---

## Fonctionnalités

- **Catalogue de morceaux** — Navigation par genre, recherche, tri par date ou popularité
- **Lecture audio** — Lecteur intégré avec prévisualisation des tracks
- **Téléchargements** — Accès aux fichiers audio selon le niveau d'abonnement (Free / Pro)
- **Favoris** — Sauvegarde des morceaux préférés par utilisateur
- **Panel Admin** — Interface d'administration complète avec :
  - Upload de morceaux avec extraction automatique des métadonnées
  - Upload de pochette (artwork) personnalisée
  - Champs : titre, artiste, BPM, durée, tonalité, genre
  - 6 genres : French House, Techno, Afro House, Nu-Disco, Indie Dance, Tech House
  - Gestion du catalogue (édition, suppression)
  - Gestion des utilisateurs
  - Studio de branding visuel (couleurs, typographie, hero banner)

---

## Stack Technique

| Technologie | Usage |
|---|---|
| **React 19** | Interface utilisateur |
| **TypeScript** | Typage statique |
| **Firebase Auth** | Authentification |
| **Cloud Firestore** | Base de données temps réel |
| **Firebase Storage** | Stockage des fichiers audio et images |
| **Firebase Hosting** | Déploiement du site |
| **Tailwind CSS v4** | Styles |
| **Vite** | Bundler |
| **music-metadata-browser** | Extraction des métadonnées audio |

---

## Lancer en local

**Prérequis :** Node.js 18+

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:3000`.

---

## Déploiement (Firebase Hosting)

Le déploiement est automatisé via GitHub Actions à chaque push sur `main`.

### Secrets GitHub requis

Configurer l'un des deux secrets dans **Settings → Secrets and variables → Actions** :

| Secret | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON de la clé de service (Firebase Console → Project Settings → Service accounts → Generate new private key) |
| `FIREBASE_TOKEN` | Token obtenu en lançant `firebase login:ci` en local |

### Déploiement manuel

```bash
npm install -g firebase-tools
firebase login
npm run build
firebase deploy --only hosting
```

---

## Structure du projet

```
src/
├── components/
│   ├── AdminPanel.tsx      # Interface d'administration
│   ├── AuthContext.tsx     # Contexte d'authentification
│   ├── Dashboard.tsx       # Dashboard principal (catalogue, player)
│   └── ...
├── hooks/
│   ├── useTracks.ts        # Hook temps réel pour les morceaux
│   └── useSettings.ts      # Hook pour les paramètres du site
├── lib/
│   ├── firebase.ts         # Initialisation Firebase
│   └── metadata.ts         # Extraction métadonnées audio
├── data.ts                 # Genres et données statiques
└── types.ts                # Interfaces TypeScript
```
