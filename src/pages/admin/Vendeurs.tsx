import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Store, Package, UserCheck, Clock, Search, X, Mail, Phone, Calendar, AlertCircle, Hash, BoxIcon, ShoppingBag } from 'lucide-react';

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

  useEffect(() => {
    const fetchVendeurs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/vendeurs');
        console.log(JSON.stringify(response.data));
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

  // Filtrer les vendeurs et produits basé sur le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVendeurs(vendeurs);
      return;
    }

    const filtered = vendeurs.map(vendeurData => {
      // Vérifier si le vendeur correspond au terme de recherche
      const vendeurMatches = 
        vendeurData.vendeur.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendeurData.vendeur.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendeurData.vendeur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendeurData.vendeur.phone.includes(searchTerm);

      // Filtrer les produits qui correspondent au terme de recherche
      const filteredProducts = vendeurData.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.price.toString().includes(searchTerm) ||
        product.stock.toString().includes(searchTerm)
      );

      // Retourner le vendeur seulement s'il correspond ou s'il a des produits qui correspondent
      if (vendeurMatches || filteredProducts.length > 0) {
        return {
          ...vendeurData,
          products: vendeurMatches ? vendeurData.products : filteredProducts
        };
      }

      return null;
    }).filter(Boolean) as VendeurWithProductsType[];

    setFilteredVendeurs(filtered);
  }, [searchTerm, vendeurs]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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
        {!loading && !error && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200">
            <Store className="w-4 h-4" />
            {vendeurs.length} vendeur{vendeurs.length > 1 ? 's' : ''}
          </span>
        )}
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
                    {filteredVendeurs.filter(v => v.vendeur.userStatus === 'active' || v.vendeur.userStatus === 'pending').length}
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
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    0
                    {/* {filteredVendeurs.filter(v => v.vendeur.userStatus === 'pending').length} */}
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
                placeholder="Rechercher par nom, email, téléphone, produit, prix..."
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

          {/* Liste des vendeurs */}
          <div className="space-y-5">
            {filteredVendeurs.length > 0 ? (
              filteredVendeurs.map((vendeurData) => (
                <div key={vendeurData.vendeur.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* En-tête du vendeur */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {vendeurData.media && vendeurData.media.mediaUrl ? (
                          <img 
                            src={vendeurData.media.mediaUrl} 
                            alt={`${vendeurData.vendeur.firstName} ${vendeurData.vendeur.lastName}`}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-200 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-sm ${vendeurData.media && vendeurData.media.mediaUrl ? 'hidden' : ''}`}>
                          <span className="text-white font-bold text-lg">
                            {vendeurData.vendeur.firstName.charAt(0)}{vendeurData.vendeur.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {vendeurData.vendeur.firstName} {vendeurData.vendeur.lastName}
                          </h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Mail className="w-3.5 h-3.5" />
                              {vendeurData.vendeur.email}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Phone className="w-3.5 h-3.5" />
                              {vendeurData.vendeur.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          vendeurData.vendeur.userStatus === 'active' || vendeurData.vendeur.userStatus === 'pending'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            vendeurData.vendeur.userStatus === 'active' || vendeurData.vendeur.userStatus === 'pending'
                              ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}></span>
                          {vendeurData.vendeur.userStatus === 'active' || vendeurData.vendeur.userStatus === 'pending' ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          Inscrit le {formatDate(vendeurData.vendeur.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Produits du vendeur */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-700">
                        Produits
                      </h4>
                      <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                        {vendeurData.products.length}
                      </span>
                    </div>
                    
                    {vendeurData.products.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendeurData.products.map((product) => (
                          <div key={product.id} className="group border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all duration-200 bg-gray-50/50">
                            {product.media && (
                              <div className="mb-3 -mx-1 -mt-1">
                                <img 
                                  src={product.media.mediaUrl} 
                                  alt={product.name}
                                  className="w-full h-32 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.parentElement!.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">{product.name}</h5>
                              <span className="text-xs text-gray-400 font-mono flex items-center gap-0.5">
                                <Hash className="w-3 h-3" />
                                {product.id}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="text-base font-bold text-emerald-600">
                                {formatPrice(product.price)}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                product.stock > 0 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                <BoxIcon className="w-3 h-3" />
                                {product.stock}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">
                          Aucun produit pour ce vendeur
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700">Aucun résultat trouvé</h3>
                <p className="mt-1 text-sm text-gray-400 max-w-sm mx-auto">
                  {searchTerm ? `Aucun vendeur ou produit ne correspond à "${searchTerm}"` : 'Aucun vendeur disponible'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendeurs;
