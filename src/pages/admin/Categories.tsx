import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Tags, FolderOpen, CheckCircle, Clock, Search, X, Plus, Edit3, Trash2, AlertCircle, Hash, Calendar, FileText } from 'lucide-react';

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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Tags className="w-6 h-6 text-emerald-600" />
            </div>
            Gestion des Catégories
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-14">Organiser et gérer les catégories de produits</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all duration-200 font-medium text-sm shadow-sm shadow-emerald-600/20 hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </button>
      </div>

      {error && !showCreateModal && !showEditModal && !showDeleteModal && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-emerald-200 border-t-emerald-600"></div>
          <span className="mt-4 text-gray-500 font-medium">Chargement des catégories...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tags className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Catégories</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredCategories.length}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Catégories Actives</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredCategories.length}</p>
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
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Dernière Mise à jour</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {categories.length > 0 ? formatDate(categories[0].updatedAt) : 'N/A'}
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
                placeholder="Rechercher par nom ou description..."
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
                {filteredCategories.length} catégorie(s) trouvée(s)
              </div>
            )}
          </div>

          {/* Liste des catégories */}
          <div className="space-y-4">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-13 h-13 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                          {getCategoryIcon(category.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-800 capitalize">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {category.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                              <Hash className="w-3 h-3" />
                              {category.id}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />
                              Créé le {formatDate(category.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              Modifié le {formatDate(category.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                        <button
                          onClick={() => handleEditClick(category)}
                          className="p-2.5 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                          title="Modifier"
                        >
                          <Edit3 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700">Aucune catégorie trouvée</h3>
                <p className="mt-1 text-sm text-gray-400 max-w-sm mx-auto">
                  {searchTerm ? `Aucune catégorie ne correspond à "${searchTerm}"` : 'Aucune catégorie disponible'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Nouvelle catégorie</h2>
            </div>
            <div className="p-6">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              <form onSubmit={handleCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-1.5 block">
                      Nom de la catégorie
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="Ex: Vêtements"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-1.5 block">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                      placeholder="Description de la catégorie"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', description: '' });
                      setError(null);
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {submitting ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Edit3 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Modifier la catégorie</h2>
            </div>
            <div className="p-6">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              <form onSubmit={handleUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-1.5 block">
                      Nom de la catégorie
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 mb-1.5 block">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCategory(null);
                      setFormData({ name: '', description: '' });
                      setError(null);
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit3 className="w-4 h-4" />
                    {submitting ? 'Modification...' : 'Modifier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="p-2 bg-red-50 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Supprimer la catégorie</h2>
            </div>
            <div className="p-6">
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              <div className="flex items-start gap-3 bg-red-50/50 border border-red-100 rounded-xl p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer la catégorie <strong className="text-gray-900">"{selectedCategory.name}"</strong> ?
                  Cette action est irréversible.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCategory(null);
                    setError(null);
                  }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {submitting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
