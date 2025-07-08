import React, { useState } from 'react';

type LivreursType = {
  id: number;
  nom: string;
  téléphone: string;
  ville: string;
  statut: 'actif' | 'inactif';
};

const Livreurs = () => {
  const [livreurs, setLivreurs] = useState<LivreursType[]>([
    {
      id: 1,
      nom: 'Jean Mavungu',
      téléphone: '+243 970 000 111',
      ville: 'Kinshasa',
      statut: 'actif',
    },
  ]);

  const [nouveauLivreur, setNouveauLivreur] = useState<Omit<LivreursType, 'id'>>({
    nom: '',
    téléphone: '',
    ville: '',
    statut: 'actif',
  });

  const [recherche, setRecherche] = useState('');

  const ajouterLivreur = () => {
    const nouveau = {
      ...nouveauLivreur,
      id: livreurs.length + 1,
    };
    setLivreurs([nouveau, ...livreurs]);
    setNouveauLivreur({ nom: '', téléphone: '', ville: '', statut: 'actif' });
  };

  const basculerStatut = (id: number) => {
    setLivreurs((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, statut: l.statut === 'actif' ? 'inactif' : 'actif' }
          : l
      )
    );
  };

  const livreursFiltrés = livreurs.filter((l) =>
    l.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    l.téléphone.includes(recherche)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">🚚 Gestion des Livreurs</h1>

      {/* Formulaire */}
      <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Nom"
            value={nouveauLivreur.nom}
            onChange={(e) => setNouveauLivreur({ ...nouveauLivreur, nom: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <input
            type="text"
            placeholder="Téléphone"
            value={nouveauLivreur.téléphone}
            onChange={(e) => setNouveauLivreur({ ...nouveauLivreur, téléphone: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <input
            type="text"
            placeholder="Ville"
            value={nouveauLivreur.ville}
            onChange={(e) => setNouveauLivreur({ ...nouveauLivreur, ville: e.target.value })}
            className="border px-4 py-2 rounded-md w-full"
          />
          <select
            value={nouveauLivreur.statut}
            onChange={(e) =>
              setNouveauLivreur({ ...nouveauLivreur, statut: e.target.value as 'actif' | 'inactif' })
            }
            className="border px-4 py-2 rounded-md w-full"
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
          <button
            onClick={ajouterLivreur}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕ Ajouter
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div>
        <input
          type="text"
          placeholder="🔍 Rechercher un livreur par nom ou téléphone..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="border px-4 py-2 rounded-md w-full max-w-md"
        />
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Nom</th>
              <th className="p-4">Téléphone</th>
              <th className="p-4">Ville</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {livreursFiltrés.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400 italic">
                  Aucun livreur trouvé.
                </td>
              </tr>
            ) : (
              livreursFiltrés.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-4">{l.id}</td>
                  <td className="p-4">{l.nom}</td>
                  <td className="p-4">{l.téléphone}</td>
                  <td className="p-4">{l.ville}</td>
                  <td className="p-4 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        l.statut === 'actif'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {l.statut}
                    </span>
                    <button
                      onClick={() => basculerStatut(l.id)}
                      className="text-blue-600 underline text-xs hover:text-blue-800"
                    >
                      Changer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Livreurs;
