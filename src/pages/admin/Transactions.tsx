// src/pages/admin/Transactions.tsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';

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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement des transactions...</span>
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
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Transactions</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Total Transactions</h3>
          <p className="text-2xl font-bold text-indigo-600">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Chiffre d'affaires</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0))}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Transaction moyenne</h3>
          <p className="text-2xl font-bold text-blue-600">
            {filteredTransactions.length > 0 
              ? formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0) / filteredTransactions.length)
              : formatPrice(0)
            }
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Produits vendus</h3>
          <p className="text-2xl font-bold text-purple-600">
            {filteredTransactions.reduce((total, t) => total + t.itemsCount, 0)}
          </p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="space-y-6">
          {/* En-tête des filtres */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Filtres et recherche</h3>
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Effacer les filtres</span>
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Première ligne - Filtres principaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Barre de recherche améliorée */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Recherche
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Client, téléphone, montant..."
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
              </div>

              {/* Filtre par statut amélioré */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none"
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
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Filtre par date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Période
                </label>
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none"
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
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Deuxième ligne - Dates personnalisées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Résultats et actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || startDate || endDate) && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{filteredTransactions.length} transaction(s) trouvée(s)</span>
                </div>
              )}
              {filteredTransactions.length > 0 && (
                <div className="text-sm text-gray-500">
                  Total: {formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0))}
                </div>
              )}
            </div>
            
            {/* Actions rapides */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={exportToExcel}
                disabled={filteredTransactions.length === 0}
                className="px-4 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Export
              </button>
              <button 
                onClick={openStatsModal}
                className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
              >
                Statistiques
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{transaction.id.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.client}</div>
                        <div className="text-sm text-gray-500">{transaction.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatPrice(transaction.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.itemsCount} produit(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openModal(transaction)}
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
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'Aucune transaction trouvée' : 'Aucune transaction disponible'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détails */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails de la transaction #{selectedTransaction.id.slice(-8)}
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

              {/* Informations de la transaction */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">💳 Informations de la transaction</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Montant total</p>
                      <p className="text-lg font-bold text-green-600">{formatPrice(selectedTransaction.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nombre de produits</p>
                      <p className="font-medium">{selectedTransaction.itemsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedTransaction.status)}`}>
                        {getStatusText(selectedTransaction.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Méthode de paiement</p>
                      <p className="font-medium">{selectedTransaction.paymentMethod || 'Non spécifiée'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du client */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">👤 Informations client</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="font-medium">{selectedTransaction.client}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">{selectedTransaction.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations temporelles */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">⏰ Informations temporelles</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date de transaction</p>
                      <p className="font-medium">{formatDate(selectedTransaction.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ID Transaction</p>
                      <p className="font-medium">{selectedTransaction.id}</p>
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
                  Exporter
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de statistiques détaillées */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  📊 Statistiques détaillées des transactions
                </h3>
                <button
                  onClick={closeStatsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Statistiques générales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-700">Total Transactions</h4>
                  <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-700">Chiffre d'affaires</h4>
                  <p className="text-md font-bold text-green-600">
                    {formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0))}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-medium text-purple-700">Transaction moyenne</h4>
                  <p className="text-lg font-bold text-purple-600">
                    {filteredTransactions.length > 0 
                      ? formatPrice(filteredTransactions.reduce((total, t) => total + t.total, 0) / filteredTransactions.length)
                      : formatPrice(0)
                    }
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-700">Produits vendus</h4>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredTransactions.reduce((total, t) => total + t.itemsCount, 0)}
                  </p>
                </div>
              </div>

              {/* Statistiques par statut */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">📈 Répartition par statut</h4>
                <div className="space-y-3">
                  {['pending', 'delivered', 'cancelled', 'en route pour livraison', 'prêt à expédier', 'colis en cours de préparation', 'rejected'].map(status => {
                    const count = filteredTransactions.filter(t => t.status === status).length;
                    const percentage = filteredTransactions.length > 0 ? ((count / filteredTransactions.length) * 100).toFixed(1) : '0';
                    return (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                          <span className="text-sm text-gray-600">{count} transactions</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistiques par période */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">📅 Statistiques par période</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Aujourd'hui</h5>
                    <p className="text-lg font-bold text-gray-800">
                      {filteredTransactions.filter(t => {
                        const today = new Date();
                        const transactionDate = new Date(t.timestamp);
                        return transactionDate.toDateString() === today.toDateString();
                      }).length}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Cette semaine</h5>
                    <p className="text-lg font-bold text-gray-800">
                      {filteredTransactions.filter(t => {
                        const now = new Date();
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        const transactionDate = new Date(t.timestamp);
                        return transactionDate >= weekAgo;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Ce mois</h5>
                    <p className="text-lg font-bold text-gray-800">
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
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">👥 Top clients</h4>
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
                      .map(([client, stats]) => (
                        <div key={client} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{client}</p>
                            <p className="text-sm text-gray-600">{stats.count} transactions</p>
                          </div>
                          <p className="font-bold text-green-600">{formatPrice(stats.total)}</p>
                        </div>
                      ));
                  })()}
                </div>
              </div>

              {/* Évolution des transactions */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">📊 Évolution des transactions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Plus grosse transaction</h5>
                    <p className="text-lg font-bold text-green-600">
                      {filteredTransactions.length > 0 
                        ? formatPrice(Math.max(...filteredTransactions.map(t => t.total)))
                        : formatPrice(0)
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Plus petite transaction</h5>
                    <p className="text-lg font-bold text-blue-600">
                      {filteredTransactions.length > 0 
                        ? formatPrice(Math.min(...filteredTransactions.map(t => t.total)))
                        : formatPrice(0)
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={closeStatsModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    exportToExcel();
                    closeStatsModal();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
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

export default Transactions;
