import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://24.144.87.127:3333/vendeurs',
        headers: { 
          'Authorization': 'Bearer oat_NDM0.b1R4cVlzRWZOMUNPN3FveW5WaGVOZ0paVWpTT1c0SFM0LWZEbjFNNDgzNzMzMjk1Ng'
        },
        data: ''
      };

      try {
        const response = await axios.request(config);
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
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Vendeurs</h1>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Chargement des vendeurs...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Barre de recherche */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone, produit, prix..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {filteredVendeurs.length} résultat(s) trouvé(s)
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Total Vendeurs</h3>
              <p className="text-2xl font-bold text-indigo-600">{filteredVendeurs.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Total Produits</h3>
              <p className="text-2xl font-bold text-green-600">
                {filteredVendeurs.reduce((total, v) => total + v.products.length, 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Vendeurs Actifs</h3>
              <p className="text-2xl font-bold text-blue-600">
                {filteredVendeurs.filter(v => v.vendeur.userStatus === 'active' || v.vendeur.userStatus === 'pending').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">En Attente</h3>
              <p className="text-2xl font-bold text-yellow-600">
              0
                {/* {filteredVendeurs.filter(v => v.vendeur.userStatus === 'pending').length} */}
              </p>
            </div>
          </div>

          {/* Liste des vendeurs */}
          <div className="space-y-4">
            {filteredVendeurs.length > 0 ? (
              filteredVendeurs.map((vendeurData, index) => (
                <div key={vendeurData.vendeur.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  {/* En-tête du vendeur */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {vendeurData.media && vendeurData.media.mediaUrl ? (
                          <img 
                            src={vendeurData.media.mediaUrl} 
                            alt={`${vendeurData.vendeur.firstName} ${vendeurData.vendeur.lastName}`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              // Si l'image ne charge pas, on cache l'img et on affiche l'avatar avec initiales
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center ${vendeurData.media && vendeurData.media.mediaUrl ? 'hidden' : ''}`}>
                          <span className="text-indigo-600 font-semibold">
                            {vendeurData.vendeur.firstName.charAt(0)}{vendeurData.vendeur.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {vendeurData.vendeur.firstName} {vendeurData.vendeur.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{vendeurData.vendeur.email}</p>
                          <p className="text-sm text-gray-500">{vendeurData.vendeur.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vendeurData.vendeur.userStatus === 'active' || vendeurData.vendeur.userStatus === 'pending'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vendeurData.vendeur.userStatus === 'active' || vendeurData.vendeur.userStatus === 'pending' ? 'Actif' : 'Inactif'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Inscrit le {formatDate(vendeurData.vendeur.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Produits du vendeur */}
                  <div className="p-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-4">
                      Produits ({vendeurData.products.length})
                    </h4>
                    
                    {vendeurData.products.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendeurData.products.map((product) => (
                          <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-800">{product.name}</h5>
                              <span className="text-sm text-gray-500">#{product.id}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-green-600">
                                {formatPrice(product.price)}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                product.stock > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                Stock: {product.stock}
                              </span>
                            </div>
                            {product.media && (
                              <div className="mt-2">
                                <img 
                                  src={product.media.mediaUrl} 
                                  alt={product.name}
                                  className="w-full h-24 object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Aucun produit pour ce vendeur
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-lg border text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">
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
