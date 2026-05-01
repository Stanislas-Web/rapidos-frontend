import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import { Store, Package, UserCheck, Clock, Search, X, Mail, Phone, Calendar, AlertCircle, Hash, BoxIcon, ShoppingBag, Download, Eye, Edit3 } from 'lucide-react';

type ProductType = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  vendeurId: number;
  createdAt: string;
  updatedAt: string;
  categorieId: number;
  media: {
    id: number;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    updatedAt: string;
    productId: number;
  } | null;
};

type VendeurType = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secureOtp: number | null;
  otpExpiredAt: string | null;
  termsAccepted: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  userStatus: string;
};

type VendeurWithProductsType = {
  vendeur: VendeurType;
  products: ProductType[];
  media: {
    id: number;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    updatedAt: string;
    productId: number | null;
  } | null;
};

const Vendeurs = () => {
  const [vendeurs, setVendeurs] = useState<VendeurWithProductsType[]>([]);
  const [filteredVendeurs, setFilteredVendeurs] = useState<VendeurWithProductsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendeur, setSelectedVendeur] = useState<VendeurWithProductsType | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '', userStatus: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editVendeurId, setEditVendeurId] = useState<number | null>(null);

  useEffect(() => {
    const fetchVendeurs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/vendeurs');
        setVendeurs(response.data.vendeurWITHProduct || []);
        setFilteredVendeurs(response.data.vendeurWITHProduct || []);
      } catch (error) {
        console.log(error);
        setError('Erreur lors du chargement des vendeurs');
      } finally {
        setLoading(false);
      }
    };

    fetchVendeurs();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVendeurs(vendeurs);
      return;
    }

    const filtered = vendeurs.filter(vendeurData =>
      vendeurData.vendeur.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendeurData.vendeur.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendeurData.vendeur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendeurData.vendeur.phone.includes(searchTerm) ||
      vendeurData.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredVendeurs(filtered);
  }, [searchTerm, vendeurs]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'banned': return 'bg-red-50 text-red-700 border-red-200';
      case 'suspended': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      case 'banned': return 'Banni';
      case 'suspended': return 'Suspendu';
      default: return status;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-400';
      case 'pending': return 'bg-yellow-500';
      case 'banned': return 'bg-red-500';
      case 'suspended': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const openModal = (vendeurData: VendeurWithProductsType) => {
    setSelectedVendeur(vendeurData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVendeur(null);
  };

  const openEditModal = (vendeurData: VendeurWithProductsType) => {
    setEditVendeurId(vendeurData.vendeur.id);
    setEditForm({
      firstName: vendeurData.vendeur.firstName,
      lastName: vendeurData.vendeur.lastName,
      email: vendeurData.vendeur.email,
      phone: vendeurData.vendeur.phone,
      role: vendeurData.vendeur.role,
      userStatus: vendeurData.vendeur.userStatus
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editVendeurId) return;
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/admin/users/${editVendeurId}`, editForm);
      setShowEditModal(false);
      const response = await api.get('/vendeurs');
      setVendeurs(response.data.vendeurWITHProduct || []);
      setFilteredVendeurs(response.data.vendeurWITHProduct || []);
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            Gestion des Vendeurs
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-14">Gérer les vendeurs et leurs produits</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                const exportData = filteredVendeurs.map(v => ({
                  'ID': v.vendeur.id,
                  'Prénom': v.vendeur.firstName,
                  'Nom': v.vendeur.lastName,
                  'Email': v.vendeur.email,
                  'Téléphone': v.vendeur.phone,
                  'Rôle': v.vendeur.role,
                  'Statut': v.vendeur.userStatus,
                  'Nombre de produits': v.products?.length || 0,
                  'Date de création': v.vendeur.createdAt ? new Date(v.vendeur.createdAt).toLocaleDateString('fr-FR') : '-',
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Vendeurs');
                const date = new Date().toISOString().split('T')[0];
                XLSX.writeFile(wb, `vendeurs_${date}.xlsx`);
              } catch (error) {
                console.error('Erreur lors de l\'export Excel:', error);
              }
            }}
            disabled={filteredVendeurs.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          {!loading && !error && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200">
              <Store className="w-4 h-4" />
              {vendeurs.length} vendeur{vendeurs.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-200 border-t-emerald-600"></div>
          <span className="mt-4 text-gray-500 font-medium">Chargement des vendeurs...</span>
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
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Vendeurs</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredVendeurs.length}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Produits</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {filteredVendeurs.reduce((total, v) => total + v.products.length, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-violet-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Vendeurs Actifs</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {filteredVendeurs.filter(v => v.vendeur.userStatus === 'active').length}
                  </p>
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
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">0</p>
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
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                {filteredVendeurs.length} résultat(s) trouvé(s)
              </div>
            )}
          </div>

          {/* Tableau des vendeurs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendeur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produits</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredVendeurs.length > 0 ? (
                    filteredVendeurs.map((vendeurData) => (
                      <tr key={vendeurData.vendeur.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {vendeurData.media && vendeurData.media.mediaUrl ? (
                              <img 
                                src={vendeurData.media.mediaUrl} 
                                alt={`${vendeurData.vendeur.firstName} ${vendeurData.vendeur.lastName}`}
                                className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 ${vendeurData.media && vendeurData.media.mediaUrl ? 'hidden' : ''}`}>
                              <span className="text-white font-bold text-sm">
                                {vendeurData.vendeur.firstName.charAt(0)}{vendeurData.vendeur.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-800">{vendeurData.vendeur.firstName} {vendeurData.vendeur.lastName}</div>
                              <div className="text-xs text-gray-400 font-mono">#{vendeurData.vendeur.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {vendeurData.vendeur.email}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {vendeurData.vendeur.phone}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Package className="w-3 h-3" />
                            {vendeurData.products.length}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(vendeurData.vendeur.userStatus)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(vendeurData.vendeur.userStatus)}`}></span>
                            {getStatusText(vendeurData.vendeur.userStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(vendeurData.vendeur.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                              onClick={() => openModal(vendeurData)}
                              title="Voir les détails"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                              onClick={() => openEditModal(vendeurData)}
                              title="Modifier"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {searchTerm ? `Aucun vendeur ne correspond à "${searchTerm}"` : 'Aucun vendeur disponible'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedVendeur && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-3/4 lg:w-2/3 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Store className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedVendeur.vendeur.firstName} {selectedVendeur.vendeur.lastName}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">#{selectedVendeur.vendeur.id}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Infos vendeur */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Store className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Informations du vendeur</h4>
                </div>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Nom complet</p>
                      <p className="text-sm font-medium text-gray-700">{selectedVendeur.vendeur.firstName} {selectedVendeur.vendeur.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-700">{selectedVendeur.vendeur.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                      <p className="text-sm font-medium text-gray-700">{selectedVendeur.vendeur.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Statut</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedVendeur.vendeur.userStatus)}`}>
                        {getStatusText(selectedVendeur.vendeur.userStatus)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Rôle</p>
                      <p className="text-sm font-medium text-gray-700">{selectedVendeur.vendeur.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date d'inscription</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedVendeur.vendeur.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produits du vendeur */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Produits</h4>
                  <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                    {selectedVendeur.products.length}
                  </span>
                </div>

                {selectedVendeur.products.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedVendeur.products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {product.media ? (
                                  <img 
                                    src={product.media.mediaUrl} 
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 ${product.media ? 'hidden' : ''}`}>
                                  <Package className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-800 truncate">{product.name}</div>
                                  <div className="text-xs text-gray-400 font-mono">#{product.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-500 truncate max-w-[200px]">{product.description}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold text-emerald-600">{formatPrice(product.price)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                product.stock > 10
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : product.stock > 0
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                <BoxIcon className="w-3 h-3" />
                                {product.stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-medium">Aucun produit pour ce vendeur</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <button 
                onClick={closeModal}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-1/2 lg:w-2/5 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl"><Edit3 className="w-5 h-5 text-blue-600" /></div>
                <h3 className="text-lg font-bold text-gray-800">Modifier le vendeur</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              {editError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {editError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Prénom</label>
                  <input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom</label>
                  <input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Téléphone</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Rôle</label>
                  <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none">
                    <option value="vendeur">Vendeur</option>
                    <option value="acheteur">Acheteur</option>
                    <option value="livreur">Livreur</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Statut</label>
                  <select value={editForm.userStatus} onChange={e => setEditForm({...editForm, userStatus: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="pending">En attente</option>
                    <option value="banned">Banni</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Annuler</button>
              <button onClick={handleEdit} disabled={editLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
                {editLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <Edit3 className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendeurs;
