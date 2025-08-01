import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';

// Types génériques pour Firestore
export interface FirestoreDocument {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Service Firestore générique
export class FirestoreService<T extends FirestoreDocument> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Récupérer tous les documents
  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  }

  // Récupérer un document par ID
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du document:', error);
      throw error;
    }
  }

  // Créer un nouveau document
  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, this.collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      throw error;
    }
  }

  // Mettre à jour un document
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      throw error;
    }
  }

  // Supprimer un document
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  }

  // Rechercher des documents avec des critères
  async query(filters: { field: string; operator: any; value: any }[] = []): Promise<T[]> {
    try {
      const collectionRef = collection(db, this.collectionName);
      
      // Pour l'instant, retourner tous les documents
      // TODO: Implémenter les filtres plus tard
      const querySnapshot = await getDocs(collectionRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Erreur lors de la requête:', error);
      throw error;
    }
  }

  // Écouter les changements en temps réel
  subscribeToChanges(callback: (documents: T[]) => void): () => void {
    const q = collection(db, this.collectionName);
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      callback(documents);
    }, (error) => {
      console.error('Erreur lors de l\'écoute des changements:', error);
    });

    return unsubscribe;
  }

  // Écouter un document spécifique
  subscribeToDocument(id: string, callback: (document: T | null) => void): () => void {
    const docRef = doc(db, this.collectionName, id);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const document = {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
        callback(document);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Erreur lors de l\'écoute du document:', error);
    });

    return unsubscribe;
  }
}

// Services spécifiques pour vos collections
export interface User extends FirestoreDocument {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'vendeur' | 'client';
  userStatus: 'active' | 'pending' | 'inactive';
}

export interface Product extends FirestoreDocument {
  name: string;
  description: string;
  price: number;
  stock: number;
  vendeurId: string;
  categorieId: string;
  mediaUrl?: string;
}

export interface Category extends FirestoreDocument {
  name: string;
  description: string;
}

export interface Order extends FirestoreDocument {
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
}

// Instances des services
export const userService = new FirestoreService<User>('users');
export const productService = new FirestoreService<Product>('products');
export const categoryService = new FirestoreService<Category>('categories');
export const orderService = new FirestoreService<Order>('orders');

// Exemple d'utilisation:
/*
// Créer un utilisateur
const userId = await userService.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'vendeur',
  userStatus: 'active'
});

// Récupérer tous les produits
const products = await productService.getAll();

// Écouter les changements en temps réel
const unsubscribe = productService.subscribeToChanges((products) => {
  console.log('Produits mis à jour:', products);
});

// Nettoyer l'écouteur
unsubscribe();
*/ 