import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import {
  Truck, Users, UserCheck, UserX, Search, X,
  Clock, Calendar, Shield, Edit3, Trash2, Power,
  AlertCircle, ToggleLeft, ToggleRight, Download, MapPin, Loader2, Save
} from 'lucide-react';

type StatusType = {
  id?: string;
  userId: string;
  userName: string;
  role: string;
  status: boolean;
  createdAt: Date;
  lastUpdated: Date;
  // Données enrichies depuis l'API
  phone?: string;
  email?: string;
  communes?: string[];
};

const Livreurs = () => {
  const [statusData, setStatusData] = useState<StatusType[]>([]);
  const [filteredData, setFilteredData] = useState<StatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [firebaseData, setFirebaseData] = useState<any[]>([]);
  const [apiLivreurs, setApiLivreurs] = useState<any[]>([]);

  // Modal communes
  const [showCommunesModal, setShowCommunesModal] = useState(false);
  const [modalLivreur, setModalLivreur] = useState<StatusType | null>(null);
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([]);
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [savingCommunes, setSavingCommunes] = useState(false);

  // Chargement Firebase en temps réel
  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        setLoading(true);
        setError(null);

        const unsubscribe = onSnapshot(collection(db, 'status'), (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
          }));

          setFirebaseData(data);
          setLoading(false);
        }, (error) => {
          console.error('Erreur lors de l\'écoute des changements:', error);
          setError('Erreur lors du chargement des données');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchStatusData();
  }, []);

  // Chargement API livreurs
  const fetchApiLivreurs = async () => {
    try {
      const response = await api.get('/admin/livreurs');
      if (response.data?.data) {
        setApiLivreurs(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs API:', error);
    }
  };

  useEffect(() => {
    fetchApiLivreurs();
  }, []);

  // Fusion Firebase + API via userId comme clé commune
  useEffect(() => {
    if (firebaseData.length > 0 && apiLivreurs.length > 0) {
      console.log('[DEBUG] Firebase userIds:', firebaseData.map(d => d.userId));
      console.log('[DEBUG] API ids:', apiLivreurs.map(l => l.id));
    }
    const merged = firebaseData
      .filter(item => apiLivreurs.some(l => String(l.id) === String(item.userId)))
      .map(item => {
        const apiMatch = apiLivreurs.find(l => String(l.id) === String(item.userId));
        return {
          ...item,
          ...(apiMatch ? {
            phone: apiMatch.phone,
            email: apiMatch.email,
            communes: apiMatch.communes,
          } : {})
        };
      }) as StatusType[];

    setStatusData(merged);
    setFilteredData(merged);
  }, [firebaseData, apiLivreurs]);

  // Filtrer les données basé sur le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(statusData);
      return;
    }

    const filtered = statusData.filter(item =>
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredData(filtered);
  }, [searchTerm, statusData]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('livreur')) return '🚚';
    if (roleLower.includes('vendeur')) return '👨‍💼';
    if (roleLower.includes('admin')) return '👑';
    if (roleLower.includes('client')) return '👤';
    return '👤';
  };

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const openCommunesModal = async (item: StatusType) => {
    setModalLivreur(item);
    setSelectedCommunes(item.communes || []);
    setShowCommunesModal(true);
    setLoadingCommunes(true);
    try {
      const res = await api.get('/admin/communes');
      const list: any[] = res.data?.communes || [];
      setAvailableCommunes(list.map((c: any) => c.communeName));
    } catch {
      setAvailableCommunes([]);
    } finally {
      setLoadingCommunes(false);
    }
  };

  const toggleCommune = (name: string) => {
    setSelectedCommunes(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleSaveCommunes = async () => {
    if (!modalLivreur) return;
    setSavingCommunes(true);
    try {
      const url = `/admin/livreurs/${modalLivreur.userId}/communes`;
      console.log('[PATCH]', url, { communes: selectedCommunes });
      await api.patch(url, { communes: selectedCommunes });
      // Mettre à jour Firebase status si le PATCH a réussi
      if (modalLivreur.id) {
        await updateDoc(doc(db, 'status', modalLivreur.id), { communes: selectedCommunes });
      }
      // Recharger depuis l'API pour avoir les données à jour
      await fetchApiLivreurs();
      setShowCommunesModal(false);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message || 'Erreur inconnue';
      console.error('[ERREUR PATCH communes]', status, err.response?.data);
      alert(`Erreur ${status || ''}: ${msg}`);
    } finally {
      setSavingCommunes(false);
    }
  };

  const toggleStatus = async (item: StatusType) => {
    if (!item.id) return;

    try {
      const newStatus = !item.status;
      const newUserStatus = newStatus ? 'active' : 'inactive';

      const docRef = doc(db, 'status', item.id);
      await updateDoc(docRef, {
        status: newStatus,
        lastUpdated: new Date()
      });

      await api.patch(`/admin/users/${item.userId}/status`, { userStatus: newUserStatus });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-gray-200 border-t-emerald-600"></div>
        <p className="text-sm text-gray-400 font-medium">Chargement des livreurs...</p>
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
    <>
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Livreurs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez les statuts et les rôles en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                const exportData = filteredData.map(item => ({
                  'User ID': item.userId,
                  'Nom': item.userName,
                  'Téléphone': item.phone || '-',
                  'Email': item.email || '-',
                  'Communes': item.communes?.join(', ') || '-',
                  'Rôle': item.role,
                  'Statut': item.status ? 'Actif' : 'Inactif',
                  'Date de création': item.createdAt ? formatDate(item.createdAt) : '-',
                  'Dernière mise à jour': item.lastUpdated ? formatDate(item.lastUpdated) : '-',
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Livreurs');
                const date = new Date().toISOString().split('T')[0];
                XLSX.writeFile(wb, `livreurs_${date}.xlsx`);
              } catch (error) {
                console.error('Erreur lors de l\'export Excel:', error);
              }
            }}
            disabled={filteredData.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold">
            <Users className="w-4 h-4" />
            {filteredData.length} utilisateur{filteredData.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{filteredData.length}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Livreurs Actifs</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {filteredData.filter(item => item.role === 'livreur' && item.status).length}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-teal-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Actifs</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {filteredData.filter(item => item.status).length}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-red-50 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Inactifs</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {filteredData.filter(item => !item.status).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, ID utilisateur ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 focus:bg-white transition-all duration-200"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="mt-2.5 text-xs text-gray-400 pl-1">
            {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''} pour "<span className="font-semibold text-gray-600">{searchTerm}</span>"
          </p>
        )}
      </div>

      {/* Liste des utilisateurs */}
      <div className="space-y-3">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.status ? 'bg-emerald-50' : 'bg-gray-100'
                    }`}>
                      {item.role.toLowerCase().includes('livreur') ? (
                        <Truck className={`w-5 h-5 ${item.status ? 'text-emerald-600' : 'text-gray-400'}`} />
                      ) : item.role.toLowerCase().includes('vendeur') ? (
                        <Shield className={`w-5 h-5 ${item.status ? 'text-emerald-600' : 'text-gray-400'}`} />
                      ) : (
                        <Users className={`w-5 h-5 ${item.status ? 'text-emerald-600' : 'text-gray-400'}`} />
                      )}
                    </div>

                    {/* Infos */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{item.userName}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(item.status)}`}>
                          {item.status ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-600">
                          {item.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                        ID: {item.userId}
                      </p>
                      {(item.phone || item.email) && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {item.phone && <span>{item.phone}</span>}
                          {item.phone && item.email && <span> · </span>}
                          {item.email && <span>{item.email}</span>}
                        </p>
                      )}
                      {item.communes && item.communes.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {item.communes.map((commune, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-600">
                              {commune}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Créé: {formatDate(item.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Modifié: {formatDate(item.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        item.status
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200'
                      }`}
                      title={item.status ? 'Désactiver' : 'Activer'}
                    >
                      {item.status ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {item.status ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => openCommunesModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 transition-all duration-200"
                      title="Assigner des communes"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Communes
                    </button>
                    <button
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      title="Modifier"
                      onClick={() => console.log('Modifier:', item)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                      title="Supprimer"
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                          console.log('Supprimer:', item);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-gray-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Aucun utilisateur trouvé</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun utilisateur disponible'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {showCommunesModal && modalLivreur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Communes</h3>
                  <p className="text-xs text-gray-400">{modalLivreur.userName}</p>
                </div>
              </div>
              <button onClick={() => setShowCommunesModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {loadingCommunes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            ) : availableCommunes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune commune disponible</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto mb-5 pr-1">
                {availableCommunes.map(name => (
                  <label key={name} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCommunes.includes(name)
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedCommunes.includes(name)}
                      onChange={() => toggleCommune(name)}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-800">{name}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCommunesModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCommunes}
                disabled={savingCommunes || loadingCommunes}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {savingCommunes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Livreurs;
