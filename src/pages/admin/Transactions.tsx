// src/pages/admin/Transactions.tsx
import React, { useState } from 'react';

type Operateur = 'm-pesa' | 'orange' | 'airtel' | 'africel' | 'visa';
type Statut = 'réussi' | 'échoué' | 'en attente';

type Transaction = {
  id: number;
  nom: string;
  operateur: Operateur;
  montant: number;
  statut: Statut;
  date: string;
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      nom: 'Rossylain Pambu',
      operateur: 'm-pesa',
      montant: 100,
      statut: 'réussi',
      date: '2025-05-10',
    },
    {
      id: 2,
      nom: 'Client X',
      operateur: 'visa',
      montant: 80,
      statut: 'en attente',
      date: '2025-05-09',
    },
  ]);

  const [nouvelleTransaction, setNouvelleTransaction] = useState<Omit<Transaction, 'id'>>({
    nom: '',
    operateur: 'm-pesa',
    montant: 0,
    statut: 'en attente',
    date: new Date().toISOString().split('T')[0],
  });

  const ajouterTransaction = () => {
    const nouvelle = {
      ...nouvelleTransaction,
      id: transactions.length + 1,
    };
    setTransactions([nouvelle, ...transactions]);
    setNouvelleTransaction({
      nom: '',
      operateur: 'm-pesa',
      montant: 0,
      statut: 'en attente',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">💳 Gestion des Transactions</h1>

      {/* Formulaire d'ajout */}
      <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Nom"
            value={nouvelleTransaction.nom}
            onChange={(e) => setNouvelleTransaction({ ...nouvelleTransaction, nom: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <select
            value={nouvelleTransaction.operateur}
            onChange={(e) =>
              setNouvelleTransaction({ ...nouvelleTransaction, operateur: e.target.value as Operateur })
            }
            className="border px-4 py-2 rounded-md w-full"
          >
            <option value="m-pesa">M-Pesa</option>
            <option value="orange">Orange</option>
            <option value="airtel">Airtel</option>
            <option value="africel">Africel</option>
            <option value="visa">Carte Visa</option>
          </select>
          <input
            type="number"
            placeholder="Montant"
            value={nouvelleTransaction.montant}
            onChange={(e) =>
              setNouvelleTransaction({ ...nouvelleTransaction, montant: Number(e.target.value) })
            }
            className="border px-4 py-2 rounded-md w-full"
          />
          <select
            value={nouvelleTransaction.statut}
            onChange={(e) =>
              setNouvelleTransaction({ ...nouvelleTransaction, statut: e.target.value as Statut })
            }
            className="border px-4 py-2 rounded-md w-full"
          >
            <option value="réussi">Réussi</option>
            <option value="échoué">Échoué</option>
            <option value="en attente">En attente</option>
          </select>
          <button
            onClick={ajouterTransaction}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Ajouter
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Nom</th>
              <th className="p-4">Opérateur</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-4">{t.id}</td>
                <td className="p-4">{t.nom}</td>
                <td className="p-4 capitalize">{t.operateur}</td>
                <td className="p-4">{t.montant} $</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      t.statut === 'réussi'
                        ? 'bg-green-100 text-green-700'
                        : t.statut === 'échoué'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {t.statut}
                  </span>
                </td>
                <td className="p-4">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
