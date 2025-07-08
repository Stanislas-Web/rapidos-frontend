import React from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import StartCard from '../../components/admin/StartCard';

const Dashboard = () => {
  const stats = {
    clients: '1,250',
    transactions: '3,200',
    produits: '5,410',
    livreurs: '42',
    vendeurs: '35',
  };

  const salesData = [
    { month: 'Jan', ventes: 400 },
    { month: 'Fév', ventes: 600 },
    { month: 'Mar', ventes: 800 },
    { month: 'Avr', ventes: 900 },
    { month: 'Mai', ventes: 1200 },
    { month: 'Juin', ventes: 1500 },
  ];

  const transactionData = [
    { name: 'Mobile Money', value: 45 },
    { name: 'Carte Bancaire', value: 30 },
    { name: 'Espèces', value: 25 },
  ];

  const vendeurParRegion = [
    { region: 'Kinshasa', vendeurs: 12 },
    { region: 'Lubumbashi', vendeurs: 8 },
    { region: 'Goma', vendeurs: 5 },
    { region: 'Bukavu', vendeurs: 4 },
    { region: 'Kisangani', vendeurs: 6 },
  ];

  const commandes = [
    { id: '#CMD001', client: 'Jean K.', montant: '24.000 FC', statut: 'Livré' },
    { id: '#CMD002', client: 'Sarah B.', montant: '17.500 FC', statut: 'En cours' },
    { id: '#CMD003', client: 'Louis T.', montant: '42.300 FC', statut: 'Annulé' },
    { id: '#CMD004', client: 'Anita M.', montant: '13.000 FC', statut: 'Livré' },
    { id: '#CMD005', client: 'Patrick N.', montant: '32.700 FC', statut: 'En cours' },
    { id: '#CMD006', client: 'Esther L.', montant: '21.400 FC', statut: 'Livré' },
  ];

  const COLORS = ['#08120C', '#3A905B', '#EBCD77'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pb-16">
      {/* Bannière */}
      <div className="bg-[#3A905B] text-white text-center py-10 rounded-b-3xl shadow-lg mb-8 animate-fade-in-down">
        <h1 className="text-4xl font-bold mb-2">Bienvenue sur le tableau de bord rapidos</h1>
        <p className="text-md font-light">Suivez les statistiques en temps réel</p>
      </div>

      {/* Statistiques */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StartCard title="Total Clients" value={stats.clients} icon="👥" color="text-white bg-[#EBCD77] animate-fade-in-up" />
        <StartCard title="Transactions" value={stats.transactions} icon="💳" color="text-white bg-[#08120C] animate-fade-in-up" />
        <StartCard title="Produits" value={stats.produits} icon="📦" color="text-white bg-[#3A905B] animate-fade-in-up" />
        <StartCard title="Livreurs" value={stats.livreurs} icon="🚚" color="text-white bg-[#7C7C7C] animate-fade-in-up" />
        <StartCard title="Vendeurs" value={stats.vendeurs} icon="🧑‍💼" color="text-white bg-[#A65E2E] animate-fade-in-up" />
      </div>

      {/* Graphiques */}
      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Ligne - Évolution des ventes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">📈 Évolution des ventes</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ventes" stroke="#08120C" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Camembert - Méthodes de paiement */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">💰 Méthodes de paiement</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={transactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {transactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Barres - Vendeurs par région */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">🧑‍💼 Vendeurs par région</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vendeurParRegion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vendeurs" fill="#3A905B" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table - Commandes récentes */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">📦 Commandes récentes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Client</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Montant</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commandes.map((cmd, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-700">{cmd.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{cmd.client}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{cmd.montant}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{cmd.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
