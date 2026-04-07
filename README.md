# Rapidos Frontend

Dashboard d'administration pour la plateforme Rapidos — construit avec React, TypeScript et Vite.

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9
- [PM2](https://pm2.keymetrics.io/) (pour le mode production/serveur)

---

## Installation

```bash
npm install
```

---

## Lancer le projet

### Mode développement (local)

```bash
npm run dev
```

L'application sera disponible sur : **http://localhost:5173**

---

### Mode développement avec PM2

```bash
pm2 start ecosystem.config.cjs
```

Commandes utiles PM2 :

```bash
# Voir les logs en temps réel
pm2 logs rapidos-frontend

# Statut du processus
pm2 status

# Redémarrer
pm2 restart rapidos-frontend

# Arrêter
pm2 stop rapidos-frontend

# Supprimer de PM2
pm2 delete rapidos-frontend

# Démarrage automatique au reboot du serveur
pm2 startup
pm2 save
```

---

### Mode production (build + preview)

```bash
# 1. Construire le projet
npm run build

# 2. Lancer le preview (optionnel, pour tester le build)
npm run preview
```

> En production, il est recommandé de servir le dossier `dist/` via **Nginx** ou **Apache** plutôt qu'avec `vite preview`.

---

## Structure du projet

```
src/
├── pages/admin/       # Pages du dashboard
├── components/        # Composants réutilisables
├── layouts/           # Layouts (DashboardLayout)
├── routes/            # Définition des routes
├── hooks/             # Hooks personnalisés
├── firebase/          # Configuration Firebase
└── utils/             # Utilitaires (api.ts, etc.)
```

---

## Variables d'environnement

Créer un fichier `.env` à la racine si nécessaire :

```env
VITE_API_URL=http://your-api-url
```

---

## Stack technique

- **React 18** + **TypeScript**
- **Vite** — bundler
- **Tailwind CSS** — styles
- **React Router v6** — navigation
- **Axios** — requêtes HTTP
- **Firebase** — authentification
- **Recharts** — graphiques
- **Lucide React** — icônes
