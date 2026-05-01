// src/layouts/DashboardLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/rapidons-new.png';
import {
  LayoutDashboard, Users, CreditCard, Truck, Store,
  Package, ShoppingCart, Tags, LogOut, Zap, UserCog, PackageSearch
} from 'lucide-react';

const links = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', path: '/clients', icon: Users },
  { name: 'Transactions', path: '/transactions', icon: CreditCard },
  { name: 'Livreurs', path: '/livreurs', icon: Truck },
  { name: 'Vendeurs', path: '/vendeurs', icon: Store },
  { name: 'Produits', path: '/produits', icon: Package },
  { name: 'Commandes', path: '/commandes', icon: ShoppingCart },
  { name: 'Commande Express', path: '/commande-express', icon: Zap },
  { name: 'Catégories', path: '/categories', icon: Tags },
  { name: 'Utilisateurs', path: '/utilisateurs', icon: UserCog },
  { name: 'Frais de livraison', path: '/frais-livraison', icon: PackageSearch },
];

const DashboardLayout = () => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-[270px] h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-100 flex justify-center flex-shrink-0">
          <img
            src={logo}
            alt="Logo Rapidos"
            className="h-28 w-auto object-contain"
          />
        </div>

        {/* Navigation avec scroll */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#3A905B] text-white shadow-md shadow-emerald-200/50'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 pb-6 flex-shrink-0 border-t border-gray-100 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2.5 px-4 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm font-medium border border-gray-100 hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 bg-gray-50/80 min-h-screen ml-[270px] overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
