# SISAG - Suivi de l'Action Gouvernementale

SISAG est une application web visant à améliorer la transparence, la gestion et la participation citoyenne autour des projets gouvernementaux en RDC.

## Prérequis

- Node.js (v18 ou supérieur recommandé)
- npm ou yarn
- (Optionnel) Comptes pour le déploiement: Netlify (front) et Render (API)

## Installation

1. Clonez le dépôt :

   ```bash
   git clone <url-du-repo>
   cd sisag
   ```

2. Installez les dépendances :

   ```bash
   npm install
   # ou
   yarn install
   ```

## Configuration

Créez un fichier `.env` à la racine du projet et renseignez:

Back-end (Node/Express):

- `PORT` (par défaut: 4000)
- `JWT_SECRET` (obligatoire)
- `CORS_ORIGIN` ou `CORS_ORIGINS` (ex: `http://localhost:5173` ou liste séparée par des virgules)
- `DB_PATH` (optionnel, chemin vers la base SQLite; par défaut `server/sisag.db`)

Front-end (Vite/React):

- `VITE_API_BASE_URL` (ex: `http://localhost:4000`)

Références:

- Back-end: `server/index.js`, `server/db.js`, `server/schema.sql`
- Front-end: `src/lib/api.ts`

## Lancement

1. Démarrer l'API :

   ```bash
   npm run api:start
   ```

   (API: `http://localhost:4000`)

2. Démarrer le front :

   ```bash
   npm run dev
   ```

(Front: `http://localhost:5173`)

## Fonctionnalités principales

- **Tableau de bord gouvernemental** : Suivi des projets, alertes, rapports et ajout de nouveaux projets (rôles gouvernement/partenaire).
- **Tableau de bord citoyen** : Recherche, filtrage et visualisation des projets publics.
- **Outil de signalement** : Permet aux citoyens de signaler des problèmes sur les projets.
- **Espace collaboratif** : Calendrier partagé et messagerie pour les agents gouvernementaux et partenaires.

## Gestion des rôles

- `citizen` : Accès au tableau de bord citoyen et à l'outil de signalement.
- `government` et `partner` : Accès au tableau de bord gouvernemental et à l'espace collaboratif.

## Structure des dossiers

- `src/components/` : Composants React principaux (GovernmentDashboard, CitizenDashboard, ReportingTool, CollaborativeWorkspace, etc.)
- `src/contexts/` : Gestion du contexte d'authentification
- `src/lib/` : Client API (`api.ts`), types de base de données et utilitaires
- `server/` : API Node/Express + SQLite (`index.js`, `db.js`, `schema.sql`, `sisag.db`)

## Commandes utiles

- `npm run api:start` : Démarrer l'API (Express)
- `npm run dev` : Démarrer le front en développement (Vite)
- `npm run build` : Générer la version de production du front
- `npm run preview` : Prévisualiser la version de production du front
- `npm run lint` : Linter le code
- `npm run typecheck` : Vérifier les types TypeScript

## Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue ou une pull request pour proposer des améliorations.

## Licence

Ce projet est sous licence MIT.
