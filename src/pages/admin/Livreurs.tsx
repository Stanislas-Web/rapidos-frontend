import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

type StatusType = {
  id?: string;
  userId: string;
  userName: string;
  role: string;
  status: boolean;
  createdAt: Date;
  lastUpdated: Date;
};

const Livreurs = () => {
  const [statusData, setStatusData] = useState<StatusType[]>([]);
  const [filteredData, setFilteredData] = useState<StatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Écouter les changements en temps réel
        const unsubscribe = onSnapshot(collection(db, 'status'), (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
          })) as StatusType[];
          
          setStatusData(data);
          setFilteredData(data);
          setLoading(false);
        }, (error) => {
          console.error('Erreur lors de l\'écoute des changements:', error);
          setError('Erreur lors du chargement des données');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchStatusData();
  }, []);

  // Filtrer les données basé sur le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(statusData);
      return;
    }

    const filtered = statusData.filter(item =>
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredData(filtered);
  }, [searchTerm, statusData]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('livreur')) return '🚚';
    if (roleLower.includes('vendeur')) return '👨‍💼';
    if (roleLower.includes('admin')) return '👑';
    if (roleLower.includes('client')) return '👤';
    return '👤';
  };

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const toggleStatus = async (item: StatusType) => {
    if (!item.id) return;

    try {
      const docRef = doc(db, 'status', item.id);
      await updateDoc(docRef, {
        status: !item.status,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement des livreurs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Livreurs</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Total Utilisateurs</h3>
          <p className="text-2xl font-bold text-indigo-600">{filteredData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Livreurs Actifs</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredData.filter(item => item.role === 'livreur' && item.status).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Utilisateurs Actifs</h3>
          <p className="text-2xl font-bold text-blue-600">
            {filteredData.filter(item => item.status).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Utilisateurs Inactifs</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredData.filter(item => !item.status).length}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, ID utilisateur ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredData.length} utilisateur(s) trouvé(s)
          </div>
        )}
      </div>

      {/* Liste des utilisateurs */}
      <div className="space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                      {getRoleIcon(item.role)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.userName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        ID: {item.userId} | Rôle: {item.role}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Créé le: {formatDate(item.createdAt)}</span>
                        <span>Modifié le: {formatDate(item.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        item.status 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      title={item.status ? 'Désactiver' : 'Activer'}
                    >
                      {item.status ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      className="text-indigo-600 hover:text-indigo-900 transition-colors p-2"
                      title="Modifier"
                      onClick={() => {
                        // TODO: Implémenter la modification
                        console.log('Modifier:', item);
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 transition-colors p-2"
                      title="Supprimer"
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                          // TODO: Implémenter la suppression
                          console.log('Supprimer:', item);
                        }
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg border text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? `Aucun utilisateur ne correspond à "${searchTerm}"` : 'Aucun utilisateur disponible'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Livreurs;
