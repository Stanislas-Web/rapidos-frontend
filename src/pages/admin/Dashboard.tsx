import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { collection, onSnapshot, orderBy, limit, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import api from '../../utils/api';
import StartCard from '../../components/admin/StartCard';
import {
  Users, CreditCard, Package, Truck, Store,
  TrendingUp, ShoppingCart, Calendar, ArrowUpRight
} from 'lucide-react';

type CartType = {
  id?: string;
  client: string;
  idClient: string;
  phone: string;
  adresse: string;
  avenue: string;
  quartier: string;
  commune: string;
  ville: string;
  pays: string;
  numero: string;
  latitude: number;
  longitude: number;
  items: any[];
  total: number;
  status: string;
  timestamp: Date;
};

type StatusType = {
  id: string;
  role: string;
  status: boolean;
  lastUpdated: Date;
  [key: string]: any;
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
  products: any[];
  media: any;
};

const Dashboard = () => {
  const [recentOrders, setRecentOrders] = useState<CartType[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    clients: '0',
    transactions: '3,200',
    produits: '5,410',
    livreurs: '42',
    vendeurs: '35',
  });

  const [weeklySalesData, setWeeklySalesData] = useState<Array<{ week: string; commandes: number; montant: number }>>([]);



  const [vendorOrdersData, setVendorOrdersData] = useState<Array<{ vendeur: string; commandes: number; montant: number }>>([]);

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF'
    }).format(price);
  };

  // Fonction pour formater les nombres avec virgules
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'en route pour livraison':
        return 'text-blue-600 bg-blue-100';
      case 'prêt à expédier':
        return 'text-indigo-600 bg-indigo-100';
      case 'colis en cours de préparation':
        return 'text-orange-600 bg-orange-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'En attente';
      case 'delivered':
        return 'Livré';
      case 'cancelled':
        return 'Annulé';
      case 'en route pour livraison':
        return 'En route';
      case 'prêt à expédier':
        return 'Prêt';
      case 'colis en cours de préparation':
        return 'En préparation';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const COLORS = ['#08120C', '#3A905B', '#EBCD77'];

  // Fonction pour calculer les données hebdomadaires
  const calculateWeeklyData = (orders: CartType[]) => {
    const weeklyData = new Map<string, { commandes: number; montant: number }>();
    
    // Obtenir la date d'il y a 8 semaines
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 semaines * 7 jours
    
    // Filtrer les commandes des 8 dernières semaines
    const recentOrders = orders.filter(order => 
      order.timestamp >= eightWeeksAgo
    );
    
    // Grouper par semaine
    recentOrders.forEach(order => {
      const orderDate = new Date(order.timestamp);
      const weekStart = new Date(orderDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Début de semaine (dimanche)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { commandes: 0, montant: 0 });
      }
      
      const weekData = weeklyData.get(weekKey)!;
      weekData.commandes += 1;
      weekData.montant += order.total;
    });
    
    // Convertir en tableau et formater
    const formattedData = Array.from(weeklyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, data]) => {
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
        
        return {
          week: weekLabel,
          commandes: data.commandes,
          montant: data.montant
        };
      });
    
    return formattedData;
  };

  // Récupérer les commandes récentes depuis Firestore
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        setLoading(true);
        
        // Créer une requête pour récupérer les 6 commandes les plus récentes
        const q = query(
          collection(db, 'carts'),
          orderBy('timestamp', 'desc'),
          limit(6)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          })) as CartType[];
          
          setRecentOrders(data);
          setLoading(false);
        }, (error) => {
          console.error('Erreur lors du chargement des commandes récentes:', error);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, []);

  // Fonction pour calculer les données par vendeur
  const calculateVendorData = (orders: CartType[]) => {
    const vendorData = new Map<string, { commandes: number; montant: number }>();
    
    orders.forEach(order => {
      // Extraire les informations du vendeur depuis les items
      order.items.forEach(item => {
        const vendeurId = item.idVendeur;
        
        if (!vendorData.has(vendeurId)) {
          vendorData.set(vendeurId, { commandes: 0, montant: 0 });
        }
        
        const vendor = vendorData.get(vendeurId)!;
        vendor.commandes += item.quantity;
        vendor.montant += (item.price * item.quantity);
      });
    });
    
    // Convertir en tableau et trier par montant décroissant
    const formattedData = Array.from(vendorData.entries())
      .map(([vendeurId, data]) => ({
        vendeur: `Vendeur ${vendeurId}`,
        commandes: data.commandes,
        montant: data.montant
      }))
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 8); // Top 8 vendeurs
    
    return formattedData;
  };

  const [productsCount, setProductsCount] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [livreursCount, setLivreursCount] = useState(0);
  const [livreursLoading, setLivreursLoading] = useState(true);
  const [vendeursCount, setVendeursCount] = useState(0);
  const [vendeursLoading, setVendeursLoading] = useState(true);

  // Fonction pour récupérer le nombre de produits depuis l'API
  const fetchProductsCount = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get('/vendeurs');
      console.log('Réponse API produits:', response.data);
      const vendeursData = response.data.vendeurWITHProduct || [];
      
      // Compter tous les produits uniques de tous les vendeurs
      const totalProducts = vendeursData.reduce((total: number, vendeurData: any) => {
        return total + (vendeurData.products?.length || 0);
      }, 0);
      
      console.log('Nombre total de produits:', totalProducts);
      setProductsCount(totalProducts);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setProductsCount(0);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fonction pour récupérer le nombre de livreurs depuis Firestore
  const fetchLivreursCount = async () => {
    try {
      setLivreursLoading(true);
      
      // Écouter les changements en temps réel de la collection "status"
      const unsubscribe = onSnapshot(collection(db, 'status'), (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
        })) as StatusType[];
        
        // Compter les livreurs (utilisateurs avec rôle "livreur" ou actifs)
        const totalLivreurs = data.filter(user => 
          user.role === 'livreur' || 
          user.role === 'Livreur' ||
          (user.status === true && user.role !== 'vendeur')
        ).length;
        
        console.log('Nombre total de livreurs:', totalLivreurs);
        setLivreursCount(totalLivreurs);
      }, (error) => {
        console.error('Erreur lors du chargement des livreurs:', error);
        setLivreursCount(0);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
      setLivreursCount(0);
    } finally {
      setLivreursLoading(false);
    }
  };

  // Fonction pour récupérer le nombre de vendeurs depuis l'API
  const fetchVendeursCount = async () => {
    try {
      setVendeursLoading(true);
      const response = await api.get('/vendeurs');
      console.log('Réponse API vendeurs:', response.data);
      const vendeursData = response.data.vendeurWITHProduct || [];
      
      // Compter tous les vendeurs (même logique que Vendeurs.tsx - filteredVendeurs.length)
      const totalVendeurs = vendeursData.length;
      
      console.log('Nombre total de vendeurs:', totalVendeurs);
      setVendeursCount(totalVendeurs);
    } catch (error) {
      console.error('Erreur lors du chargement des vendeurs:', error);
      setVendeursCount(0);
    } finally {
      setVendeursLoading(false);
    }
  };

  // Fonction pour calculer les statistiques globales
  const calculateGlobalStats = (orders: CartType[]) => {
    // Calculer le nombre de clients uniques
    const uniqueClients = new Set(orders.map(order => order.idClient));
    const totalClients = uniqueClients.size;
    
    // Calculer le nombre total de transactions
    const totalTransactions = orders.length;
    
    // Le nombre de vendeurs est maintenant récupéré depuis l'API
    // Pas besoin de le calculer ici
    
    // Le nombre de livreurs est maintenant récupéré depuis Firestore
    // Pas besoin de le calculer ici
    
    return {
      clients: formatNumber(totalClients),
      transactions: formatNumber(totalTransactions),
      produits: formatNumber(productsCount),
      livreurs: formatNumber(livreursCount),
      vendeurs: formatNumber(vendeursCount),
    };
  };

  // Récupérer toutes les commandes pour les statistiques hebdomadaires et par vendeur
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const q = query(
          collection(db, 'carts'),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          })) as CartType[];
          
          const weeklyData = calculateWeeklyData(data);
          const vendorData = calculateVendorData(data);
          const globalStats = calculateGlobalStats(data);
          
          setWeeklySalesData(weeklyData);
          setVendorOrdersData(vendorData);
          setStats(globalStats);
        }, (error) => {
          console.error('Erreur lors du chargement des données:', error);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      }
    };

    fetchAllOrders();
    fetchProductsCount(); // Récupérer le nombre de produits
    fetchLivreursCount(); // Récupérer le nombre de livreurs
    fetchVendeursCount(); // Récupérer le nombre de vendeurs
  }, []);

  // Mettre à jour les stats quand productsCount change
  useEffect(() => {
    if (productsLoading || productsCount === 0) {
      setStats(prevStats => ({
        ...prevStats,
        produits: '...'
      }));
    } else if (productsCount > 0) {
      setStats(prevStats => ({
        ...prevStats,
        produits: formatNumber(productsCount)
      }));
    }
  }, [productsCount, productsLoading]);

  // Mettre à jour les stats quand livreursCount change
  useEffect(() => {
    if (livreursCount > 0) {
      setStats(prevStats => ({
        ...prevStats,
        livreurs: formatNumber(livreursCount)
      }));
    } else if (!livreursLoading) {
      // Si pas de livreurs et pas en chargement, afficher 0
      setStats(prevStats => ({
        ...prevStats,
        livreurs: '0'
      }));
    }
  }, [livreursCount, livreursLoading]);

  // Mettre à jour les stats quand vendeursCount change
  useEffect(() => {
    if (vendeursLoading || vendeursCount === 0) {
      setStats(prevStats => ({
        ...prevStats,
        vendeurs: '...'
      }));
    } else if (vendeursCount > 0) {
      setStats(prevStats => ({
        ...prevStats,
        vendeurs: formatNumber(vendeursCount)
      }));
    }
  }, [vendeursCount, vendeursLoading]);

  return (
    <div className="min-h-screen bg-gray-50/80 pb-16">
      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2d7a4a] via-[#3A905B] to-[#4aa96c] text-white py-10 md:py-14 px-6 md:px-8 rounded-b-[2rem] shadow-xl mb-10 animate-fade-in-down">
        {/* Éléments décoratifs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-[#EBCD77]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                Tableau de bord
              </h1>
              <p className="text-white/70 text-sm md:text-base">
                Suivez vos statistiques et performances en temps réel
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
              <Calendar className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/90 font-medium">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="max-w-7xl mx-auto px-6 -mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <StartCard title="Total Clients" value={stats.clients} icon={<Users className="w-7 h-7" />} color="bg-gradient-to-br from-[#EBCD77] to-[#d4b55a] animate-fade-in-up" />
          <StartCard title="Transactions" value={stats.transactions} icon={<CreditCard className="w-7 h-7" />} color="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] animate-fade-in-up" />
          <StartCard title="Produits" value={stats.produits} icon={<Package className="w-7 h-7" />} color="bg-gradient-to-br from-[#3A905B] to-[#2d7a4a] animate-fade-in-up" />
          <StartCard title="Livreurs" value={stats.livreurs} icon={<Truck className="w-7 h-7" />} color="bg-gradient-to-br from-[#6b7280] to-[#4b5563] animate-fade-in-up" />
          <StartCard title="Vendeurs" value={stats.vendeurs} icon={<Store className="w-7 h-7" />} color="bg-gradient-to-br from-[#A65E2E] to-[#8B4513] animate-fade-in-up" />
        </div>
      </div>

      {/* Graphiques */}
      <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ligne - Évolution des ventes */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Évolution des commandes</h2>
                <p className="text-gray-400 text-xs">Tendances hebdomadaires</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#08120C] rounded-full"></span>
                <span className="text-[11px] text-gray-500">Commandes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#3A905B] rounded-full"></span>
                <span className="text-[11px] text-gray-500">Montant</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklySalesData}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'commandes' ? `${value} commandes` : formatPrice(value),
                  name === 'commandes' ? 'Commandes' : 'Montant'
                ]}
                labelFormatter={(label) => `Semaine: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="commandes" 
                stroke="#08120C" 
                strokeWidth={3} 
                name="Commandes"
                dot={{ fill: '#08120C', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#08120C', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="montant" 
                stroke="#3A905B" 
                strokeWidth={3} 
                name="Montant"
                dot={{ fill: '#3A905B', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3A905B', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Barres - Commandes par vendeur */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Commandes par vendeur</h2>
                <p className="text-gray-400 text-xs">Top 8 des vendeurs</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#3A905B] rounded-full"></span>
                <span className="text-[11px] text-gray-500">Commandes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#08120C] rounded-full"></span>
                <span className="text-[11px] text-gray-500">Montant</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorOrdersData}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis 
                dataKey="vendeur" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'commandes' ? `${value} commandes` : formatPrice(value),
                  name === 'commandes' ? 'Commandes' : 'Montant'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="commandes" 
                fill="#3A905B" 
                radius={[4, 4, 0, 0]} 
                name="Commandes"
                maxBarSize={50}
              />
              <Bar 
                dataKey="montant" 
                fill="#08120C" 
                radius={[4, 4, 0, 0]} 
                name="Montant"
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table - Commandes récentes */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
          {/* En-tête du tableau */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Commandes récentes</h2>
                <p className="text-gray-400 text-xs">Les 6 dernières commandes</p>
              </div>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg font-medium">
              {recentOrders.length} commande{recentOrders.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-200 border-t-emerald-600"></div>
                        <span className="text-sm">Chargement des commandes...</span>
                      </div>
                    </td>
                  </tr>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono font-medium">
                        #{order.id?.slice(-6)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">{order.client}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{order.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-emerald-600">
                          {formatPrice(order.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                      Aucune commande récente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
