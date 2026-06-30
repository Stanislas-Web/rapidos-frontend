import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import {
  Users, UserPlus, UserCheck, UserX, Shield,
  Search, X, Eye, AlertCircle, Filter, Download,
  Phone, Mail, Calendar, ChevronLeft, ChevronRight,
  Edit3, Trash2, Ban, CheckCircle, Clock, XCircle,
  Lock, ChevronDown
} from 'lucide-react';

type UserType = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  userStatus: string;
  secureOtp?: number | null;
  otp?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  termsAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
};

type PaginationMeta = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
};

const Utilisateurs = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Modal détails
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Modal création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'acheteur', userStatus: 'active'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '', userStatus: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editUserId, setEditUserId] = useState<number | null>(null);

  // Modal changement de statut
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUserId, setStatusUserId] = useState<number | null>(null);
  const [statusUserName, setStatusUserName] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Modal suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/admin/users?page=${page}&limit=${limit}`;
      if (roleFilter !== 'all') url += `&role=${roleFilter}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      const response = await api.get(url);
      setUsers(response.data?.data || []);
      setMeta(response.data?.meta || null);
    } catch (err: any) {
      console.error('Erreur chargement utilisateurs:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, roleFilter, statusFilter]);

  // Recherche avec debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
      } else {
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatOtp = (user: UserType) => {
    return user.secureOtp ?? user.otp ?? '-';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'superadmin': return 'bg-red-50 text-red-700 border-red-200';
      case 'vendeur': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'acheteur': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'livreur': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'superadmin': return 'Super Admin';
      case 'vendeur': return 'Vendeur';
      case 'acheteur': return 'Acheteur';
      case 'livreur': return 'Livreur';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'banned': return 'bg-red-50 text-red-700 border-red-200';
      case 'suspended': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'deleted': return 'bg-red-100 text-red-800 border-red-300';
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
      case 'deleted': return 'Supprimé';
      default: return status;
    }
  };

  // CRUD: Créer
  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      await api.post('/admin/users', createForm);
      setShowCreateModal(false);
      setCreateForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'acheteur', userStatus: 'active' });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erreur lors de la création');
    } finally {
      setCreateLoading(false);
    }
  };

  // CRUD: Modifier
  const openEditModal = (user: UserType) => {
    setEditUserId(user.id);
    setEditForm({
      firstName: user.firstName, lastName: user.lastName,
      email: user.email, phone: user.phone,
      role: user.role, userStatus: user.userStatus
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editUserId) return;
    setEditLoading(true);
    setEditError('');
    try {
      await api.put(`/admin/users/${editUserId}`, editForm);
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Erreur lors de la modification');
    } finally {
      setEditLoading(false);
    }
  };

  // CRUD: Changer statut
  const openStatusModal = (user: UserType) => {
    setStatusUserId(user.id);
    setStatusUserName(`${user.firstName} ${user.lastName}`);
    setNewStatus(user.userStatus);
    setShowStatusModal(true);
  };

  const handleStatusChange = async () => {
    if (!statusUserId) return;
    setStatusLoading(true);
    try {
      await api.patch(`/admin/users/${statusUserId}/status`, { userStatus: newStatus });
      setShowStatusModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setStatusLoading(false);
    }
  };

  // CRUD: Supprimer
  const openDeleteModal = (user: UserType) => {
    setDeleteUserId(user.id);
    setDeleteUserName(`${user.firstName} ${user.lastName}`);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteUserId}`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openModal = (user: UserType) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const exportToExcel = () => {
    try {
      const exportData = users.map(u => ({
        'ID': u.id,
        'Prénom': u.firstName,
        'Nom': u.lastName,
        'Email': u.email,
        'Téléphone': u.phone,
        'OTP': formatOtp(u),
        'Rôle': getRoleText(u.role),
        'Statut': getStatusText(u.userStatus),
        'Date de création': formatDate(u.createdAt),
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
      XLSX.writeFile(wb, `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erreur export Excel:', error);
    }
  };

  const totalPages = meta ? meta.lastPage : 1;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-14">Gérer tous les comptes utilisateurs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreateError(''); setShowCreateModal(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all duration-200 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
          <button
            onClick={exportToExcel}
            disabled={users.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          {meta && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-200">
              <Users className="w-4 h-4" />
              {meta.total} utilisateur{meta.total > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {loading && !users.length ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-200 border-t-indigo-600"></div>
          <span className="mt-4 text-gray-500 font-medium">Chargement des utilisateurs...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-indigo-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{meta?.total || users.length}</p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-green-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Actifs</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {users.filter(u => u.userStatus === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-yellow-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">En attente</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {users.filter(u => u.userStatus === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-red-50 rounded-full" />
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bannis / Suspendus</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                    {users.filter(u => u.userStatus === 'banned' || u.userStatus === 'suspended').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">Filtres et recherche</h3>
                </div>
                {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Effacer les filtres</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Nom, email, téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Filtre rôle */}
                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 appearance-none"
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="vendeur">Vendeur</option>
                    <option value="acheteur">Acheteur</option>
                    <option value="livreur">Livreur</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Filtre statut */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 appearance-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="pending">En attente</option>
                    <option value="banned">Banni</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">OTP</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-800">{user.firstName} {user.lastName}</div>
                              <div className="text-xs text-gray-400 font-mono">#{user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{user.email}</span>
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {user.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-700">{formatOtp(user)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(user.userStatus)}`}>
                            {getStatusText(user.userStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(user.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openModal(user)} title="Voir" className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEditModal(user)} title="Modifier" className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => openStatusModal(user)} title="Changer statut" className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200">
                              <Shield className="w-4 h-4" />
                            </button>
                            <button onClick={() => openDeleteModal(user)} title="Supprimer" className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200">
                              <Trash2 className="w-4 h-4" />
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
                        <p className="text-sm font-medium text-gray-500">Aucun utilisateur trouvé</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                <p className="text-sm text-gray-500">
                  Page {meta.currentPage} sur {totalPages} ({meta.total} résultats)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Préc.
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Suiv. <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-xs text-gray-400 font-mono">#{selectedUser.id}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Informations personnelles
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Prénom</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.firstName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Nom</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedUser.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedUser.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">OTP</p>
                      <p className="text-sm font-medium text-gray-700">{formatOtp(selectedUser)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Rôle</p>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleColor(selectedUser.role)}`}>
                        {getRoleText(selectedUser.role)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Statut</p>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedUser.userStatus)}`}>
                        {getStatusText(selectedUser.userStatus)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date de création</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Dernière mise à jour</p>
                      <p className="text-sm font-medium text-gray-700">{formatDate(selectedUser.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Fermer</button>
              <button onClick={() => { setShowModal(false); openEditModal(selectedUser); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm">
                <Edit3 className="w-4 h-4" /> Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
          <div className="relative w-11/12 md:w-1/2 lg:w-2/5 bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl"><UserPlus className="w-5 h-5 text-indigo-600" /></div>
                <h3 className="text-lg font-bold text-gray-800">Nouvel utilisateur</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              {createError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {createError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Prénom *</label>
                  <input type="text" value={createForm.firstName} onChange={e => setCreateForm({...createForm, firstName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom *</label>
                  <input type="text" value={createForm.lastName} onChange={e => setCreateForm({...createForm, lastName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Dupont" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Téléphone *</label>
                <input type="text" value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="+243812345678" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Mot de passe *</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="12 chars min, 1 maj, 1 min, 1 chiffre, 1 spécial" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Rôle *</label>
                  <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none">
                    <option value="acheteur">Acheteur</option>
                    <option value="vendeur">Vendeur</option>
                    <option value="livreur">Livreur</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Statut</label>
                  <select value={createForm.userStatus} onChange={e => setCreateForm({...createForm, userStatus: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={createLoading || !createForm.firstName || !createForm.lastName || !createForm.email || !createForm.phone || !createForm.password}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {createLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <UserPlus className="w-4 h-4" />}
                Créer
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
                <h3 className="text-lg font-bold text-gray-800">Modifier l'utilisateur</h3>
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
                    <option value="acheteur">Acheteur</option>
                    <option value="vendeur">Vendeur</option>
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

      {/* Modal Changement de Statut */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative w-11/12 md:w-96 bg-white rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" /> Changer le statut
              </h3>
              <p className="text-sm text-gray-500 mt-1">{statusUserName}</p>
            </div>
            <div className="p-6 space-y-4">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none">
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
                <option value="banned">Banni</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowStatusModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Annuler</button>
              <button onClick={handleStatusChange} disabled={statusLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
                {statusLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <CheckCircle className="w-4 h-4" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative w-11/12 md:w-96 bg-white rounded-2xl shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Supprimer l'utilisateur</h3>
              <p className="text-sm text-gray-500 mt-2">
                Voulez-vous vraiment supprimer <span className="font-semibold text-gray-700">{deleteUserName}</span> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Annuler</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
                {deleteLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilisateurs;
