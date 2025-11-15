# Intégration technique SISAG

## Backend Symfony

- Les données sont exposées via une API REST (JSON).
- Authentification recommandée : JWT ou OAuth2.
- Consommation côté frontend : utiliser fetch ou axios avec gestion des erreurs et des états de chargement.
- Pagination et filtrage : privilégier les endpoints paginés et filtrables pour optimiser les performances.

## Google Maps API

- Utilisation pour l'affichage des cartes projet et la géolocalisation des signalements.
- Charger la librairie Maps JS en mode asynchrone.
- Optimiser le poids des markers et overlays (SVG < 10 Ko).

## Compatibilité navigateurs

- Tester sur Chrome, Firefox, Safari, Edge (desktop et mobile).
- Utiliser Tailwind pour le responsive.
- Éviter les polyfills lourds, privilégier les fonctionnalités natives.

## Performances

- Optimiser les images (SVG, WebP, PNG < 100 Ko).
- Lazy loading pour les listes et galeries.
- Minifier le JS/CSS en production.

## Liste des assets à produire

- Icônes : format SVG, optimisés pour le web.
- Images institutionnelles : logo, bannières (max 100 Ko).
- Illustrations pour onboarding et signalement.
- Fichiers Figma/Adobe XD pour les maquettes desktop/mobile.

## Conseils

- Respecter le guide de style (voir STYLE_GUIDE.md).
- Documenter les endpoints utilisés et les schémas de données.
- Prévoir des tests d'intégration pour valider la consommation de l'API REST.

---
Ce fichier doit être mis à jour à chaque évolution technique ou ajout d'assets.
