import React, { useState, useEffect } from 'react';

type CommandeType = {
  id: number;
  vendeur_id: number;
  produit: string;
  quantité: number;
  prix: number;
  date: string;
};

const Commandes = () => {
  const [commandes, setCommandes] = useState<CommandeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 🔁 Simuler un chargement de commandes fictives
    setLoading(true);
    setTimeout(() => {
      setCommandes([
        {
          id: 1,
          vendeur_id: 101,
          produit: 'Poulet grillé',
          quantité: 2,
          prix: 25000,
          date: '2025-06-25',
        },
        {
          id: 2,
          vendeur_id: 102,
          produit: 'Sandwich Royal',
          quantité: 1,
          prix: 8000,
          date: '2025-06-24',
        },
        {
          id: 3,
          vendeur_id: 103,
          produit: 'Jus naturel',
          quantité: 3,
          prix: 9000,
          date: '2025-06-23',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📦 Liste des Commandes</h1>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Recharger
        </button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow-md">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Vendeur ID</th>
                <th className="p-4">Produit</th>
                <th className="p-4">Quantité</th>
                <th className="p-4">Prix (FC)</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {commandes.map((cmd) => (
                <tr key={cmd.id} className="border-t">
                  <td className="p-4">{cmd.id}</td>
                  <td className="p-4">{cmd.vendeur_id}</td>
                  <td className="p-4">{cmd.produit}</td>
                  <td className="p-4">{cmd.quantité}</td>
                  <td className="p-4">{cmd.prix.toLocaleString()} FC</td>
                  <td className="p-4">{cmd.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Commandes;
