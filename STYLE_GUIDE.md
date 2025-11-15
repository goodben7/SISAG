# Guide de style SISAG

## Palette de couleurs

- Bleu principal : #2563eb (bg-blue-700)
- Bleu foncé : #1e40af (bg-blue-800)
- Gris clair : #f3f4f6 (bg-gray-50)
- Gris moyen : #e5e7eb (bg-gray-200)
- Gris foncé : #374151 (text-gray-700)
- Blanc : #ffffff

## Typographie

- Police principale : Inter, sans-serif
- Titres : font-bold, font-semibold
- Texte courant : font-normal
- Tailles :
  - Titre : text-lg, text-xl
  - Sous-titre : text-md
  - Texte : text-sm

## Espacements

- Padding : px-4, py-2, px-3, py-3
- Marges : mb-2, mt-8, gap-2, gap-3
- Border-radius : rounded-lg, rounded-xl, rounded-full

## Composants réutilisables

- Boutons :
  - États actifs/inactifs, hover, transition
  - Couleurs : bleu, gris, rouge (pour déconnexion)
- Cartes projet :
  - Style inspiré de Trello
  - Ombre : shadow-lg, shadow-xl
- Modales :
  - AuthModal, ChatbotWidget
- Filtres et champs de recherche :
  - Input, select, tags interactifs
- Icônes :
  - Utilisation de react-icons ou SVG optimisés

## États actifs/inactifs

- Boutons :
  - Actif : bg-blue-700, text-white
  - Inactif : bg-gray-200, text-gray-700
  - Hover : bg-blue-800, bg-gray-50
- Liens :
  - Actif : text-blue-600
  - Inactif : text-gray-700

## Responsive

- Version desktop et mobile
- Utilisation de Tailwind pour les breakpoints (md, lg)

---
Ce guide doit être respecté pour garantir la cohérence visuelle et l'accessibilité sur tous les supports.
