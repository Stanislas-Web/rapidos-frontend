import React, { useEffect, useState } from 'react';
import axios from 'axios';

type CategoryType = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

const Categories = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://24.144.87.127:3333/category/get-all',
        headers: { 
          'Authorization': 'Bearer oat_NDM1.TGUxUE9EVGVHVFM0SThfUXFwRU90NFRYRFlldzlweTZYaFdSZmF0cTIzMzM3MjgxNzM'
        },
        data: ''
      };

      try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
        setCategories(response.data.categories || []);
        setFilteredCategories(response.data.categories || []);
      } catch (error) {
        console.log(error);
        setError('Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filtrer les catégories basé sur le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('sport')) return '⚽';
    if (name.includes('clothing') || name.includes('habillement')) return '👕';
    if (name.includes('jewelry') || name.includes('bijoux')) return '💍';
    if (name.includes('food') || name.includes('nourriture')) return '🍽️';
    if (name.includes('tech') || name.includes('technologie')) return '💻';
    if (name.includes('book') || name.includes('livre')) return '📚';
    if (name.includes('beauty') || name.includes('beauté')) return '💄';
    if (name.includes('home') || name.includes('maison')) return '🏠';
    return '📂';
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Catégories</h1>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Chargement des catégories...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Total Catégories</h3>
              <p className="text-2xl font-bold text-indigo-600">{filteredCategories.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Catégories Actives</h3>
              <p className="text-2xl font-bold text-green-600">{filteredCategories.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Dernière Mise à jour</h3>
              <p className="text-sm text-gray-600">
                {categories.length > 0 ? formatDate(categories[0].updatedAt) : 'N/A'}
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
                placeholder="Rechercher par nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {filteredCategories.length} catégorie(s) trouvée(s)
              </div>
            )}
          </div>

          {/* Liste des catégories */}
          <div className="space-y-4">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                          {getCategoryIcon(category.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 capitalize">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {category.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>ID: {category.id}</span>
                            <span>Créé le: {formatDate(category.createdAt)}</span>
                            <span>Modifié le: {formatDate(category.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 transition-colors p-2"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors p-2"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-lg border text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune catégorie trouvée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? `Aucune catégorie ne correspond à "${searchTerm}"` : 'Aucune catégorie disponible'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
