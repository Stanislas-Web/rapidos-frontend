import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

type CartItemType = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  category: string;
  idVendeur: string;
  imagePath: string;
};

type CartType = {
  id?: string;
  client: string;
  idClient: string;
  phone: string;
  adresse: string;
  avenue: string;
  quartier: string;
  commune: string;
  ville: string;
  pays: string;
  numero: string;
  latitude: number;
  longitude: number;
  items: CartItemType[];
  total: number;
  status: string;
  timestamp: Date;
};

type ClientType = {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  ville: string;
  commune: string;
  quartier: string;
  avenue: string;
  pays: string;
  numero: string;
  nombreCommandes: number;
  totalDepense: number;
  derniereCommande: Date;
};

const Clients = () => {
  const [carts, setCarts] = useState<CartType[]>([]);
  const [clients, setClients] = useState<ClientType[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientType | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);

        // Écouter les changements en temps réel
        const unsubscribe = onSnapshot(collection(db, 'carts'), (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          })) as CartType[];
          
          setCarts(data);
          
          // Convertir les carts en clients uniques
          const clientsMap = new Map<string, ClientType>();
          
          data.forEach(cart => {
            const clientId = cart.idClient;
            
            if (!clientsMap.has(clientId)) {
              // Nouveau client
              clientsMap.set(clientId, {
                id: clientId,
                nom: cart.client,
                telephone: cart.phone,
                adresse: cart.adresse,
                ville: cart.ville,
                commune: cart.commune,
                quartier: cart.quartier,
                avenue: cart.avenue,
                pays: cart.pays,
                numero: cart.numero,
                nombreCommandes: 1,
                totalDepense: cart.total,
                derniereCommande: cart.timestamp
              });
            } else {
              // Client existant, mettre à jour les statistiques
              const existingClient = clientsMap.get(clientId)!;
              existingClient.nombreCommandes += 1;
              existingClient.totalDepense += cart.total;
              if (cart.timestamp > existingClient.derniereCommande) {
                existingClient.derniereCommande = cart.timestamp;
              }
            }
          });
          
          const clientsData = Array.from(clientsMap.values());
          setClients(clientsData);
          setFilteredClients(clientsData);
          setLoading(false);
        }, (error) => {
          console.error('Erreur lors de l\'écoute des changements:', error);
          setError('Erreur lors du chargement des clients');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des clients');
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filtrer les clients basé sur le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone.includes(searchTerm) ||
      client.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.quartier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openModal = (client: ClientType) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement des clients...</span>
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
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Clients</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Total Clients</h3>
          <p className="text-2xl font-bold text-indigo-600">{filteredClients.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Total Commandes</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredClients.reduce((total, client) => total + client.nombreCommandes, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">Chiffre d'affaires</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatPrice(filteredClients.reduce((total, client) => total + client.totalDepense, 0))}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Recherche de clients</h3>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Effacer la recherche</span>
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, ville, commune..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {searchTerm && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{filteredClients.length} client(s) trouvé(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tableau des clients */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistiques
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{client.nom}</div>
                      <div className="text-sm text-gray-500">ID: {client.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{client.telephone}</div>
                      <div className="text-sm text-gray-500">Réference: {client.numero}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{client.quartier}</div>
                      <div className="text-sm text-gray-500">{client.commune}, {client.ville}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-indigo-600">
                        {client.nombreCommandes} commande(s)
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        {formatPrice(client.totalDepense)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(client)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors p-2"
                        title="Voir les détails"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Aucun client trouvé' : 'Aucun client disponible'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails du client
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Informations du client */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Informations personnelles</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="font-medium">{selectedClient.nom}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">{selectedClient.telephone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ID Client</p>
                      <p className="font-medium">{selectedClient.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Numéro</p>
                      <p className="font-medium">{selectedClient.numero}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adresse complète */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Adresse complète</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Adresse principale</p>
                      <p className="font-medium">{selectedClient.adresse}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Avenue</p>
                        <p className="font-medium">{selectedClient.avenue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quartier</p>
                        <p className="font-medium">{selectedClient.quartier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Commune</p>
                        <p className="font-medium">{selectedClient.commune}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ville</p>
                        <p className="font-medium">{selectedClient.ville}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pays</p>
                        <p className="font-medium">{selectedClient.pays}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Statistiques d'achat</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre de commandes</p>
                      <p className="text-lg font-bold text-indigo-600">{selectedClient.nombreCommandes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total dépensé</p>
                      <p className="text-lg font-bold text-green-600">{formatPrice(selectedClient.totalDepense)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dernière commande</p>
                      <p className="font-medium">{formatDate(selectedClient.derniereCommande)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Fermer
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  Contacter
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                  Historique
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
