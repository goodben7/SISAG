# Guide de style SISAG

## Palette de couleurs (RDC)

- Bleu (action primaire) : #0072C6 (rdcBlue), #005EB8 (rdcBlueDark), #E6F2FF (rdcBlueLight)
- Jaune (accent/avertissement léger) : #FFD700 (rdcYellow), #FFF9C4 (rdcYellowLight)
- Rouge (erreur/alerte) : #DC143C (rdcRed), #B71C1C (rdcRedDark), #FFEBEE (rdcRedLight)
- Vert (succès/validations) : #008000 (rdcGreen), #1B5E20 (rdcGreenDark), #E8F5E9 (rdcGreenLight)
- Neutres :
  - Texte principal : #333333 (rdcTextPrimary)
  - Texte gris : #4B5563 (rdcGrayText)
  - Fond : #F9FAFB (rdcGrayBg)
  - Bordure : #E5E7EB (rdcGrayBorder)

Utilisation des tokens Tailwind : bg-rdcBlue, hover:bg-rdcBlueDark, text-rdcGrayText, border-rdcGrayBorder, bg-rdcGreenLight, etc.

## Typographie

- Police principale (texte courant) : Inter, sans-serif
- Titres : Montserrat (font-display)
- Hiérarchie :
  - Titres : .heading-1 (text-3xl md:text-4xl, bold), .heading-2 (text-2xl md:text-3xl, semibold)
  - Corps : text-sm à text-base, line-height confortable

## Espacements et rayons

- Padding : px-4, py-2, px-3, py-3
- Marges et gaps : mb-2, mt-8, gap-2, gap-3
- Border-radius : rounded-lg, rounded-xl (12px), rounded-full

## Composants réutilisables

- Boutons :
  - Primaire : .btn-primary → bg-rdcBlue text-white hover:bg-rdcBlueDark
  - Secondaire : .btn-secondary → bg-white border border-rdcBlue text-rdcBlue hover:bg-rdcBlueLight
  - Danger : .btn-danger → bg-rdcRed text-white hover:bg-rdcRedDark
  - Succès : .btn-success → bg-rdcGreen text-white hover:bg-rdcGreenDark
- Cartes : .card, .stat-card → bg-white rounded-lg shadow-soft (border optionnelle: border-rdcGrayBorder)
- En-têtes : .header-gradient → gradient from-rdcBlueDark to-rdcBlue
- Navigation : .nav-button, .nav-active (text-white border-b-2 border-rdcYellow), .nav-inactive (text-white/80 hover:text-white)
- Badges de statut :
  - En attente : .badge-pending → bg-rdcYellowLight text-rdcYellow
  - En cours de revue : .badge-in-review → bg-rdcBlueLight text-rdcBlue
  - Résolu : .badge-resolved → bg-rdcGreenLight text-rdcGreen
  - Rejeté : .badge-rejected → bg-rdcRedLight text-rdcRed
- Icônes : privilégier react-icons ou SVG optimisés

## États et accessibilité

- Focus visible obligatoire sur éléments interactifs
- Contraste AA minimum pour texte et icônes
- États : actif/inactif/hover désambiguïsés par couleur et/ou style (underline, bordure)

## Responsive

- Ciblage mobile et desktop
- Breakpoints Tailwind : md, lg

## Variables CSS (hors Tailwind)

Définies dans src/index.css via :root :

- --rdc-blue, --rdc-blue-dark, --rdc-blue-light
- --rdc-yellow, --rdc-yellow-light
- --rdc-red, --rdc-red-dark, --rdc-red-light
- --rdc-green, --rdc-green-dark, --rdc-green-light
- --neutral-bg, --neutral-text, --neutral-border, --text-primary

Exemples d’usage :

- background-color: var(--rdc-blue)
- color: var(--neutral-text)
- border-color: var(--neutral-border)

---
Ce guide est normatif et doit être respecté pour garantir cohérence visuelle et accessibilité sur tous les supports.
