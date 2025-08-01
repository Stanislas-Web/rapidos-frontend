// src/layouts/DashboardLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/rapidos.jpeg';

const links = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Clients', path: '/clients' },
  { name: 'Transactions', path: '/transactions' },
  { name: 'Livreurs', path: '/livreurs' },
  { name: 'Vendeurs', path: '/vendeurs' },
  { name: 'Produits', path: '/produits' },
  { name: 'Commandes', path: '/commandes' },
  { name: 'Catégories', path: '/categories' },
];

const DashboardLayout = () => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // ✅ cohérence avec useAuth
    window.location.href = '/login'; // ✅ évite clignotement
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white shadow-md p-4 flex flex-col justify-between fixed left-0 top-0 z-50">
        <div>
          {/* Logo */}
          <div className="mb-6">
            <img
              src={logo}
              alt="Logo Rapidos"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-2 px-4 rounded ${
                  location.pathname === link.path
                    ? 'bg-[#EBCD77] text-black font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="mt-6 bg-[#3A905B] text-white py-2 px-4 rounded hover:bg-[#327C4E] transition"
        >
          Déconnexion
        </button>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-6 bg-gray-50 min-h-screen ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
