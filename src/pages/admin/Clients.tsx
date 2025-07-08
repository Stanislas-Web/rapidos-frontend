import React, { useState } from 'react';

type ClientType = {
  id: number;
  nom: string;
  email: string;
  téléphone: string;
  ville: string;
  message?: string;
  réponse?: string;
};

const Clients = () => {
  const [clients, setClients] = useState<ClientType[]>([
    {
      id: 1,
      nom: 'Kabasele Linda',
      email: 'kabasele.linda@email.com',
      téléphone: '+243 820 123 456',
      ville: 'Kinshasa',
      message: 'Bonjour, j’ai un souci avec ma commande.',
      réponse: 'Merci, nous allons vérifier cela rapidement.',
    },
  ]);

  const [nouveauClient, setNouveauClient] = useState<Omit<ClientType, 'id'>>({
    nom: '',
    email: '',
    téléphone: '',
    ville: '',
  });

  const ajouterClient = () => {
    const nouveau = {
      ...nouveauClient,
      id: clients.length + 1,
      message: '',
      réponse: '',
    };
    setClients([nouveau, ...clients]);
    setNouveauClient({ nom: '', email: '', téléphone: '', ville: '' });
  };

  const mettreAJourRéponse = (id: number, réponse: string) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, réponse } : client
      )
    );
  };

  const envoyerRéponse = (id: number) => {
    const client = clients.find((c) => c.id === id);
    if (client?.réponse) {
      console.log(`Réponse envoyée à ${client.nom} :`, client.réponse);
      alert(`Réponse envoyée à ${client.nom} ! ✅`);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">👥 Gestion des Clients & Messages</h1>

      {/* Formulaire d'ajout */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Nom"
            value={nouveauClient.nom}
            onChange={(e) => setNouveauClient({ ...nouveauClient, nom: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <input
            type="email"
            placeholder="Email"
            value={nouveauClient.email}
            onChange={(e) => setNouveauClient({ ...nouveauClient, email: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <input
            type="text"
            placeholder="Téléphone"
            value={nouveauClient.téléphone}
            onChange={(e) => setNouveauClient({ ...nouveauClient, téléphone: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <input
            type="text"
            placeholder="Ville"
            value={nouveauClient.ville}
            onChange={(e) => setNouveauClient({ ...nouveauClient, ville: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <button
            onClick={ajouterClient}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            ➕ Ajouter
          </button>
        </div>
      </div>

      {/* Liste des clients avec messagerie */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Ville</th>
              <th className="p-3">Message du client</th>
              <th className="p-3">Réponse admin</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t align-top">
                <td className="p-3">{c.id}</td>
                <td className="p-3">{c.nom}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.téléphone}</td>
                <td className="p-3">{c.ville}</td>
                <td className="p-3 max-w-xs whitespace-pre-line">
                  {c.message || <em className="text-gray-400">Aucun message</em>}
                </td>
                <td className="p-3">
                  <textarea
                    value={c.réponse || ''}
                    onChange={(e) => mettreAJourRéponse(c.id, e.target.value)}
                    placeholder="Répondre ici..."
                    className="w-full border p-2 rounded-md"
                    rows={2}
                  />
                </td>
                <td className="p-3">
                  <button
                    onClick={() => envoyerRéponse(c.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Envoyer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;
