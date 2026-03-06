// src/pages/admin/Transactions.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import {
  CreditCard, DollarSign, TrendingUp, Package, Search, X, Eye,
  Filter, Calendar, Download, BarChart3, Clock, Phone, User,
  ChevronDown, AlertCircle, Hash, FileSpreadsheet, CheckCircle,
  XCircle, Truck, ShoppingCart, Users, ArrowUpDown, ChevronLeft,
  ChevronRight, Wallet
} from 'lucide-react';

// --- Types basés sur l'API ---

type TransactionItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  idVendeur: number;
};

type TransactionAddress = {
  pays: string;
  ville: string;
  commune: string;
  quartier: string;
  avenue: string;
  numero: string;
};

type PaymentMethodType = {
  id: number;
  type: string;
  name: string;
  description: string;
  imageUrl: string;
  numeroCompte: string;
  nomTitulaire: string;
  isDefault: boolean;
  isActive: boolean;
};

type ClientType = {
  id: number;
  name: string;
  phone: string;
  email: string;
};

type VendorType = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

type DeliveryPersonType = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

type TransactionType = {
  id: number;
  orderId: string;
  status: string;
  total: string;
  deliveryFee: number;
  distanceKm: string;
  numeroPayment: string | null;
  codeColis: string;
  createdAt: string;
  updatedAt: string;
  client: ClientType;
  vendor: VendorType;
  deliveryPersonId: number;
  items: TransactionItem[];
  address: TransactionAddress;
  paymentMethod: PaymentMethodType;
};

type TransactionDetailType = TransactionType & {
  packagePhoto?: string;
  latitude?: number;
  longitude?: number;
  deliveryPerson?: DeliveryPersonType;
};

type SummaryType = {
  totalTransactions: number;
  totalRevenue: number;
  totalDeliveryFees: number;
};

type MetaType = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  hasMorePages: boolean;
};

type StatsType = {
  totalTransactions: number;
  totalRevenue: number;
  totalDeliveryFees: number;
  byPaymentMethod: Record<string, { count: number; total: number }>;
  withoutPaymentMethod: number;
};

const PAYMENT_TYPES = [
  { value: 'all', label: 'Tous les paiements' },
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'afrimoney', label: 'Afrimoney' },
  { value: 'visa', label: 'Visa' },
  { value: 'master_card', label: 'Master Card' },
];

const Transactions = () => {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [summary, setSummary] = useState<SummaryType>({ totalTransactions: 0, totalRevenue: 0, totalDeliveryFees: 0 });
  const [meta, setMeta] = useState<MetaType>({ total: 0, perPage: 20, currentPage: 1, lastPage: 1, firstPage: 1, hasMorePages: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<TransactionDetailType | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Récupérer les transactions depuis l'API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = { page, limit };
      if (paymentTypeFilter !== 'all') params.payment_type = paymentTypeFilter;
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;

      const response = await api.get('/admin/transactions', { params });
      const { data, summary: s, meta: m } = response.data;

      setTransactions(data || []);
      if (s) setSummary(s);
      if (m) setMeta(m);
    } catch (err: any) {
      console.error('Erreur lors du chargement des transactions:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, paymentTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [paymentTypeFilter, startDate, endDate]);

  // Filtrage client-side par recherche uniquement (le reste est server-side)
  const filteredTransactions = searchTerm.trim()
    ? transactions.filter(t =>
        t.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.client.phone.includes(searchTerm) ||
        t.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vendor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vendor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.total.toString().includes(searchTerm) ||
        t.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.codeColis.includes(searchTerm)
      )
    : transactions;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF'
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || '-';
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
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

  const getPaymentLabel = (type: string) => {
    return PAYMENT_TYPES.find(p => p.value === type)?.label || type;
  };

  // Ouvrir le modal de détail avec appel API
  const openModal = async (transaction: TransactionType) => {
    setShowModal(true);
    setDetailLoading(true);
    try {
      const response = await api.get(`/admin/transactions/${transaction.id}`);
      setSelectedTransactionDetail(response.data.data);
    } catch (err: any) {
      console.error('Erreur chargement détail:', err);
      // Fallback : utiliser les données de la liste
      setSelectedTransactionDetail(transaction as any);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransactionDetail(null);
  };

  // Ouvrir le modal stats avec appel API
  const openStatsModal = async () => {
    setShowStatsModal(true);
    setStatsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;
      const response = await api.get('/admin/transactions/stats', { params });
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Erreur chargement stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
    setStats(null);
  };

  // Fonction pour exporter en Excel
  const exportToExcel = () => {
    try {
      const exportData = filteredTransactions.map(transaction => ({
        'ID': transaction.id,
        'Order ID': transaction.orderId,
        'Client': transaction.client.name,
        'Téléphone': transaction.client.phone,
        'Email': transaction.client.email,
        'Vendeur': `${transaction.vendor.firstName} ${transaction.vendor.lastName}`,
        'Montant': parseFloat(transaction.total),
        'Montant Formaté': formatPrice(parseFloat(transaction.total)),
        'Frais livraison': transaction.deliveryFee,
        'Nombre d\'articles': transaction.items.length,
        'Statut': getStatusText(transaction.status),
        'Code Colis': transaction.codeColis,
        'Date': formatDate(transaction.createdAt),
        'Méthode de paiement': transaction.paymentMethod?.name || '-'
      }));

      // Créer le workbook et worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Générer le nom du fichier avec la date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `transactions_${date}.xlsx`;

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-gray-200 border-t-emerald-600"></div>
        </div>
        <p className="text-sm text-gray-400 font-medium">Chargement des transactions...</p>
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
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Suivez et gérez toutes les transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={openStatsModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all duration-200"
          >
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transactions</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{summary.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chiffre d'affaires</p>
              <p className="text-xm font-extrabold text-gray-900 mt-0.5">
                {formatPrice(summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-violet-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Moyenne</p>
              <p className="text-xm font-extrabold text-gray-900 mt-0.5">
                {summary.totalTransactions > 0
                  ? formatPrice(summary.totalRevenue / summary.totalTransactions)
                  : formatPrice(0)
                }
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Frais livraison</p>
              <p className="text-xm font-extrabold text-gray-900 mt-0.5">
                {formatPrice(summary.totalDeliveryFees)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 space-y-5">
          {/* Première ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3 h-3" /> Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Client, téléphone, vendeur, code colis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Type de paiement */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3 h-3" /> Paiement
              </label>
              <div className="relative">
                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200 appearance-none pr-10"
                >
                  {PAYMENT_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Placeholder pour alignement */}
            <div />
          </div>
          {/* Dates personnalisées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Footer filtres */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {(searchTerm || paymentTypeFilter !== 'all' || startDate || endDate) && (
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{meta.total}</span> résultat{meta.total > 1 ? 's' : ''}
                  {summary.totalRevenue > 0 && (
                    <span className="ml-2 text-emerald-600 font-semibold">
                      ({formatPrice(summary.totalRevenue)})
                    </span>
                  )}
                </p>
              )}
            </div>
            {(searchTerm || paymentTypeFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={() => { setSearchTerm(''); setPaymentTypeFilter('all'); setStartDate(''); setEndDate(''); }}
                className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

      {/* Tableau des transactions */}
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Vendeur</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Paiement</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-mono font-semibold text-gray-700">
                          #{transaction.id}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Code: {transaction.codeColis}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-bold text-xs">
                            {transaction.client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{transaction.client.name}</p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {transaction.client.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{transaction.vendor.firstName} {transaction.vendor.lastName}</p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {transaction.vendor.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-bold text-emerald-600">{formatPrice(parseFloat(transaction.total))}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{transaction.items.length} article{transaction.items.length > 1 ? 's' : ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {transaction.paymentMethod?.imageUrl && (
                          <img src={transaction.paymentMethod.imageUrl} alt={transaction.paymentMethod.name} className="w-5 h-5 rounded object-contain" />
                        )}
                        <span className="text-xs font-medium text-gray-600">{transaction.paymentMethod?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(transaction.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(transaction)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 border border-gray-100 hover:border-emerald-200 group-hover:shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="w-8 h-8 text-gray-300" />
                      <p className="text-sm text-gray-400">
                        {searchTerm || paymentTypeFilter !== 'all' ? 'Aucune transaction trouvée' : 'Aucune transaction disponible'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page <span className="font-semibold text-gray-600">{meta.currentPage}</span> sur <span className="font-semibold text-gray-600">{meta.lastPage}</span>
              {' '}— <span className="font-semibold text-gray-600">{meta.total}</span> transaction{meta.total > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.currentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-gray-600 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Précédent
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!meta.hasMorePages}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-gray-600 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 px-4" onClick={closeModal}>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transaction #{selectedTransactionDetail?.id}</h3>
                  <p className="text-xs text-gray-400">Détails complets</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-emerald-600"></div>
                <p className="text-sm text-gray-400">Chargement des détails...</p>
              </div>
            ) : selectedTransactionDetail ? (
              <div className="p-6 space-y-5">
                {/* Informations de la transaction */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Informations de la transaction
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/80 p-4 rounded-xl text-center">
                      <p className="text-[11px] text-emerald-600/70 font-medium uppercase tracking-wider">Montant total</p>
                      <p className="text-xl font-extrabold text-emerald-700 mt-1">{formatPrice(parseFloat(selectedTransactionDetail.total))}</p>
                    </div>
                    <div className="bg-blue-50/80 p-4 rounded-xl text-center">
                      <p className="text-[11px] text-blue-600/70 font-medium uppercase tracking-wider">Frais livraison</p>
                      <p className="text-xl font-extrabold text-blue-700 mt-1">{formatPrice(selectedTransactionDetail.deliveryFee)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-gray-50/80 p-3 rounded-xl">
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Statut</p>
                      <span className={`inline-flex items-center mt-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusColor(selectedTransactionDetail.status)}`}>
                        {getStatusText(selectedTransactionDetail.status)}
                      </span>
                    </div>
                    <div className="bg-gray-50/80 p-3 rounded-xl">
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Paiement</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {selectedTransactionDetail.paymentMethod?.imageUrl && (
                          <img src={selectedTransactionDetail.paymentMethod.imageUrl} alt="" className="w-4 h-4 rounded object-contain" />
                        )}
                        <p className="text-sm font-semibold text-gray-800">{selectedTransactionDetail.paymentMethod?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50/80 p-3 rounded-xl">
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Code colis</p>
                      <p className="text-sm font-mono font-semibold text-gray-800 mt-1.5">{selectedTransactionDetail.codeColis}</p>
                    </div>
                  </div>
                </div>

                {/* Articles */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Articles ({selectedTransactionDetail.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTransactionDetail.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                          <p className="text-[11px] text-gray-400">Qté: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-600">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Client
                  </h4>
                  <div className="bg-gray-50/80 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold">{selectedTransactionDetail.client.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{selectedTransactionDetail.client.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {selectedTransactionDetail.client.phone}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{selectedTransactionDetail.client.email}</p>
                    </div>
                  </div>
                </div>

                {/* Vendeur */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Vendeur
                  </h4>
                  <div className="bg-gray-50/80 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-11 h-11 bg-violet-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-700 font-bold">{selectedTransactionDetail.vendor.firstName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{selectedTransactionDetail.vendor.firstName} {selectedTransactionDetail.vendor.lastName}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {selectedTransactionDetail.vendor.phone}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{selectedTransactionDetail.vendor.email}</p>
                    </div>
                  </div>
                </div>

                {/* Livreur */}
                {selectedTransactionDetail.deliveryPerson && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Livreur
                    </h4>
                    <div className="bg-gray-50/80 p-4 rounded-xl flex items-center gap-4">
                      <div className="w-11 h-11 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-700 font-bold">{selectedTransactionDetail.deliveryPerson.firstName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{selectedTransactionDetail.deliveryPerson.firstName} {selectedTransactionDetail.deliveryPerson.lastName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {selectedTransactionDetail.deliveryPerson.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adresse */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Adresse de livraison
                  </h4>
                  <div className="bg-gray-50/80 p-4 rounded-xl">
                    <p className="text-sm text-gray-800">
                      {selectedTransactionDetail.address.numero}, {selectedTransactionDetail.address.avenue}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedTransactionDetail.address.quartier}, {selectedTransactionDetail.address.commune}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedTransactionDetail.address.ville}, {selectedTransactionDetail.address.pays}
                    </p>
                  </div>
                </div>

                {/* Photo colis */}
                {selectedTransactionDetail.packagePhoto && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Photo du colis
                    </h4>
                    <img src={selectedTransactionDetail.packagePhoto} alt="Colis" className="w-full h-48 object-cover rounded-xl border border-gray-100" />
                  </div>
                )}

                {/* Infos temporelles */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Informations temporelles
                  </h4>
                  <div className="bg-gray-50/80 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Créée le</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(selectedTransactionDetail.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Mise à jour</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(selectedTransactionDetail.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Order ID</p>
                      <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">{selectedTransactionDetail.orderId}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Distance</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{parseFloat(selectedTransactionDetail.distanceKm).toFixed(2)} km</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de statistiques détaillées */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 px-4" onClick={closeStatsModal}>
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Statistiques détaillées</h3>
                  <p className="text-xs text-gray-400">Analyse complète des transactions</p>
                </div>
              </div>
              <button onClick={closeStatsModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {statsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-violet-600"></div>
                <p className="text-sm text-gray-400">Chargement des statistiques...</p>
              </div>
            ) : stats ? (
              <div className="p-6 space-y-6">
                {/* Statistiques générales */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-blue-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-blue-600/70 font-medium uppercase tracking-wider">Transactions</p>
                    <p className="text-2xl font-extrabold text-blue-700 mt-1">{stats.totalTransactions}</p>
                  </div>
                  <div className="bg-emerald-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-emerald-600/70 font-medium uppercase tracking-wider">CA Total</p>
                    <p className="text-sm font-extrabold text-emerald-700 mt-1">
                      {formatPrice(stats.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-amber-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-amber-600/70 font-medium uppercase tracking-wider">Frais livraison</p>
                    <p className="text-sm font-extrabold text-amber-700 mt-1">
                      {formatPrice(stats.totalDeliveryFees)}
                    </p>
                  </div>
                </div>

                {/* Répartition par moyen de paiement */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Répartition par moyen de paiement
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(stats.byPaymentMethod).map(([method, data]) => {
                      if (data.count === 0) return null;
                      const percentage = stats.totalTransactions > 0 ? ((data.count / stats.totalTransactions) * 100).toFixed(1) : '0';
                      const widthPercentage = stats.totalTransactions > 0 ? (data.count / stats.totalTransactions) * 100 : 0;
                      return (
                        <div key={method} className="bg-gray-50/80 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                              {getPaymentLabel(method)}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">{data.count} transaction{data.count > 1 ? 's' : ''}</span>
                              <span className="text-xs font-bold text-emerald-600">{formatPrice(data.total)}</span>
                              <span className="text-xs font-bold text-gray-700">{percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${widthPercentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {stats.withoutPaymentMethod > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {stats.withoutPaymentMethod} transaction{stats.withoutPaymentMethod > 1 ? 's' : ''} sans moyen de paiement
                    </p>
                  )}
                </div>

                {/* Moyenne */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Indicateurs
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-violet-50/80 p-4 rounded-xl text-center">
                      <p className="text-[11px] text-violet-600/70 font-medium uppercase tracking-wider">Panier moyen</p>
                      <p className="text-lg font-extrabold text-violet-700 mt-1">
                        {stats.totalTransactions > 0
                          ? formatPrice(stats.totalRevenue / stats.totalTransactions)
                          : formatPrice(0)
                        }
                      </p>
                    </div>
                    <div className="bg-blue-50/80 p-4 rounded-xl text-center">
                      <p className="text-[11px] text-blue-600/70 font-medium uppercase tracking-wider">Frais livraison moyen</p>
                      <p className="text-lg font-extrabold text-blue-700 mt-1">
                        {stats.totalTransactions > 0
                          ? formatPrice(stats.totalDeliveryFees / stats.totalTransactions)
                          : formatPrice(0)
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <AlertCircle className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-400">Impossible de charger les statistiques</p>
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-2">
              <button onClick={closeStatsModal} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
                Fermer
              </button>
              <button 
                onClick={() => { exportToExcel(); closeStatsModal(); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exporter les données
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
