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

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: '/api/vendeurs',
        headers: { 
          'Authorization': 'Bearer oat_NDM0.b1R4cVlzRWZOMUNPN3FveW5WaGVOZ0paVWpTT1c0SFM0LWZEbjFNNDgzNzMzMjk1Ng'
        },
        data: ''
      };

      try {
        const response = await axios.request(config);
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
    if (stock === 0) return { text: 'Rupture', class: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { text: 'Faible', class: 'bg-yellow-100 text-yellow-800' };
    return { text: 'En stock', class: 'bg-green-100 text-green-800' };
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
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits</h1>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Chargement des produits...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Total Produits</h3>
              <p className="text-2xl font-bold text-indigo-600">{filteredProducts.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">En Stock</h3>
              <p className="text-2xl font-bold text-green-600">
                {filteredProducts.filter(p => p.stock > 10).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Stock Faible</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredProducts.filter(p => p.stock > 0 && p.stock <= 10).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Rupture</h3>
              <p className="text-2xl font-bold text-red-600">
                {filteredProducts.filter(p => p.stock === 0).length}
              </p>
            </div>
          </div>

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
                placeholder="Rechercher par nom, description, prix, stock, vendeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {filteredProducts.length} produit(s) trouvé(s)
              </div>
            )}
          </div>

          {/* Tableau de produits */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.media && (
                                <img 
                                  src={product.media.mediaUrl} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover mr-3"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.vendeurName}</div>
                              <div className="text-sm text-gray-500">{product.vendeurEmail}</div>
                              <div className="text-sm text-gray-500">{product.vendeurPhone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600">
                              {formatPrice(product.price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.stock}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.class}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(product.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              onClick={() => openModal(product)}
                              title="Voir les détails"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails du produit
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

              {/* Image du produit */}
              {selectedProduct.media && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">🖼️ Image du produit</h4>
                  <div className="flex justify-center">
                    <img 
                      src={selectedProduct.media.mediaUrl} 
                      alt={selectedProduct.name}
                      className="max-w-full h-64 object-contain rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Informations du produit */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">📦 Informations du produit</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="font-medium">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prix</p>
                      <p className="font-medium text-green-600">{formatPrice(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Stock</p>
                      <p className="font-medium">{selectedProduct.stock} unités</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatus(selectedProduct.stock).class}`}>
                        {getStockStatus(selectedProduct.stock).text}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium">{selectedProduct.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du vendeur */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">👤 Informations du vendeur</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="font-medium">{selectedProduct.vendeurName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedProduct.vendeurEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">{selectedProduct.vendeurPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ID Vendeur</p>
                      <p className="font-medium">{selectedProduct.vendeurId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations techniques */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">🔧 Informations techniques</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ID Produit</p>
                      <p className="font-medium">{selectedProduct.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Catégorie ID</p>
                      <p className="font-medium">{selectedProduct.categorieId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date de création</p>
                      <p className="font-medium">{formatDate(selectedProduct.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dernière mise à jour</p>
                      <p className="font-medium">{formatDate(selectedProduct.updatedAt)}</p>
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
                  Modifier
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produits;
