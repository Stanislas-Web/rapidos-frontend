import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout'; 

import Dashboard from '../pages/admin/Dashboard';
import Clients from '../pages/admin/Clients';
import Livreurs from '../pages/admin/Livreurs';
import Produits from '../pages/admin/Produits';
import Transactions from '../pages/admin/Transactions';
import Vendeurs from '../pages/admin/Vendeurs';
import Commandes from '../pages/admin/Commandes'; 
import Categories from '../pages/admin/Categories'; // ✅


const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="livreurs" element={<Livreurs />} />
        <Route path="produits" element={<Produits />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="vendeurs" element={<Vendeurs />} />
        <Route path="commandes" element={<Commandes />} /> {/* ✅ Ajouté */}
        <Route path="categories" element={<Categories />} />
 ✅

      </Route>
    </Routes>
  );
};

export default AdminRoutes;
