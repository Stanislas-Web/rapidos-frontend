# 🔥 Configuration Firebase Firestore

## 📋 Prérequis

1. **Compte Firebase** : Créez un projet sur [Firebase Console](https://console.firebase.google.com/)
2. **Firestore Database** : Activez Firestore dans votre projet Firebase
3. **Règles de sécurité** : Configurez les règles Firestore selon vos besoins

## ⚙️ Configuration

### 1. Récupérer les informations de configuration

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ (Paramètres) → Paramètres du projet
4. Dans l'onglet "Général", faites défiler jusqu'à "Vos applications"
5. Cliquez sur l'icône Web (</>) pour ajouter une application web
6. Copiez la configuration

### 2. Mettre à jour la configuration

Remplacez les valeurs dans `src/firebase/config.ts` :

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID",
  measurementId: "VOTRE_MEASUREMENT_ID"
};
```

## 🚀 Utilisation

### Services disponibles

```typescript
import { 
  userService, 
  productService, 
  categoryService, 
  orderService 
} from './firebase/firestore';
```

### Hooks React

```typescript
import { useFirestore, useFirestoreDocument } from './hooks/useFirestore';

// Pour une collection
const { data, loading, error, create, update, remove } = useFirestore(categoryService);

// Pour un document spécifique
const { data, loading, error, update, remove } = useFirestoreDocument(categoryService, documentId);
```

### Opérations CRUD

```typescript
// Créer
const id = await categoryService.create({
  name: 'Nouvelle catégorie',
  description: 'Description de la catégorie'
});

// Lire
const categories = await categoryService.getAll();
const category = await categoryService.getById(id);

// Mettre à jour
await categoryService.update(id, { name: 'Nouveau nom' });

// Supprimer
await categoryService.delete(id);
```

### Écoute en temps réel

```typescript
// Écouter les changements d'une collection
const unsubscribe = categoryService.subscribeToChanges((categories) => {
  console.log('Catégories mises à jour:', categories);
});

// Écouter un document spécifique
const unsubscribe = categoryService.subscribeToDocument(id, (category) => {
  console.log('Catégorie mise à jour:', category);
});

// Nettoyer l'écouteur
unsubscribe();
```

## 📊 Structure des données

### User
```typescript
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'vendeur' | 'client';
  userStatus: 'active' | 'pending' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Product
```typescript
interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  vendeurId: string;
  categorieId: string;
  mediaUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Category
```typescript
interface Category {
  id?: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Order
```typescript
interface Order {
  id?: string;
  userId: string;
  vendeurId: string;
  products: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🔒 Règles de sécurité Firestore

Exemple de règles basiques :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre la lecture/écriture pour tous les utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🧪 Test

1. Configurez Firebase avec vos vraies informations
2. Allez sur la page `FirebaseExample` pour tester les opérations CRUD
3. Vérifiez dans la console Firebase que les données sont bien créées

## 📝 Notes importantes

- **Temps réel** : Les hooks écoutent automatiquement les changements
- **Gestion d'erreurs** : Toutes les opérations incluent la gestion d'erreurs
- **Types TypeScript** : Tous les services sont typés pour une meilleure DX
- **Performance** : Les données sont mises en cache automatiquement

## 🔧 Dépendances

```json
{
  "firebase": "^10.x.x"
}
```

## 📚 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Guide React + Firebase](https://firebase.google.com/docs/web/setup) 