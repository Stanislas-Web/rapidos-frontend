import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import {
  Zap, Clock, CheckCircle, DollarSign,
  Search, X, Eye, AlertCircle, Filter,
  User, Phone, MapPin, Package, Calendar, ChevronLeft, ChevronRight,
  Hash, ShoppingBag, FileSpreadsheet
} from 'lucide-react';

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
  pickupAddress: any;
  deliveryAddress: any;
  pickupReference: any;
  deliveryReference: any;
  createdBy: number;
  statut: string;
  imageColis: string | null;
  items: CommandeExpressItem[];
  deliveryPersonId: number | null;
  vendorId: number | null;
  prixColis: number;
  fraisLivraison: number;
  totalAvecLivraison: number;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCommande, setSelectedCommande] = useState<CommandeExpressType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
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

  // Mettre à jour le filtre de période quand les dates personnalisées changent
  useEffect(() => {
    if (startDate || endDate) {
      setDateFilter('custom');
    } else if (dateFilter === 'custom') {
      setDateFilter('all');
    }
  }, [startDate, endDate]);

  // Filtrer les commandes
  useEffect(() => {
    let filtered = commandes;

    // Filtre par statut
    if (statusFilter !== 'all') {
      if (statusFilter === 'en_attente') {
        filtered = filtered.filter(cmd => {
          const s = cmd.statut?.toLowerCase().trim();
          return !s || s === '' || s === 'pending' || s === 'en_attente' || s === 'en attente';
        });
      } else {
        filtered = filtered.filter(cmd => cmd.statut?.toLowerCase() === statusFilter.toLowerCase());
      }
    }

    // Filtre par date
    if (startDate || endDate) {
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(cmd => {
          const d = new Date(cmd.createdAt);
          return d >= start && d <= end;
        });
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(cmd => new Date(cmd.createdAt) >= start);
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(cmd => new Date(cmd.createdAt) <= end);
      }
    } else if (dateFilter !== 'all') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(cmd => new Date(cmd.createdAt) >= startOfDay);
          break;
        case 'week': {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          filtered = filtered.filter(cmd => new Date(cmd.createdAt) >= startOfWeek);
          break;
        }
        case 'month': {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          filtered = filtered.filter(cmd => new Date(cmd.createdAt) >= startOfMonth);
          break;
        }
        case 'year': {
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          filtered = filtered.filter(cmd => new Date(cmd.createdAt) >= startOfYear);
          break;
        }
      }
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(cmd =>
        cmd.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.clientPhone?.includes(searchTerm) ||
        cmd.packageDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatAddress(cmd.pickupAddress)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatAddress(cmd.deliveryAddress)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.statut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCommandes(filtered);
  }, [searchTerm, statusFilter, dateFilter, startDate, endDate, commandes]);

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (addr: any): string => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      const parts = [
        addr.numero,
        addr.avenue,
        addr.quartier,
        addr.commune,
        addr.ville,
        addr.pays,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    return String(addr);
  };

  const safeString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const shortOrderId = (orderId: string | undefined | null, fallback?: number | string) => {
    if (!orderId) return fallback ? `${fallback}` : 'N/A';
    return orderId.split('-')[0];
  };

  const getStatusColor = (statut: string) => {
    const s = statut?.toLowerCase().trim();
    switch (s) {
      case 'livre':
      case 'livré':
      case 'livrée':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en_cours':
      case 'en cours':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'en_attente':
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'annulé':
      case 'annulée':
        return 'bg-red-100 text-red-800 border-red-200';
      case '':
      case undefined:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (statut: string) => {
    const s = statut?.toLowerCase().trim();
    switch (s) {
      case 'livre': case 'livré': case 'livrée': case 'delivered': return 'Livre';
      case 'en_cours': case 'en cours': case 'in_progress': return 'En cours';
      case 'pending': case 'en_attente': case 'en attente': return 'En attente';
      case 'cancelled': case 'annulé': return 'Annule';
      case '': case undefined: return 'En attente';
      default: return statut || 'En attente';
    }
  };

  const openModal = (cmd: CommandeExpressType) => {
    setSelectedCommande(cmd);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCommande(null);
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredCommandes.map(cmd => ({
        'ID': cmd.id,
        'N° Commande': cmd.orderId,
        'Client': cmd.clientName,
        'Téléphone': cmd.clientPhone,
        'Valeur colis': cmd.packageValue,
        'Description': cmd.packageDescription,
        'Adresse ramassage': formatAddress(cmd.pickupAddress),
        'Adresse livraison': formatAddress(cmd.deliveryAddress),
        'Nombre articles': cmd.items?.length || 0,
        'Statut': getStatusText(cmd.statut),
        'Date': cmd.createdAt ? formatDate(cmd.createdAt) : '-',
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Commandes Express');
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `commandes_express_${date}.xlsx`);
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm m-4 md:m-6">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-amber-200 border-t-amber-600"></div>
        <span className="mt-4 text-gray-500 font-medium">Chargement des commandes express...</span>
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
            {meta?.total || filteredCommandes.length} commande{(meta?.total || filteredCommandes.length) > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Commandes</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredCommandes.length}</p>
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
                {filteredCommandes.filter(c => !c.statut || c.statut.trim() === '' || ['pending', 'en_attente', 'en attente'].includes(c.statut?.toLowerCase())).length}
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
                {filteredCommandes.filter(c => ['livre', 'livré', 'livrée', 'delivered'].includes(c.statut?.toLowerCase())).length}
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
              <p className="text-xm font-extrabold text-gray-900 mt-0.5">
                {formatPrice(filteredCommandes.reduce((total, c) => total + (parseFloat(c.packageValue) || 0), 0))}
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
                className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1.5 transition-colors"
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
                placeholder="Client, téléphone, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all duration-200"
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
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all duration-200 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="livre">Livre</option>
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
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all duration-200 appearance-none"
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
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Résultats et actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-100 gap-3">
            <div className="flex items-center gap-4">
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || startDate || endDate) && (
                <p className="text-xs text-gray-400">
                  {filteredCommandes.length} résultat{filteredCommandes.length > 1 ? 's' : ''} trouvé{filteredCommandes.length > 1 ? 's' : ''}
                </p>
              )}
              {filteredCommandes.length > 0 && (
                <p className="text-xs font-semibold text-gray-600">
                  Total: {formatPrice(filteredCommandes.reduce((total, c) => total + (parseFloat(c.packageValue) || 0), 0))}
                </p>
              )}
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                disabled={filteredCommandes.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export
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
                  Adresses
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Prix colis
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Frais livr.
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total TTC
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
              {filteredCommandes.length > 0 ? (
                filteredCommandes.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">#{shortOrderId(cmd.orderId, cmd.id)}</span>
                        {cmd.items && cmd.items.length > 0 ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                              <Package className="w-3 h-3" />
                              {cmd.items.length}
                            </span>
                            <span className="text-xs text-gray-400 truncate max-w-[100px]">
                              {cmd.items.map(item => item.name).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">Aucun article</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cmd.clientName || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{cmd.clientPhone || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-[220px]">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span className="truncate">{formatAddress(cmd.pickupAddress)}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                          <span className="truncate">{formatAddress(cmd.deliveryAddress)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700">
                        {formatPrice(cmd.prixColis)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700">
                        {formatPrice(cmd.fraisLivraison)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatPrice(cmd.totalAvecLivraison || cmd.packageValue)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusColor(cmd.statut)}`}>
                        {getStatusText(cmd.statut)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500">{formatDate(cmd.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openModal(cmd)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="w-8 h-8 text-gray-300" />
                      <p className="text-sm text-gray-400 font-medium">
                        {searchTerm || statusFilter !== 'all' ? 'Aucune commande express trouvée' : 'Aucune commande express disponible'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page <span className="font-semibold text-gray-600">{meta.currentPage}</span> sur <span className="font-semibold text-gray-600">{meta.lastPage}</span>
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-gray-600">{meta.total}</span> commande{meta.total > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.currentPage <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      pageNum === meta.currentPage
                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                        : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                disabled={meta.currentPage >= meta.lastPage}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showModal && selectedCommande && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Commande #{shortOrderId(selectedCommande.orderId, selectedCommande.id)}
                  </h3>
                  <p className="text-xs text-gray-400">{formatDate(selectedCommande.createdAt)}</p>
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
              {/* Informations client */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Informations client
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Nom</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedCommande.clientName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {selectedCommande.clientPhone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">ID Client</p>
                      <p className="text-sm font-medium text-gray-600">{selectedCommande.clientId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Statut</p>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getStatusColor(selectedCommande.statut)}`}>
                        {getStatusText(selectedCommande.statut)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image du colis */}
              {selectedCommande.imageColis && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    Image du colis
                  </h4>
                  <div className="flex justify-center bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                    <img 
                      src={selectedCommande.imageColis} 
                      alt="Image du colis"
                      className="max-w-full max-h-64 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Détails de la commande */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" />
                  Détails de la commande
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">N° Commande</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{shortOrderId(selectedCommande.orderId, selectedCommande.id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Valeur du colis</p>
                      <p className="text-sm font-bold text-emerald-600">{formatPrice(selectedCommande.packageValue)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Description du colis</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedCommande.packageDescription || 'N/A'}</p>
                    </div>
                    {selectedCommande.vendorId && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">ID Vendeur</p>
                        <p className="text-sm font-medium text-gray-600">{selectedCommande.vendorId}</p>
                      </div>
                    )}
                    {selectedCommande.deliveryPersonId && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">ID Livreur</p>
                        <p className="text-sm font-medium text-gray-600">{selectedCommande.deliveryPersonId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Adresses */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Adresses
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">Adresse de récupération</p>
                      <p className="text-sm font-medium text-gray-700">{formatAddress(selectedCommande.pickupAddress)}</p>
                      {selectedCommande.pickupReference && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Réf: {safeString(selectedCommande.pickupReference)}
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
                      <p className="text-xs text-gray-400 mb-0.5">Adresse de livraison</p>
                      <p className="text-sm font-medium text-gray-700">{formatAddress(selectedCommande.deliveryAddress)}</p>
                      {selectedCommande.deliveryReference && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Réf: {safeString(selectedCommande.deliveryReference)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles */}
              {selectedCommande.items && selectedCommande.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Articles ({selectedCommande.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedCommande.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">Qté: {item.quantity}</span>
                            <span className="text-xs text-gray-400">{formatPrice(item.price)}/unité</span>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Dates
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date de la livraison</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedCommande.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Dernière mise à jour</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedCommande.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Prix colis</p>
                  <p className="text-sm font-semibold text-gray-700">{formatPrice(selectedCommande.prixColis)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Frais de livraison</p>
                  <p className="text-sm font-semibold text-gray-700">{formatPrice(selectedCommande.fraisLivraison)}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Total avec livraison</p>
                  <p className="text-xl font-extrabold text-emerald-600">{formatPrice(selectedCommande.totalAvecLivraison || selectedCommande.packageValue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandeExpress;
