import React, { useState, useEffect } from 'react';

type VendeurType = {
  id: number;
  nom: string;
  boutique: string;
  téléphone: string;
  ville: string;
};

const Vendeurs = () => {
  const [vendeurs, setVendeurs] = useState<VendeurType[]>([]);
  const [loading, setLoading] = useState(false);

  const [nouveauVendeur, setNouveauVendeur] = useState<Omit<VendeurType, 'id'>>({
    nom: '',
    boutique: '',
    téléphone: '',
    ville: '',
  });

  useEffect(() => {
    // 🧪 Simuler des vendeurs fictifs
    setLoading(true);
    setTimeout(() => {
      setVendeurs([
        {
          id: 1,
          nom: 'Patrick Mukendi',
          boutique: 'Mukendi Shop',
          téléphone: '+243820000001',
          ville: 'Kinshasa',
        },
        {
          id: 2,
          nom: 'Clarisse Ngalula',
          boutique: 'Délices Gourmands',
          téléphone: '+243820000002',
          ville: 'Lubumbashi',
        },
        {
          id: 3,
          nom: 'Jean Kalala',
          boutique: 'Tech Express',
          téléphone: '+243820000003',
          ville: 'Goma',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const ajouterVendeur = () => {
    // Ajout local fictif
    const nouveau = {
      ...nouveauVendeur,
      id: vendeurs.length + 1,
    };
    setVendeurs([...vendeurs, nouveau]);
    setNouveauVendeur({ nom: '', boutique: '', téléphone: '', ville: '' });
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-800">🧑‍💼 Gestion des Vendeurs</h1>

      {loading ? (
        <p className="text-gray-500">Chargement des vendeurs...</p>
      ) : (
        <>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Nom"
                value={nouveauVendeur.nom}
                onChange={(e) => setNouveauVendeur({ ...nouveauVendeur, nom: e.target.value })}
                className="border px-4 py-2 rounded-md w-full"
              />
              <input
                type="text"
                placeholder="Boutique"
                value={nouveauVendeur.boutique}
                onChange={(e) => setNouveauVendeur({ ...nouveauVendeur, boutique: e.target.value })}
                className="border px-4 py-2 rounded-md w-full"
              />
              <input
                type="text"
                placeholder="Téléphone"
                value={nouveauVendeur.téléphone}
                onChange={(e) => setNouveauVendeur({ ...nouveauVendeur, téléphone: e.target.value })}
                className="border px-4 py-2 rounded-md w-full"
              />
              <input
                type="text"
                placeholder="Ville"
                value={nouveauVendeur.ville}
                onChange={(e) => setNouveauVendeur({ ...nouveauVendeur, ville: e.target.value })}
                className="border px-4 py-2 rounded-md w-full"
              />
              <button
                onClick={ajouterVendeur}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                ➕ Ajouter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full bg-white text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">Nom</th>
                  <th className="p-4">Boutique</th>
                  <th className="p-4">Téléphone</th>
                  <th className="p-4">Ville</th>
                </tr>
              </thead>
              <tbody>
                {vendeurs.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">{v.id}</td>
                    <td className="p-4">{v.nom}</td>
                    <td className="p-4">{v.boutique}</td>
                    <td className="p-4">{v.téléphone}</td>
                    <td className="p-4">{v.ville}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Vendeurs;
