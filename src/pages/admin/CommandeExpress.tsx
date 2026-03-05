import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Zap, Package, Search, X, AlertCircle, Clock, CheckCircle, Hash, Calendar, Phone, User, MapPin, DollarSign, Truck, Eye, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

type CommandeExpressItem = {
  name: string;
  price: string;
  quantity: number;
  productId: number | null;
};

type CommandeExpressType = {
  id: number;
  orderId: string;
  clientId: number | null;
  clientName: string;
  clientPhone: string;
  packageValue: string;
  packageDescription: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupReference: string;
  deliveryReference: string;
  createdBy: number;
  statut: string;
  items: CommandeExpressItem[];
  deliveryPersonId: number | null;
  vendorId: number | null;
  createdAt: string;
  updatedAt: string;
};

type PaginationMeta = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
};

const CommandeExpress = () => {
  const [commandes, setCommandes] = useState<CommandeExpressType[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<CommandeExpressType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommande, setSelectedCommande] = useState<CommandeExpressType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    const fetchCommandes = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/commande-express/list', {
          params: { page, limit }
        });
        const resData = response.data?.data || response.data;
        const data: CommandeExpressType[] = resData?.data || [];
        const paginationMeta: PaginationMeta | null = resData?.meta || null;
        setCommandes(data);
        setFilteredCommandes(data);
        setMeta(paginationMeta);
      } catch (error: any) {
        console.error('Erreur lors du chargement des commandes express:', error);
        setError(error.response?.data?.message || 'Erreur lors du chargement des commandes express');
      } finally {
        setLoading(false);
      }
    };

    fetchCommandes();
  }, [page, limit]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCommandes(commandes);
      return;
    }

    const filtered = commandes.filter(cmd =>
      cmd.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.clientPhone?.includes(searchTerm) ||
      cmd.packageDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.statut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCommandes(filtered);
  }, [searchTerm, commandes]);

  const formatPrice = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyle = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'delivered':
      case 'livré':
      case 'livrée':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'in_progress':
      case 'en cours':
      case 'en_cours':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'pending':
      case 'en attente':
      case 'en_attente':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'cancelled':
      case 'annulé':
      case 'annulée':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'assigned':
      case 'assignée':
      case 'acceptée':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'delivered': return 'Livré';
      case 'in_progress': case 'en_cours': return 'En cours';
      case 'pending': case 'en_attente': return 'En attente';
      case 'cancelled': return 'Annulé';
      case 'assigned': case 'assignée': return 'Assignée';
      case 'acceptée': return 'Acceptée';
      default: return statut || 'N/A';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            Commandes Express
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-14">Livraisons rapides point à point</p>
        </div>
        {!loading && !error && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full border border-amber-200">
            <Zap className="w-4 h-4" />
            {meta?.total || commandes.length} commande{(meta?.total || commandes.length) > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-amber-200 border-t-amber-600"></div>
          <span className="mt-4 text-gray-500 font-medium">Chargement des commandes express...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredCommandes.length}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">En Cours</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {filteredCommandes.filter(c => ['in_progress', 'en cours', 'en_cours'].includes(c.statut?.toLowerCase())).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Livrées</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {filteredCommandes.filter(c => ['delivered', 'livré', 'livrée'].includes(c.statut?.toLowerCase())).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-violet-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Revenus</p>
                  <p className="text-lg font-extrabold text-gray-900 mt-0.5">
                    {formatPrice(filteredCommandes.reduce((total, c) => total + (parseFloat(c.packageValue) || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par client, téléphone, adresse, statut..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-500 flex items-center gap-1.5 pl-1">
                <Search className="w-3.5 h-3.5" />
                {filteredCommandes.length} résultat(s) trouvé(s)
              </div>
            )}
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[18%]">Client</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%]">Commande</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[22%]">Adresses</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[12%]">Valeur</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[12%]">Statut</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[14%]">Date</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[7%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCommandes.length > 0 ? (
                    filteredCommandes.map((cmd) => (
                      <tr key={cmd.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-amber-700 font-bold text-xs">
                                {cmd.clientName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-800 truncate">{cmd.clientName || 'N/A'}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{cmd.clientPhone || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs font-mono font-medium text-gray-700 truncate">{cmd.orderId || 'N/A'}</div>
                          {cmd.items && cmd.items.length > 0 ? (
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              <span>{cmd.items.length} article{cmd.items.length > 1 ? 's' : ''}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 mt-0.5">Aucun article</div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-1 min-w-0">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                              <span className="truncate">{cmd.pickupAddress || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                              <span className="truncate">{cmd.deliveryAddress || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-bold text-emerald-600 truncate">
                            {formatPrice(cmd.packageValue)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusStyle(cmd.statut)}`}>
                            {getStatusLabel(cmd.statut)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-gray-400">
                            {formatDate(cmd.createdAt)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                            onClick={() => { setSelectedCommande(cmd); setShowModal(true); }}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {searchTerm ? 'Aucune commande express trouvée' : 'Aucune commande express disponible'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {meta && meta.lastPage > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-700">{meta.currentPage}</span> sur <span className="font-semibold text-gray-700">{meta.lastPage}</span>
                <span className="mx-2">·</span>
                <span className="font-semibold text-gray-700">{meta.total}</span> commande{meta.total > 1 ? 's' : ''} au total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={meta.currentPage <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Début
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={meta.currentPage <= 1}
                  className="p-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, meta.lastPage) }, (_, i) => {
                  let pageNum: number;
                  if (meta.lastPage <= 5) {
                    pageNum = i + 1;
                  } else if (meta.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (meta.currentPage >= meta.lastPage - 2) {
                    pageNum = meta.lastPage - 4 + i;
                  } else {
                    pageNum = meta.currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 text-sm font-medium rounded-xl transition-all ${
                        pageNum === meta.currentPage
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                  disabled={meta.currentPage >= meta.lastPage}
                  className="p-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(meta.lastPage)}
                  disabled={meta.currentPage >= meta.lastPage}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Fin
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedCommande && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Détails de la commande</h3>
                  <p className="text-xs text-gray-400 font-mono">#{selectedCommande.orderId || selectedCommande.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(selectedCommande.statut)}`}>
                  {getStatusLabel(selectedCommande.statut)}
                </span>
                <button
                  onClick={() => { setShowModal(false); setSelectedCommande(null); }}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Client */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Informations client</h4>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Nom</p>
                      <p className="font-semibold text-gray-800">{selectedCommande.clientName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Téléphone</p>
                      <p className="font-medium text-gray-700">{selectedCommande.clientPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">ID Client</p>
                      <p className="font-medium text-gray-700">{selectedCommande.clientId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commande */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <Package className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Détails de la commande</h4>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">N° Commande</p>
                      <p className="font-mono font-semibold text-gray-800">{selectedCommande.orderId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Valeur du colis</p>
                      <p className="font-bold text-emerald-600 text-lg">{formatPrice(selectedCommande.packageValue)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Description du colis</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{selectedCommande.packageDescription || 'N/A'}</p>
                    </div>
                    {selectedCommande.vendorId && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">ID Vendeur</p>
                        <p className="font-medium text-gray-700">{selectedCommande.vendorId}</p>
                      </div>
                    )}
                    {selectedCommande.deliveryPersonId && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">ID Livreur</p>
                        <p className="font-medium text-gray-700">{selectedCommande.deliveryPersonId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Articles */}
              {selectedCommande.items && selectedCommande.items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-orange-50 rounded-lg">
                      <ShoppingBag className="w-4 h-4 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-700 text-sm">
                      Articles ({selectedCommande.items.length})
                    </h4>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Article</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qté</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedCommande.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatPrice(item.price)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatPrice(parseFloat(item.price) * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Adresses */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Adresses</h4>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Adresse de récupération</p>
                      <p className="font-medium text-gray-700">{selectedCommande.pickupAddress || 'N/A'}</p>
                      {selectedCommande.pickupReference && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Réf: {selectedCommande.pickupReference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-gray-200 ml-4 h-4"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Adresse de livraison</p>
                      <p className="font-medium text-gray-700">{selectedCommande.deliveryAddress || 'N/A'}</p>
                      {selectedCommande.deliveryReference && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Réf: {selectedCommande.deliveryReference}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-violet-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-violet-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Dates</h4>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Date de création</p>
                      <p className="font-medium text-gray-700">{formatDate(selectedCommande.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Dernière mise à jour</p>
                      <p className="font-medium text-gray-700">{formatDate(selectedCommande.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <button
                onClick={() => { setShowModal(false); setSelectedCommande(null); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandeExpress;
