import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Package, BoxIcon, AlertTriangle, XCircle, Search, X, Eye, Store, Calendar, Hash, DollarSign, AlertCircle, Image, Settings, User, Mail, Phone, Edit3, Trash2 } from 'lucide-react';

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
  vendeurName?: string;
  vendeurEmail?: string;
  vendeurPhone?: string;
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

const Produits = () => {
  const [vendeurs, setVendeurs] = useState<VendeurWithProductsType[]>([]);
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchVendeurs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/vendeurs');
        console.log(JSON.stringify(response.data));
        setVendeurs(response.data.vendeurWITHProduct || []);
        
        // Extraire tous les produits de tous les vendeurs
        const allProductsData = response.data.vendeurWITHProduct?.flatMap((vendeurData: VendeurWithProductsType) => 
          vendeurData.products.map(product => ({
            ...product,
            vendeurName: `${vendeurData.vendeur.firstName} ${vendeurData.vendeur.lastName}`,
            vendeurEmail: vendeurData.vendeur.email,
            vendeurPhone: vendeurData.vendeur.phone
          }))
        ) || [];
        
        setAllProducts(allProductsData);
        setFilteredProducts(allProductsData);
      } catch (error) {
        console.log(error);
        setError('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    fetchVendeurs();
  }, []);

  // Filtrer les produits basé sur le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(allProducts);
      return;
    }

    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.price.toString().includes(searchTerm) ||
      product.stock.toString().includes(searchTerm) ||
      product.vendeurName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendeurEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendeurPhone?.includes(searchTerm)
    );

    setFilteredProducts(filtered);
  }, [searchTerm, allProducts]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Rupture', class: 'bg-red-50 text-red-700 border border-red-200' };
    if (stock <= 10) return { text: 'Faible', class: 'bg-amber-50 text-amber-700 border border-amber-200' };
    return { text: 'En stock', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  };

  const openModal = (product: ProductType) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            Gestion des Produits
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-14">Catalogue complet des produits</p>
        </div>
        {!loading && !error && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200">
            <Package className="w-4 h-4" />
            {allProducts.length} produit{allProducts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-200 border-t-emerald-600"></div>
          <span className="mt-4 text-gray-500 font-medium">Chargement des produits...</span>
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
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Produits</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredProducts.length}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BoxIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">En Stock</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {filteredProducts.filter(p => p.stock > 10).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Stock Faible</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {filteredProducts.filter(p => p.stock > 0 && p.stock <= 10).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-red-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rupture</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {filteredProducts.filter(p => p.stock === 0).length}
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
                placeholder="Rechercher par nom, description, prix, stock, vendeur..."
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
                {filteredProducts.length} produit(s) trouvé(s)
              </div>
            )}
          </div>

          {/* Tableau de produits */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Vendeur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {product.media ? (
                                <img 
                                  src={product.media.mediaUrl} 
                                  alt={product.name}
                                  className="w-11 h-11 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 ${product.media ? 'hidden' : ''}`}>
                                <Package className="w-5 h-5 text-emerald-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-800 truncate">{product.name}</div>
                                <div className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-800">{product.vendeurName}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {product.vendeurEmail}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-emerald-600">
                              {formatPrice(product.price)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-700">{product.stock}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${stockStatus.class}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-400 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(product.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                              onClick={() => openModal(product)}
                              title="Voir les détails"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Search className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
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
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* En-tête du modal - sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Détails du produit</h3>
                  <p className="text-xs text-gray-400 font-mono">#{selectedProduct.id}</p>
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
              {/* Image du produit */}
              {selectedProduct.media && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-violet-50 rounded-lg">
                      <Image className="w-4 h-4 text-violet-600" />
                    </div>
                    <h4 className="font-semibold text-gray-700 text-sm">Image du produit</h4>
                  </div>
                  <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <img 
                      src={selectedProduct.media.mediaUrl} 
                      alt={selectedProduct.name}
                      className="max-w-full h-64 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Informations du produit */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Package className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Informations du produit</h4>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Nom</p>
                      <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Prix</p>
                      <p className="font-bold text-emerald-600 text-lg">{formatPrice(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Stock</p>
                      <p className="font-semibold text-gray-800">{selectedProduct.stock} unités</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Statut</p>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getStockStatus(selectedProduct.stock).class}`}>
                        {getStockStatus(selectedProduct.stock).text}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Description</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du vendeur */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Store className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Informations du vendeur</h4>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Nom</p>
                      <p className="font-semibold text-gray-800">{selectedProduct.vendeurName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                      <p className="font-medium text-gray-700 text-sm">{selectedProduct.vendeurEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</p>
                      <p className="font-medium text-gray-700">{selectedProduct.vendeurPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> ID Vendeur</p>
                      <p className="font-mono text-sm text-gray-700">{selectedProduct.vendeurId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations techniques */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <Settings className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700 text-sm">Informations techniques</h4>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">ID Produit</p>
                      <p className="font-mono text-sm text-gray-700">{selectedProduct.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Catégorie ID</p>
                      <p className="font-mono text-sm text-gray-700">{selectedProduct.categorieId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date de création</p>
                      <p className="font-medium text-gray-700">{formatDate(selectedProduct.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Dernière mise à jour</p>
                      <p className="font-medium text-gray-700">{formatDate(selectedProduct.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - sticky footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <button 
                onClick={closeModal}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Fermer
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm">
                <Edit3 className="w-4 h-4" />
                Modifier
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-sm">
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produits;
