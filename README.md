# TP Suivi Nutritionnel

Application mobile React Native (Expo) pour suivre ses repas et ses apports nutritionnels, avec authentification Clerk, recherche Open Food Facts et scan de codes-barres.

## Aperçu

Cette application permet de :
- créer un compte et se connecter (Clerk)
- définir un objectif calorique journalier
- ajouter des repas (petit-déjeuner, déjeuner, dîner, snack)
- rechercher des aliments via Open Food Facts
- scanner un code-barres avec la caméra pour récupérer un produit
- consulter le détail nutritionnel d'un repas et le supprimer

## Stack Technique

| Domaine | Choix |
| --- | --- |
| Mobile | React Native 0.81 + Expo SDK 54 |
| Navigation | Expo Router |
| Authentification | Clerk (`@clerk/clerk-expo`) |
| Stockage local | AsyncStorage |
| Sécurité session | Expo Secure Store |
| Données nutritionnelles | Open Food Facts (API publique) |
| Caméra / scan | `expo-camera` |
| Langage | TypeScript |

## Prérequis

- Node.js 18+
- npm
- Expo Go (sur téléphone) ou émulateur Android/iOS
- Un compte Clerk avec une Publishable Key

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine :

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx
```

Important : l'application lève une erreur au démarrage si cette variable est absente.

## Lancer le projet

```bash
npm start
```

Puis lancer selon la cible :
- `a` pour Android
- `i` pour iOS
- `w` pour Web

Ou via scripts npm :

```bash
npm run android
npm run ios
npm run web
```

## Parcours Fonctionnel

1. Authentification (`/(auth)`)
- inscription avec vérification email par code
- connexion email/username + mot de passe

2. Application principale (`/(main)`)
- Accueil : résumé calories du jour, objectif, liste des repas
- Ajouter : recherche Open Food Facts + ajout manuel + scan code-barres
- Profil : email du compte + déconnexion

3. Détail repas (`/(main)/(home)/[id]`)
- totaux nutritionnels (kcal, protéines, glucides, lipides)
- suppression d'un repas

## Stockage Des Données

Les repas et l'objectif calorique sont stockés localement dans AsyncStorage, scindés par utilisateur Clerk :
- `@meals:{userId}`
- `@calorie_goal:{userId}`

Les tokens de session Clerk sont stockés de manière sécurisée via `expo-secure-store`.

## Structure Du Projet

```text
app/
  (auth)/
    login.tsx
    signup.tsx
  (main)/
    (home)/
      index.tsx
      [id].tsx
    add/
      index.tsx
      camera.tsx
    profile.tsx
src/
  components/
  services/
    openFoodFacts.ts
  storage/
    mealsStorage.ts
  theme/
  types/
```

## API Open Food Facts

L'application consomme :
- recherche : `https://fr.openfoodfacts.org/cgi/search.pl`
- produit par code-barres : `https://fr.openfoodfacts.org/api/v2/product/{barcode}.json`

Aucune clé API n'est requise pour ces endpoints publics.

## Notes

- Le scan code-barres nécessite la permission caméra.
- Les données sont locales au device (pas de synchronisation cloud des repas).
- Le projet utilise une interface en français.
