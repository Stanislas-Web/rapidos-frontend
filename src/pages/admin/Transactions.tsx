// src/pages/admin/Transactions.tsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';
import {
  CreditCard, DollarSign, TrendingUp, Package, Search, X, Eye,
  Filter, Calendar, Download, BarChart3, Clock, Phone, User,
  ChevronDown, AlertCircle, Hash, FileSpreadsheet, CheckCircle,
  XCircle, Truck, ShoppingCart, Users, ArrowUpDown
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

type TransactionType = {
  id: string;
  client: string;
  phone: string;
  total: number;
  status: string;
  timestamp: Date;
  itemsCount: number;
  paymentMethod?: string;
};

const Transactions = () => {
  const [carts, setCarts] = useState<CartType[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Écouter les changements en temps réel
        const unsubscribe = onSnapshot(
          query(collection(db, 'carts'), orderBy('timestamp', 'desc')),
          (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date()
            })) as CartType[];
            
            setCarts(data);
            
            // Convertir les carts en transactions
            const transactionsData = data.map(cart => ({
              id: cart.id || '',
              client: cart.client,
              phone: cart.phone,
              total: cart.total,
              status: cart.status,
              timestamp: cart.timestamp,
              itemsCount: cart.items.length,
              paymentMethod: 'Cash' // Par défaut, on peut l'ajouter plus tard
            }));
            
            setTransactions(transactionsData);
            setFilteredTransactions(transactionsData);
            setLoading(false);
          },
          (error) => {
            console.error('Erreur lors de l\'écoute des changements:', error);
            setError('Erreur lors du chargement des transactions');
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des transactions');
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Mettre à jour le filtre de période quand les dates personnalisées changent
  useEffect(() => {
    if (startDate || endDate) {
      setDateFilter('custom');
    } else if (dateFilter === 'custom') {
      setDateFilter('all');
    }
  }, [startDate, endDate]);

  // Filtrer les transactions basé sur le terme de recherche, le statut et la date
  useEffect(() => {
    let filtered = transactions;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Filtre par date (priorité aux dates personnalisées)
    if (startDate || endDate) {
      // Filtre par dates personnalisées
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(transaction => 
          transaction.timestamp >= start && transaction.timestamp <= end
        );
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(transaction => 
          transaction.timestamp >= start
        );
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(transaction => 
          transaction.timestamp <= end
        );
      }
    } else if (dateFilter !== 'all') {
      // Filtre par périodes prédéfinies (seulement si pas de dates personnalisées)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(transaction => 
            transaction.timestamp >= startOfDay && transaction.timestamp <= endOfDay
          );
          break;
        case 'week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          filtered = filtered.filter(transaction => 
            transaction.timestamp >= startOfWeek
          );
          break;
        case 'month':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          filtered = filtered.filter(transaction => 
            transaction.timestamp >= startOfMonth
          );
          break;
        case 'year':
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          filtered = filtered.filter(transaction => 
            transaction.timestamp >= startOfYear
          );
          break;
      }
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(transaction =>
        transaction.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.phone.includes(searchTerm) ||
        transaction.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.total.toString().includes(searchTerm)
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, statusFilter, dateFilter, transactions]);

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

  const openModal = (transaction: TransactionType) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
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
      const exportData = filteredTransactions.map(transaction => ({
        'ID Transaction': transaction.id,
        'Client': transaction.client,
        'Téléphone': transaction.phone,
        'Montant': transaction.total,
        'Montant Formaté': formatPrice(transaction.total),
        'Nombre d\'articles': transaction.itemsCount,
        'Statut': getStatusText(transaction.status),
        'Date de transaction': formatDate(transaction.timestamp),
        'Méthode de paiement': transaction.paymentMethod || 'Cash'
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
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredTransactions.length}</p>
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
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                {formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0))}
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
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                {filteredTransactions.length > 0
                  ? formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0) / filteredTransactions.length)
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
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Produits vendus</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {filteredTransactions.reduce((total, t) => total + t.itemsCount, 0)}
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
                  placeholder="Client, téléphone, montant..."
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

            {/* Statut */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3 h-3" /> Statut
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200 appearance-none pr-10"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="colis en cours de préparation">En préparation</option>
                  <option value="prêt à expédier">Prêt à expédier</option>
                  <option value="en route pour livraison">En route</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                  <option value="rejected">Rejetée</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Période */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Période
              </label>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200 appearance-none pr-10"
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
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Dates personnalisées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date de fin</label>
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
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || startDate || endDate) && (
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{filteredTransactions.length}</span> résultat{filteredTransactions.length > 1 ? 's' : ''}
                  {filteredTransactions.length > 0 && (
                    <span className="ml-2 text-emerald-600 font-semibold">
                      ({formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0))})
                    </span>
                  )}
                </p>
              )}
            </div>
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); setStartDate(''); setEndDate(''); }}
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
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Articles</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-semibold text-gray-700">
                        #{transaction.id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-bold text-xs">
                            {transaction.client.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{transaction.client}</p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {transaction.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-emerald-600">{formatPrice(transaction.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        {transaction.itemsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(transaction.timestamp)}
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
                        {searchTerm || statusFilter !== 'all' ? 'Aucune transaction trouvée' : 'Aucune transaction disponible'}
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
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 px-4" onClick={closeModal}>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transaction #{selectedTransaction.id.slice(-8)}</h3>
                  <p className="text-xs text-gray-400">Détails complets</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

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
                    <p className="text-xl font-extrabold text-emerald-700 mt-1">{formatPrice(selectedTransaction.total)}</p>
                  </div>
                  <div className="bg-blue-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-blue-600/70 font-medium uppercase tracking-wider">Articles</p>
                    <p className="text-xl font-extrabold text-blue-700 mt-1">{selectedTransaction.itemsCount}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-gray-50/80 p-3 rounded-xl">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Statut</p>
                    <span className={`inline-flex items-center mt-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusColor(selectedTransaction.status)}`}>
                      {getStatusText(selectedTransaction.status)}
                    </span>
                  </div>
                  <div className="bg-gray-50/80 p-3 rounded-xl">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Paiement</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1.5">{selectedTransaction.paymentMethod || 'Cash'}</p>
                  </div>
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
                    <span className="text-blue-700 font-bold">{selectedTransaction.client.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedTransaction.client}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {selectedTransaction.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Infos temporelles */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Informations temporelles
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Date</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(selectedTransaction.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">ID complet</p>
                    <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">{selectedTransaction.id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
                Fermer
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
                <Download className="w-3.5 h-3.5" />
                Exporter
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Valider
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

            <div className="p-6 space-y-6">
              {/* Statistiques générales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50/80 p-4 rounded-xl text-center">
                  <p className="text-[11px] text-blue-600/70 font-medium uppercase tracking-wider">Transactions</p>
                  <p className="text-2xl font-extrabold text-blue-700 mt-1">{filteredTransactions.length}</p>
                </div>
                <div className="bg-emerald-50/80 p-4 rounded-xl text-center">
                  <p className="text-[11px] text-emerald-600/70 font-medium uppercase tracking-wider">CA Total</p>
                  <p className="text-sm font-extrabold text-emerald-700 mt-1">
                    {formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0))}
                  </p>
                </div>
                <div className="bg-violet-50/80 p-4 rounded-xl text-center">
                  <p className="text-[11px] text-violet-600/70 font-medium uppercase tracking-wider">Moyenne</p>
                  <p className="text-sm font-extrabold text-violet-700 mt-1">
                    {filteredTransactions.length > 0 
                      ? formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0) / filteredTransactions.length)
                      : formatPrice(0)
                    }
                  </p>
                </div>
                <div className="bg-amber-50/80 p-4 rounded-xl text-center">
                  <p className="text-[11px] text-amber-600/70 font-medium uppercase tracking-wider">Produits</p>
                  <p className="text-2xl font-extrabold text-amber-700 mt-1">
                    {filteredTransactions.reduce((total, t) => total + t.itemsCount, 0)}
                  </p>
                </div>
              </div>

              {/* Répartition par statut */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Répartition par statut
                </h4>
                <div className="space-y-2">
                  {['pending', 'delivered', 'cancelled', 'en route pour livraison', 'prêt à expédier', 'colis en cours de préparation', 'rejected'].map(status => {
                    const count = filteredTransactions.filter(t => t.status === status).length;
                    const percentage = filteredTransactions.length > 0 ? ((count / filteredTransactions.length) * 100).toFixed(1) : '0';
                    const widthPercentage = filteredTransactions.length > 0 ? (count / filteredTransactions.length) * 100 : 0;
                    if (count === 0) return null;
                    return (
                      <div key={status} className="bg-gray-50/80 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{count} transaction{count > 1 ? 's' : ''}</span>
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
              </div>

              {/* Statistiques par période */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Par période
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Aujourd'hui</p>
                    <p className="text-2xl font-extrabold text-gray-800 mt-1">
                      {filteredTransactions.filter(t => {
                        const today = new Date();
                        const transactionDate = new Date(t.timestamp);
                        return transactionDate.toDateString() === today.toDateString();
                      }).length}
                    </p>
                  </div>
                  <div className="bg-gray-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Cette semaine</p>
                    <p className="text-2xl font-extrabold text-gray-800 mt-1">
                      {filteredTransactions.filter(t => {
                        const now = new Date();
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        const transactionDate = new Date(t.timestamp);
                        return transactionDate >= weekAgo;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-gray-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Ce mois</p>
                    <p className="text-2xl font-extrabold text-gray-800 mt-1">
                      {filteredTransactions.filter(t => {
                        const now = new Date();
                        const transactionDate = new Date(t.timestamp);
                        return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top clients */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Top clients
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const clientStats = filteredTransactions.reduce((acc, t) => {
                      if (!acc[t.client]) {
                        acc[t.client] = { count: 0, total: 0 };
                      }
                      acc[t.client].count++;
                      acc[t.client].total += t.total;
                      return acc;
                    }, {} as Record<string, { count: number; total: number }>);

                    return Object.entries(clientStats)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .slice(0, 5)
                      .map(([client, stats], index) => (
                        <div key={client} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-700 font-bold text-xs">{index + 1}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{client}</p>
                              <p className="text-[11px] text-gray-400">{stats.count} transaction{stats.count > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-emerald-600">{formatPrice(stats.total)}</p>
                        </div>
                      ));
                  })()}
                </div>
              </div>

              {/* Min / Max */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Extrêmes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-emerald-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-emerald-600/70 font-medium uppercase tracking-wider">Plus grosse</p>
                    <p className="text-lg font-extrabold text-emerald-700 mt-1">
                      {filteredTransactions.length > 0 
                        ? formatPrice(Math.max(...filteredTransactions.map(t => t.total)))
                        : formatPrice(0)
                      }
                    </p>
                  </div>
                  <div className="bg-blue-50/80 p-4 rounded-xl text-center">
                    <p className="text-[11px] text-blue-600/70 font-medium uppercase tracking-wider">Plus petite</p>
                    <p className="text-lg font-extrabold text-blue-700 mt-1">
                      {filteredTransactions.length > 0 
                        ? formatPrice(Math.min(...filteredTransactions.map(t => t.total)))
                        : formatPrice(0)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
