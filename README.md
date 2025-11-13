# SISAG - Suivi de l'Action Gouvernementale

SISAG est une application web visant à améliorer la transparence, la gestion et la participation citoyenne autour des projets gouvernementaux en RDC.

## Prérequis

- Node.js (v18 ou supérieur recommandé)
- npm ou yarn
- Un compte Supabase et une instance configurée

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

1. Copiez le fichier `.env.example` en `.env` et renseignez les variables Supabase :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Vérifiez la configuration de la base de données dans `supabase/migrations/`.

## Lancement

Pour démarrer le serveur de développement :

```bash
npm run dev
# ou
yarn dev
```

L'application sera accessible sur `http://localhost:5173`.

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
- `src/contexts/` : Gestion du contexte d'authentification.
- `src/lib/` : Configuration Supabase et types de base de données.
- `supabase/migrations/` : Scripts SQL pour la structure de la base de données.

## Commandes utiles

- `npm run dev` : Démarrer le serveur de développement
- `npm run build` : Générer la version de production
- `npm run preview` : Prévisualiser la version de production

## Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue ou une pull request pour proposer des améliorations.

## Licence

Ce projet est sous licence MIT.
