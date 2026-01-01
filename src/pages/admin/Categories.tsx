import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

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
  
  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Récupérer toutes les catégories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    // Vérifier le token avant de faire la requête
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Vous devez être connecté pour accéder aux catégories.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/category/get-all', {
        headers: {
          'Authorization': 'Bearer ' + token.trim()
        }
      });
      console.log('✅ Réponse API catégories:', response.data);
      const categoriesList = response.data.categories || response.data || [];
      setCategories(categoriesList);
      setFilteredCategories(categoriesList);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des catégories:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Headers de la requête:', error.config?.headers);
      console.error('❌ Réponse du serveur:', error.response?.data);
      
      // Si c'est une erreur 401, l'intercepteur gère déjà la redirection
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(error.response?.data?.message || 'Erreur lors du chargement des catégories');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Créer une catégorie
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/category/store', {
        name: formData.name,
        description: formData.description,
      });
      
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      await fetchCategories(); // Rafraîchir la liste
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      setError(error.response?.data?.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le modal d'édition
  const handleEditClick = (category: CategoryType) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, description: category.description });
    setShowEditModal(true);
  };

  // Modifier une catégorie
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.put(`/category/update/${selectedCategory.id}`, {
        name: formData.name,
        description: formData.description,
      });
      
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '' });
      await fetchCategories(); // Rafraîchir la liste
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      setError(error.response?.data?.message || 'Erreur lors de la modification de la catégorie');
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le modal de suppression
  const handleDeleteClick = (category: CategoryType) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  // Supprimer une catégorie
  const handleDelete = async () => {
    if (!selectedCategory) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.delete(`/category/delete/${selectedCategory.id}`);
      
      setShowDeleteModal(false);
      setSelectedCategory(null);
      await fetchCategories(); // Rafraîchir la liste
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setError(error.response?.data?.message || 'Erreur lors de la suppression de la catégorie');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('sport')) return '⚽';
    if (name.includes('clothing') || name.includes('habillement') || name.includes('vêtement')) return '👕';
    if (name.includes('jewelry') || name.includes('bijoux')) return '💍';
    if (name.includes('food') || name.includes('nourriture')) return '🍽️';
    if (name.includes('tech') || name.includes('technologie') || name.includes('électronique')) return '💻';
    if (name.includes('book') || name.includes('livre')) return '📚';
    if (name.includes('beauty') || name.includes('beauté')) return '💄';
    if (name.includes('home') || name.includes('maison')) return '🏠';
    return '📂';
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Catégories</h1>
        <button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setShowCreateModal(true);
          }}
          className="bg-[#3A905B] text-white px-4 py-2 rounded-lg hover:bg-[#327C4E] transition flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nouvelle catégorie</span>
        </button>
      </div>

      {error && !showCreateModal && !showEditModal && !showDeleteModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Chargement des catégories...</span>
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
                          onClick={() => handleEditClick(category)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors p-2"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
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

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouvelle catégorie</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ex: Vêtements"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Description de la catégorie"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '' });
                    setError(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#3A905B] text-white rounded-lg hover:bg-[#327C4E] disabled:opacity-50"
                >
                  {submitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier la catégorie</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCategory(null);
                    setFormData({ name: '', description: '' });
                    setError(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#3A905B] text-white rounded-lg hover:bg-[#327C4E] disabled:opacity-50"
                >
                  {submitting ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Supprimer la catégorie</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <p className="mb-4">
              Êtes-vous sûr de vouloir supprimer la catégorie <strong>"{selectedCategory.name}"</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCategory(null);
                  setError(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
