import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import {
  Package, MapPin, Ruler, Edit3, Trash2, Plus, CheckCircle, XCircle, Save, Loader2
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveType = 'flat' | 'distance' | 'commune';

type DeliveryFeeSettings = {
  activeType: ActiveType;
  flatFee: string | null;
  distanceBaseFee: string | null;
  distancePerKmFee: string | null;
  communeDefaultFee: string | null;
};

type Commune = {
  id: number;
  communeName: string;
  fee: string;
  isActive: boolean;
};

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error';

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

let toastId = 0;

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          t.type === 'success' ? 'bg-[#3A905B]' : 'bg-red-500'
        }`}
      >
        {t.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
        <span>{t.message}</span>
        <button onClick={() => onRemove(t.id)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    ))}
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────

const FraisLivraison = () => {
  // Settings
  const [settings, setSettings] = useState<DeliveryFeeSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Onglet sélectionné
  const [selectedType, setSelectedType] = useState<ActiveType>('flat');

  // Champs du formulaire
  const [flatFee, setFlatFee] = useState('');
  const [distanceBaseFee, setDistanceBaseFee] = useState('');
  const [distancePerKmFee, setDistancePerKmFee] = useState('');
  const [communeDefaultFee, setCommuneDefaultFee] = useState('');

  // Dirty check
  const [isDirty, setIsDirty] = useState(false);

  // Communes
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Modal ajouter/modifier commune
  const [showCommuneModal, setShowCommuneModal] = useState(false);
  const [editingCommune, setEditingCommune] = useState<Commune | null>(null);
  const [communeForm, setCommuneForm] = useState({ communeName: '', fee: '', isActive: true });
  const [savingCommune, setSavingCommune] = useState(false);

  // Modal confirmation suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCommune, setDeletingCommune] = useState<Commune | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Chargement settings ─────────────────────────────────────────────────

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await api.get('/admin/delivery-fee-settings');
      console.log('🔍 RAW delivery-fee-settings response:', res.data);
      // Gère : { activeType } | { data: { activeType } } | { settings: { activeType } }
      const data: DeliveryFeeSettings = res.data?.settings ?? res.data?.data ?? res.data;
      console.log('🔍 Parsed data:', data);
      setSettings(data);
      setSelectedType(data.activeType);
      setFlatFee(data.flatFee ?? '');
      setDistanceBaseFee(data.distanceBaseFee ?? '');
      setDistancePerKmFee(data.distancePerKmFee ?? '');
      setCommuneDefaultFee(data.communeDefaultFee ?? '');
      setIsDirty(false);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Erreur lors du chargement de la configuration');
    } finally {
      setLoadingSettings(false);
    }
  };

  // ─── Chargement communes ──────────────────────────────────────────────────

  const fetchCommunes = async () => {
    setLoadingCommunes(true);
    try {
      const res = await api.get('/admin/communes');
      setCommunes(res.data?.communes || []);
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Erreur lors du chargement des communes');
    } finally {
      setLoadingCommunes(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedType === 'commune') {
      fetchCommunes();
    }
  }, [selectedType]);

  // ─── Dirty check ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!settings) return;
    const changed =
      selectedType !== settings.activeType ||
      flatFee !== (settings.flatFee ?? '') ||
      distanceBaseFee !== (settings.distanceBaseFee ?? '') ||
      distancePerKmFee !== (settings.distancePerKmFee ?? '') ||
      communeDefaultFee !== (settings.communeDefaultFee ?? '');
    setIsDirty(changed);
  }, [selectedType, flatFee, distanceBaseFee, distancePerKmFee, communeDefaultFee, settings]);

  // ─── Enregistrer settings ─────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      let body: Record<string, unknown> = { activeType: selectedType };
      if (selectedType === 'flat') {
        body.flatFee = Number(flatFee);
      } else if (selectedType === 'distance') {
        body.distanceBaseFee = Number(distanceBaseFee);
        body.distancePerKmFee = Number(distancePerKmFee);
      } else if (selectedType === 'commune') {
        body.communeDefaultFee = Number(communeDefaultFee);
      }
      const res = await api.put('/admin/delivery-fee-settings', body);
      addToast('success', res.data?.message || 'Configuration mise à jour avec succès');
      await fetchSettings();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── CRUD Communes ────────────────────────────────────────────────────────

  const openAddCommune = () => {
    setEditingCommune(null);
    setCommuneForm({ communeName: '', fee: '', isActive: true });
    setShowCommuneModal(true);
  };

  const openEditCommune = (commune: Commune) => {
    setEditingCommune(commune);
    setCommuneForm({ communeName: commune.communeName, fee: commune.fee, isActive: commune.isActive });
    setShowCommuneModal(true);
  };

  const handleSaveCommune = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCommune(true);
    try {
      if (editingCommune) {
        await api.put(`/admin/communes/${editingCommune.id}`, {
          fee: Number(communeForm.fee),
          isActive: communeForm.isActive,
        });
        addToast('success', 'Commune modifiée avec succès');
      } else {
        await api.post('/admin/communes', {
          communeName: communeForm.communeName,
          fee: Number(communeForm.fee),
        });
        addToast('success', 'Commune ajoutée avec succès');
      }
      setShowCommuneModal(false);
      await fetchCommunes();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingCommune(false);
    }
  };

  const openDeleteCommune = (commune: Commune) => {
    setDeletingCommune(commune);
    setShowDeleteModal(true);
  };

  const handleDeleteCommune = async () => {
    if (!deletingCommune) return;
    setDeletingLoading(true);
    try {
      await api.delete(`/admin/communes/${deletingCommune.id}`);
      addToast('success', 'Commune supprimée avec succès');
      setShowDeleteModal(false);
      setDeletingCommune(null);
      await fetchCommunes();
    } catch (err: any) {
      addToast('error', err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 min-h-screen bg-gray-50/80">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-[#3A905B]/10 rounded-xl">
            <Package className="w-6 h-6 text-[#3A905B]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Frais de livraison</h1>
        </div>
        <p className="text-sm text-gray-500 ml-[52px]">Configurez le calcul des frais de livraison appliqués aux commandes</p>
      </div>

      {/* Bannière — Mode actuellement actif (depuis l'API) */}
      {!loadingSettings && settings && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Mode de livraison actif (serveur)</p>
          <div className="flex flex-wrap gap-3">
            {/* Forfaitaire */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 flex-1 min-w-[180px] transition-all ${
              settings.activeType === 'flat'
                ? 'border-[#3A905B] bg-[#3A905B]/5'
                : 'border-gray-100 bg-gray-50 opacity-50'
            }`}>
              
              <div>
                <p className={`text-sm font-semibold ${settings.activeType === 'flat' ? 'text-[#3A905B]' : 'text-gray-400'}`}>
                  Forfaitaire
                </p>
                <p className="text-xs text-gray-400">
                  {settings.flatFee ? `${Number(settings.flatFee).toLocaleString('fr-FR')} FC` : '—'}
                </p>
              </div>
              {settings.activeType === 'flat' && (
                <span className="ml-auto text-xs font-bold text-white bg-[#3A905B] px-2 py-0.5 rounded-full">✓ Actif</span>
              )}
            </div>

            {/* Par distance */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 flex-1 min-w-[180px] transition-all ${
              settings.activeType === 'distance'
                ? 'border-[#3A905B] bg-[#3A905B]/5'
                : 'border-gray-100 bg-gray-50 opacity-50'
            }`}>
              
              <div>
                <p className={`text-sm font-semibold ${settings.activeType === 'distance' ? 'text-[#3A905B]' : 'text-gray-400'}`}>
                  Par distance
                </p>
                <p className="text-xs text-gray-400">
                  {settings.distanceBaseFee
                    ? `Base ${Number(settings.distanceBaseFee).toLocaleString('fr-FR')} FC · ${Number(settings.distancePerKmFee).toLocaleString('fr-FR')} FC/km`
                    : '—'}
                </p>
              </div>
              {settings.activeType === 'distance' && (
                <span className="ml-auto text-xs font-bold text-white bg-[#3A905B] px-2 py-0.5 rounded-full">✓ Actif</span>
              )}
            </div>

            {/* Par commune */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 flex-1 min-w-[180px] transition-all ${
              settings.activeType === 'commune'
                ? 'border-[#3A905B] bg-[#3A905B]/5'
                : 'border-gray-100 bg-gray-50 opacity-50'
            }`}>
              
              <div>
                <p className={`text-sm font-semibold ${settings.activeType === 'commune' ? 'text-[#3A905B]' : 'text-gray-400'}`}>
                  Par commune
                </p>
                <p className="text-xs text-gray-400">
                  {settings.communeDefaultFee ? `Défaut ${Number(settings.communeDefaultFee).toLocaleString('fr-FR')} FC` : '—'}
                </p>
              </div>
              {settings.activeType === 'commune' && (
                <span className="ml-auto text-xs font-bold text-white bg-[#3A905B] px-2 py-0.5 rounded-full">✓ Actif</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 1 — Type de calcul */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Modifier la configuration</h2>

        {loadingSettings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#3A905B]" />
            <span className="ml-2 text-sm text-gray-500">Chargement…</span>
          </div>
        ) : (
          <>
            {/* Cartes de sélection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Forfaitaire */}
              <button
                type="button"
                onClick={() => setSelectedType('flat')}
                className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                  selectedType === 'flat'
                    ? 'border-[#3A905B] bg-[#3A905B]/5 shadow-md shadow-emerald-100'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  {selectedType === 'flat' && (
                    <span className="text-xs font-semibold text-[#3A905B] bg-[#3A905B]/10 px-2 py-0.5 rounded-full">Actif</span>
                  )}
                </div>
                <p className="font-semibold text-gray-800 mb-1">Forfaitaire</p>
                <p className="text-xs text-gray-500 mb-4">Un prix unique pour tous</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prix fixe (FC)</label>
                  <input
                    type="number"
                    min="0"
                    value={flatFee}
                    onChange={(e) => setFlatFee(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setSelectedType('flat')}
                    placeholder="Ex: 5000"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A905B]/30 focus:border-[#3A905B] bg-white"
                  />
                </div>
              </button>

              {/* Par distance */}
              <button
                type="button"
                onClick={() => setSelectedType('distance')}
                className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                  selectedType === 'distance'
                    ? 'border-[#3A905B] bg-[#3A905B]/5 shadow-md shadow-emerald-100'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  {selectedType === 'distance' && (
                    <span className="text-xs font-semibold text-[#3A905B] bg-[#3A905B]/10 px-2 py-0.5 rounded-full">Actif</span>
                  )}
                </div>
                <p className="font-semibold text-gray-800 mb-1">Par distance</p>
                <p className="text-xs text-gray-500 mb-4">Base + Distance × Prix/km</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frais de base (FC)</label>
                    <input
                      type="number"
                      min="0"
                      value={distanceBaseFee}
                      onChange={(e) => setDistanceBaseFee(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedType('distance')}
                      placeholder="Ex: 1000"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A905B]/30 focus:border-[#3A905B] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prix par km (FC)</label>
                    <input
                      type="number"
                      min="0"
                      value={distancePerKmFee}
                      onChange={(e) => setDistancePerKmFee(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => setSelectedType('distance')}
                      placeholder="Ex: 1000"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A905B]/30 focus:border-[#3A905B] bg-white"
                    />
                  </div>
                </div>
              </button>

              {/* Par commune */}
              <button
                type="button"
                onClick={() => setSelectedType('commune')}
                className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                  selectedType === 'commune'
                    ? 'border-[#3A905B] bg-[#3A905B]/5 shadow-md shadow-emerald-100'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  
                  {selectedType === 'commune' && (
                    <span className="text-xs font-semibold text-[#3A905B] bg-[#3A905B]/10 px-2 py-0.5 rounded-full">Actif</span>
                  )}
                </div>
                <p className="font-semibold text-gray-800 mb-1">Par commune</p>
                <p className="text-xs text-gray-500 mb-4">Prix selon la zone</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Frais par défaut (FC)</label>
                  <input
                    type="number"
                    min="0"
                    value={communeDefaultFee}
                    onChange={(e) => setCommuneDefaultFee(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setSelectedType('commune')}
                    placeholder="Ex: 10000"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A905B]/30 focus:border-[#3A905B] bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Si commune inconnue</p>
                </div>
              </button>
            </div>

            {/* Bouton Enregistrer */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={!isDirty || savingSettings}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isDirty && !savingSettings
                    ? 'bg-[#3A905B] text-white hover:bg-[#2d7348] shadow-md shadow-emerald-200/50'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </div>
          </>
        )}
      </div>

      {/* Section 2 — Tarifs par commune (visible uniquement si type = commune) */}
      {selectedType === 'commune' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#3A905B]" />
              <h2 className="text-base font-semibold text-gray-700">Tarifs par commune</h2>
            </div>
            <button
              onClick={openAddCommune}
              className="flex items-center gap-2 px-4 py-2 bg-[#3A905B] text-white text-sm font-semibold rounded-xl hover:bg-[#2d7348] transition-all duration-200 shadow-md shadow-emerald-200/50"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          {loadingCommunes ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-[#3A905B]" />
              <span className="ml-2 text-sm text-gray-500">Chargement…</span>
            </div>
          ) : communes.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <Ruler className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Aucune commune configurée
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Commune</th>
                    <th className="px-4 py-3 text-right">Prix (FC)</th>
                    <th className="px-4 py-3 text-center">Actif</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {communes.map((commune) => (
                    <tr key={commune.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{commune.communeName}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-mono">
                        {Number(commune.fee).toLocaleString('fr-FR')} FC
                      </td>
                      <td className="px-4 py-3 text-center">
                        {commune.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditCommune(commune)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteCommune(commune)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Ajouter / Modifier commune */}
      {showCommuneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {editingCommune ? 'Modifier la commune' : 'Ajouter une commune'}
            </h3>
            <form onSubmit={handleSaveCommune} className="space-y-4">
              {!editingCommune && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la commune</label>
                  <input
                    type="text"
                    required
                    value={communeForm.communeName}
                    onChange={(e) => setCommuneForm((f) => ({ ...f, communeName: e.target.value }))}
                    placeholder="Ex: Masina"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3A905B]/30 focus:border-[#3A905B]"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FC)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={communeForm.fee}
                  onChange={(e) => setCommuneForm((f) => ({ ...f, fee: e.target.value }))}
                  placeholder="Ex: 4000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3A905B]/30 focus:border-[#3A905B]"
                />
              </div>
              {editingCommune && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={communeForm.isActive}
                      onChange={(e) => setCommuneForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#3A905B] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                  <span className="text-sm text-gray-700">Commune active</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommuneModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingCommune}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3A905B] text-white rounded-xl text-sm font-semibold hover:bg-[#2d7348] transition-colors disabled:opacity-60"
                >
                  {savingCommune ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {showDeleteModal && deletingCommune && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="p-3 bg-red-50 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">Supprimer la commune ?</h3>
              <p className="text-sm text-gray-500">
                Voulez-vous vraiment supprimer <strong>{deletingCommune.communeName}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletingCommune(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCommune}
                disabled={deletingLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deletingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraisLivraison;
