import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';
import {
  Users, ShoppingCart, DollarSign, Search, X, Eye,
  Phone, MapPin, Hash, Calendar, Mail, ChevronRight,
  UserCircle, AlertCircle, Download
} from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-gray-200 border-t-emerald-600"></div>
        </div>
        <p className="text-sm text-gray-400 font-medium">Chargement des clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl m-4">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez et suivez vos clients en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                const exportData = filteredClients.map(c => ({
                  'ID': c.id,
                  'Nom': c.nom,
                  'Téléphone': c.telephone,
                  'Pays': c.pays,
                  'Ville': c.ville,
                  'Commune': c.commune,
                  'Quartier': c.quartier,
                  'Avenue': c.avenue,
                  'Numéro': c.numero,
                  'Nombre de commandes': c.nombreCommandes,
                  'Total dépensé': c.totalDepense,
                  'Dernière commande': c.derniereCommande ? new Date(c.derniereCommande).toLocaleDateString('fr-FR') : '-',
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Clients');
                const date = new Date().toISOString().split('T')[0];
                XLSX.writeFile(wb, `clients_${date}.xlsx`);
              } catch (error) {
                console.error('Erreur lors de l\'export Excel:', error);
              }
            }}
            disabled={filteredClients.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold">
            <Users className="w-4 h-4" />
            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Clients</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredClients.length}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Commandes</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {filteredClients.reduce((total, client) => total + client.nombreCommandes, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chiffre d'affaires</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                {formatPrice(filteredClients.reduce((total, client) => total + client.totalDepense, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, ville, commune..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2.5 text-xs text-gray-400 pl-1">
              {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''} pour "<span className="font-semibold text-gray-600">{searchTerm}</span>"
            </p>
          )}
        </div>

      {/* Tableau des clients */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80 border-y border-gray-100">
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Activité
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-bold text-sm">
                            {client.nom.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{client.nom}</p>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: {client.id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {client.telephone}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                        <Hash className="w-3 h-3" />
                        Réf: {client.numero}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700">{client.quartier}</p>
                          <p className="text-[11px] text-gray-400">{client.commune}, {client.ville}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {client.nombreCommandes} cmd
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          {formatPrice(client.totalDepense)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(client)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 border border-gray-100 hover:border-emerald-200 group-hover:shadow-sm"
                        title="Voir les détails"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-gray-300" />
                      <p className="text-sm text-gray-400">
                        {searchTerm ? 'Aucun client trouvé' : 'Aucun client disponible'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 px-4" onClick={closeModal}>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            {/* Header du modal */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-bold text-lg">
                    {selectedClient.nom.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedClient.nom}</h3>
                  <p className="text-xs text-gray-400">Détails du client</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Informations personnelles */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  Informations personnelles
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Nom</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedClient.nom}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Téléphone</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedClient.telephone}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">ID Client</p>
                    <p className="text-sm font-mono text-gray-600 mt-0.5">{selectedClient.id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Numéro</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedClient.numero}</p>
                  </div>
                </div>
              </div>

              {/* Adresse complète */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse complète
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl space-y-4">
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Adresse principale</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedClient.adresse}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Avenue</p>
                      <p className="text-sm text-gray-700 mt-0.5">{selectedClient.avenue}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Quartier</p>
                      <p className="text-sm text-gray-700 mt-0.5">{selectedClient.quartier}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Commune</p>
                      <p className="text-sm text-gray-700 mt-0.5">{selectedClient.commune}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Ville</p>
                      <p className="text-sm text-gray-700 mt-0.5">{selectedClient.ville}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Pays</p>
                      <p className="text-sm text-gray-700 mt-0.5">{selectedClient.pays}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Statistiques d'achat
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-emerald-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-emerald-600/70 font-medium uppercase tracking-wider">Commandes</p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">{selectedClient.nombreCommandes}</p>
                  </div>
                  <div className="bg-blue-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-blue-600/70 font-medium uppercase tracking-wider">Total dépensé</p>
                    <p className="text-lg font-extrabold text-blue-700 mt-1">{formatPrice(selectedClient.totalDepense)}</p>
                  </div>
                  <div className="bg-amber-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-amber-600/70 font-medium uppercase tracking-wider">Dernière cmd</p>
                    <p className="text-sm font-bold text-amber-700 mt-1">{formatDate(selectedClient.derniereCommande)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer du modal */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-2">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Fermer
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
                <Phone className="w-3.5 h-3.5" />
                Contacter
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Historique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
