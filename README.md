# ⚽ FC Manager Pro

Application de gestion de club de football — React + Firebase + Vercel.

---

## 🚀 Mise en ligne en 3 étapes

### Étape 1 — Configurer Firebase

1. Va sur **https://console.firebase.google.com**
2. Crée un projet → Active **Authentication** (Email/Password) → Crée une **Firestore Database**
3. Dans Paramètres > Tes applications > Web, copie ta config
4. Ouvre `src/App.jsx` et remplace les valeurs dans `FIREBASE_CONFIG` :

```js
const FIREBASE_CONFIG = {
  apiKey:            "COLLE_ICI",
  authDomain:        "COLLE_ICI",
  projectId:         "COLLE_ICI",
  storageBucket:     "COLLE_ICI",
  messagingSenderId: "COLLE_ICI",
  appId:             "COLLE_ICI",
};
```

### Étape 2 — Tester en local (optionnel)

```bash
npm install
npm run dev
```

Ouvre **http://localhost:3000** dans ton navigateur.

### Étape 3 — Déployer sur Vercel

1. Pousse le projet sur **GitHub** (github.com > New repository > Upload files)
2. Va sur **vercel.com** > Sign up with GitHub > Import ton repo
3. Clique **Deploy** — c'est tout !

Ton app sera disponible sur : `https://fc-manager-pro.vercel.app`

---

## 📁 Structure du projet

```
fc-manager-pro/
├── public/
│   └── favicon.svg          ← Icône de l'app
├── src/
│   ├── main.jsx             ← Point d'entrée React
│   └── App.jsx              ← Toute l'application
├── index.html               ← Page HTML principale
├── package.json             ← Dépendances
├── vite.config.js           ← Configuration Vite
├── vercel.json              ← Configuration Vercel
└── .gitignore               ← Fichiers à ne pas publier
```

---

## 🔥 Collections Firestore

| Collection | Contenu |
|------------|---------|
| `users`    | Profils utilisateurs (role, name, plan) |
| `teams`    | Équipes du club |
| `coaches`  | Comptes coachs |
| `players`  | Joueurs inscrits |
| `events`   | Matchs, entraînements, événements |

---

## 🔐 Règles de sécurité Firestore (à coller dans la console)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 💰 Coût

**100% gratuit** pour une démo :
- Firebase Spark plan : 50k lectures/jour, 20k écritures/jour
- Vercel hobby : hébergement illimité

---

## 🤝 Support

En cas de problème, copie le message d'erreur et demande à Claude de t'aider.
