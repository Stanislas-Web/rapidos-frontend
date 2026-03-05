import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import {
  ShoppingCart, Clock, CheckCircle, Truck, DollarSign,
  Search, X, Eye, AlertCircle, Filter, Download, BarChart3,
  User, Phone, MapPin, Package, Calendar, ChevronLeft, ChevronRight,
  XCircle, FileSpreadsheet
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

const Commandes = () => {
  const [carts, setCarts] = useState<CartType[]>([]);
  const [filteredCarts, setFilteredCarts] = useState<CartType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCart, setSelectedCart] = useState<CartType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Récupérer les commandes depuis l'API
  const fetchCarts = async (page: number = 1, status?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Construire l'URL avec les paramètres
      let url = `/ecommerce/commandes/admin/all?page=${page}&limit=${limit}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }

      const response = await api.get(url);
      
      // Adapter la réponse selon la structure de l'API
      const data = response.data?.data || response.data?.commandes || response.data || [];
      const total = response.data?.total || response.data?.meta?.total || data.length;
      
      // Convertir les données pour correspondre au type CartType
      const formattedData = data.map((item: any) => ({
        id: item.id?.toString() || item.idCommande?.toString(),
        client: item.client || item.clientName || '',
        idClient: item.idClient?.toString() || '',
        phone: item.phone || item.telephone || '',
        adresse: item.adresse || item.address || '',
        avenue: item.avenue || '',
        quartier: item.quartier || '',
        commune: item.commune || '',
        ville: item.ville || item.city || '',
        pays: item.pays || item.country || '',
        numero: item.numero || '',
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        items: item.items || item.products || [],
        total: item.total || 0,
        status: item.status || 'pending',
        timestamp: item.timestamp ? new Date(item.timestamp) : (item.createdAt ? new Date(item.createdAt) : new Date())
      })) as CartType[];

      setCarts(formattedData);
      setFilteredCarts(formattedData);
      setTotalPages(Math.ceil(total / limit));
      setLoading(false);
    } catch (error: any) {
      console.error('Erreur lors du chargement des commandes:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement des commandes');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  // Réinitialiser la page quand le filtre de statut change
  useEffect(() => {
    if (statusFilter !== 'all' && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter]);

  // Mettre à jour le filtre de période quand les dates personnalisées changent
  useEffect(() => {
    if (startDate || endDate) {
      setDateFilter('custom');
    } else if (dateFilter === 'custom') {
      setDateFilter('all');
    }
  }, [startDate, endDate]);

  // Filtrer les commandes basé sur le terme de recherche et la date (le statut est géré par l'API)
  useEffect(() => {
    let filtered = carts;

    // Le filtre par statut est géré par l'API, on ne filtre que côté client pour la recherche et les dates
    // Filtre par date (priorité aux dates personnalisées)
    if (startDate || endDate) {
      // Filtre par dates personnalisées
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(cart => 
          cart.timestamp >= start && cart.timestamp <= end
        );
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(cart => 
          cart.timestamp >= start
        );
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(cart => 
          cart.timestamp <= end
        );
      }
    } else if (dateFilter !== 'all') {
      // Filtre par périodes prédéfinies (seulement si pas de dates personnalisées)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(cart => 
            cart.timestamp >= startOfDay && cart.timestamp <= endOfDay
          );
          break;
        case 'week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          filtered = filtered.filter(cart => 
            cart.timestamp >= startOfWeek
          );
          break;
        case 'month':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          filtered = filtered.filter(cart => 
            cart.timestamp >= startOfMonth
          );
          break;
        case 'year':
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          filtered = filtered.filter(cart => 
            cart.timestamp >= startOfYear
          );
          break;
      }
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(cart =>
        cart.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cart.idClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cart.phone.includes(searchTerm) ||
        cart.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cart.items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredCarts(filtered);
  }, [searchTerm, statusFilter, dateFilter, startDate, endDate, carts]);

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'en route pour livraison':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'prêt à expédier':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'colis en cours de préparation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'En attente';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      case 'en route pour livraison':
        return 'En route pour livraison';
      case 'prêt à expédier':
        return 'Prêt à expédier';
      case 'colis en cours de préparation':
        return 'En préparation';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  const openModal = (cart: CartType) => {
    setSelectedCart(cart);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCart(null);
  };

  const openStatsModal = () => {
    setShowStatsModal(true);
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
  };

  // Fonction pour exporter en Excel
  const exportToExcel = () => {
    try {
      // Préparer les données pour l'export
      const exportData = filteredCarts.map(cart => ({
        'ID Commande': cart.id,
        'Client': cart.client,
        'Téléphone': cart.phone,
        'Adresse': cart.adresse,
        'Quartier': cart.quartier,
        'Commune': cart.commune,
        'Ville': cart.ville,
        'Pays': cart.pays,
        'Numéro': cart.numero,
        'Statut': getStatusText(cart.status),
        'Total': cart.total,
        'Total Formaté': formatPrice(cart.total),
        'Nombre d\'articles': cart.items.length,
        'Date de commande': formatDate(cart.timestamp),
        'Articles': cart.items.map(item => `${item.name} (${item.quantity}x)`).join(', ')
      }));

      // Créer le workbook et worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

      // Générer le nom du fichier avec la date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `commandes_${date}.xlsx`;

                // Télécharger le fichier
          XLSX.writeFile(wb, fileName);

          // Feedback utilisateur silencieux
          console.log(`Export réussi ! Fichier téléchargé : ${fileName}`);
        } catch (error) {
          console.error('Erreur lors de l\'export Excel:', error);
        }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm m-4 md:m-6">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-200 border-t-emerald-600"></div>
        <span className="mt-4 text-gray-500 font-medium">Chargement des commandes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl m-4 md:m-6">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            Gestion des Commandes
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-14">Suivi et gestion de toutes les commandes</p>
        </div>
        {!loading && !error && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200">
            <ShoppingCart className="w-4 h-4" />
            {filteredCarts.length} commande{filteredCarts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Commandes</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredCarts.length}</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">En Attente</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {filteredCarts.filter(cart => cart.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-green-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Livrées</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {filteredCarts.filter(cart => cart.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chiffre d'affaires</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                {formatPrice(filteredCarts.reduce((total, cart) => total + cart.total, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 space-y-5">
          {/* En-tête des filtres */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Filtres et recherche</h3>
            </div>
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Effacer les filtres</span>
              </button>
            )}
          </div>

          {/* Première ligne - Recherche + Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Client, téléphone, produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200"
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

            {/* Filtre par statut */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="colis en cours de préparation">En préparation</option>
                <option value="prêt à expédier">Prêt à expédier</option>
                <option value="en route pour livraison">En route pour livraison</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
                <option value="rejected">Rejetée</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Filtre par date */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none"
              >
                <option value="all">Toutes les périodes</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
                <option value="custom" disabled={!(startDate || endDate)}>
                  {startDate || endDate ? 'Personnalisé' : 'Personnalisé (sélectionnez une date)'}
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Dates personnalisées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Résultats et actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-100 gap-3">
            <div className="flex items-center gap-4">
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || startDate || endDate) && (
                <p className="text-xs text-gray-400">
                  {filteredCarts.length} résultat{filteredCarts.length > 1 ? 's' : ''} trouvé{filteredCarts.length > 1 ? 's' : ''}
                </p>
              )}
              {filteredCarts.length > 0 && (
                <p className="text-xs font-semibold text-gray-600">
                  Total: {formatPrice(filteredCarts.reduce((total, cart) => total + cart.total, 0))}
                </p>
              )}
            </div>
            
            {/* Actions rapides */}
            <div className="flex items-center gap-2">
              <button 
                onClick={exportToExcel}
                disabled={filteredCarts.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export
              </button>
              <button 
                onClick={openStatsModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Statistiques
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des commandes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Produits
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  Détails
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCarts.length > 0 ? (
                filteredCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">#{cart.id?.slice(-8)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cart.client}</p>
                          <p className="text-xs text-gray-400">{cart.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md flex-shrink-0">
                          <Package className="w-3 h-3" />
                          {cart.items.length}
                        </span>
                        <span className="text-xs text-gray-400 truncate">
                          {cart.items.map(item => item.name).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatPrice(cart.total)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusColor(cart.status)}`}>
                        {getStatusText(cart.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500">{formatDate(cart.timestamp)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openModal(cart)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="w-8 h-8 text-gray-300" />
                      <p className="text-sm text-gray-400 font-medium">
                        {searchTerm || statusFilter !== 'all' ? 'Aucune commande trouvée' : 'Aucune commande disponible'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page <span className="font-semibold text-gray-600">{currentPage}</span> sur <span className="font-semibold text-gray-600">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showModal && selectedCart && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Commande #{selectedCart.id?.slice(-8)}
                  </h3>
                  <p className="text-xs text-gray-400">{formatDate(selectedCart.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations du client */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Informations client
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Nom</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedCart.client}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {selectedCart.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">ID Client</p>
                      <p className="text-sm font-medium text-gray-600">{selectedCart.idClient}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Statut</p>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusColor(selectedCart.status)}`}>
                        {getStatusText(selectedCart.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adresse de livraison */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Adresse de livraison
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-700 mb-3">{selectedCart.adresse}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-xs">
                      <span className="text-gray-400">Ville</span>
                      <p className="font-medium text-gray-700">{selectedCart.ville}</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400">Commune</span>
                      <p className="font-medium text-gray-700">{selectedCart.commune}</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400">Pays</span>
                      <p className="font-medium text-gray-700">{selectedCart.pays}</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400">Numéro</span>
                      <p className="font-medium text-gray-700">{selectedCart.numero}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produits */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" />
                  Produits commandés ({selectedCart.items.length})
                </h4>
                <div className="space-y-2">
                  {selectedCart.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                      {item.imagePath && (
                        <img 
                          src={item.imagePath} 
                          alt={item.name}
                          className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">Qté: {item.quantity}</span>
                          <span className="text-xs text-gray-400">{formatPrice(item.price)}/unité</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total et actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Total de la commande</p>
                  <p className="text-xl font-extrabold text-emerald-600">
                    {formatPrice(selectedCart.total)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                    Confirmer
                  </button>
                  <button className="px-4 py-2.5 text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de statistiques détaillées */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Statistiques détaillées</h3>
              </div>
              <button
                onClick={closeStatsModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statistiques générales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="relative overflow-hidden bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-100 rounded-full opacity-50" />
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-0.5">{filteredCarts.length}</p>
                </div>
                <div className="relative overflow-hidden bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-100 rounded-full opacity-50" />
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">En Attente</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                    {filteredCarts.filter(cart => cart.status === 'pending').length}
                  </p>
                </div>
                <div className="relative overflow-hidden bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-100 rounded-full opacity-50" />
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Livrées</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                    {filteredCarts.filter(cart => cart.status === 'delivered').length}
                  </p>
                </div>
                <div className="relative overflow-hidden bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-100 rounded-full opacity-50" />
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">CA</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                    {formatPrice(filteredCarts.reduce((total, cart) => total + cart.total, 0))}
                  </p>
                </div>
              </div>

              {/* Statistiques par statut */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Répartition par statut
                </h4>
                <div className="space-y-2">
                  {['pending', 'delivered', 'cancelled', 'en route pour livraison', 'prêt à expédier', 'colis en cours de préparation', 'rejected'].map(status => {
                    const count = filteredCarts.filter(cart => cart.status === status).length;
                    const percentage = filteredCarts.length > 0 ? ((count / filteredCarts.length) * 100).toFixed(1) : '0';
                    return (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                          <span className="text-xs text-gray-500">{count} commandes</span>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistiques par période */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Par période
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Aujourd'hui</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      {filteredCarts.filter(cart => {
                        const today = new Date();
                        const cartDate = new Date(cart.timestamp);
                        return cartDate.toDateString() === today.toDateString();
                      }).length}
                    </p>
                  </div>
                  <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Cette semaine</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      {filteredCarts.filter(cart => {
                        const now = new Date();
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        const cartDate = new Date(cart.timestamp);
                        return cartDate >= weekAgo;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Ce mois</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      {filteredCarts.filter(cart => {
                        const now = new Date();
                        const cartDate = new Date(cart.timestamp);
                        return cartDate.getMonth() === now.getMonth() && cartDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top clients */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Top clients
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const clientStats = filteredCarts.reduce((acc, cart) => {
                      if (!acc[cart.client]) {
                        acc[cart.client] = { count: 0, total: 0 };
                      }
                      acc[cart.client].count++;
                      acc[cart.client].total += cart.total;
                      return acc;
                    }, {} as Record<string, { count: number; total: number }>);

                    return Object.entries(clientStats)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .slice(0, 5)
                      .map(([client, stats]) => (
                        <div key={client} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{client}</p>
                              <p className="text-xs text-gray-400">{stats.count} commandes</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-emerald-600">{formatPrice(stats.total)}</p>
                        </div>
                      ));
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={closeStatsModal}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    exportToExcel();
                    closeStatsModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exporter les données
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commandes;
