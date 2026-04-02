// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/admin/Dashboard';
import Clients from './pages/admin/Clients';
import Transactions from './pages/admin/Transactions';
import Livreurs from './pages/admin/Livreurs';
import Vendeurs from './pages/admin/Vendeurs';
import Produits from './pages/admin/Produits';
import Commandes from './pages/admin/Commandes';
import Categories from './pages/admin/Categories';
import CommandeExpress from './pages/admin/CommandeExpress';
import Utilisateurs from './pages/admin/Utilisateurs';
import FraisLivraison from './pages/admin/FraisLivraison';
import Login from './pages/admin/login';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="livreurs" element={<Livreurs />} />
        <Route path="vendeurs" element={<Vendeurs />} />
        <Route path="produits" element={<Produits />} />
        <Route path="commandes" element={<Commandes />} />
        <Route path="commande-express" element={<CommandeExpress />} />
        <Route path="categories" element={<Categories />} />
        <Route path="utilisateurs" element={<Utilisateurs />} />
        <Route path="frais-livraison" element={<FraisLivraison />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
