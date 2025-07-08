// src/pages/admin/Produits.tsx
import React, { useState } from 'react';

type Produit = {
  id: number;
  nom: string;
  catégorie: string;
  prix: number;
  statut: 'En stock' | 'En rupture';
};

const Produits = () => {
  const [produits, setProduits] = useState<Produit[]>([
    {
      id: 1,
      nom: 'Pain',
      catégorie: 'Nourriture',
      prix: 10,
      statut: 'En stock',
    },
  ]);

  const [nouveauProduit, setNouveauProduit] = useState<Omit<Produit, 'id'>>({
    nom: '',
    catégorie: '',
    prix: 0,
    statut: 'En stock',
  });

  const ajouterProduit = () => {
    const nouveau = {
      id: produits.length + 1,
      ...nouveauProduit,
    };
    setProduits([nouveau, ...produits]);
    setNouveauProduit({ nom: '', catégorie: '', prix: 0, statut: 'En stock' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📦 Gestion des Produits</h1>

      {/* Formulaire d'ajout */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Nom du produit"
            value={nouveauProduit.nom}
            onChange={(e) => setNouveauProduit({ ...nouveauProduit, nom: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <input
            type="text"
            placeholder="Catégorie"
            value={nouveauProduit.catégorie}
            onChange={(e) => setNouveauProduit({ ...nouveauProduit, catégorie: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <input
            type="number"
            placeholder="Prix"
            value={nouveauProduit.prix}
            onChange={(e) =>
              setNouveauProduit({ ...nouveauProduit, prix: parseFloat(e.target.value) })
            }
            className="border px-4 py-2 rounded-md w-full"
          />
          <select
            value={nouveauProduit.statut}
            onChange={(e) =>
              setNouveauProduit({ ...nouveauProduit, statut: e.target.value as Produit['statut'] })
            }
            className="border px-4 py-2 rounded-md w-full"
          >
            <option value="En stock">En stock</option>
            <option value="En rupture">En rupture</option>
          </select>
          <button
            onClick={ajouterProduit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Ajouter
          </button>
        </div>
      </div>

      {/* Tableau de produits */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Nom</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Prix ($)</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((produit) => (
              <tr key={produit.id} className="border-t">
                <td className="p-4">{produit.id}</td>
                <td className="p-4">{produit.nom}</td>
                <td className="p-4">{produit.catégorie}</td>
                <td className="p-4">{produit.prix.toFixed(2)}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      produit.statut === 'En stock'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {produit.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Produits;
