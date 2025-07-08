import React, { useEffect, useState } from 'react';

type CategoryType = {
  id: number;
  name: string;
};

const Categories = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Simule des données fictives
    setTimeout(() => {
      setCategories([
        { id: 1, name: 'Burgers' },
        { id: 2, name: 'Boissons' },
        { id: 3, name: 'Snacks' },
        { id: 4, name: 'Pizzas' },
        { id: 5, name: 'Desserts' },
      ]);
      setLoading(false);
      setError(null);
    }, 500);
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">📂 Liste des Catégories</h1>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ul className="grid gap-3">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="p-3 rounded bg-white border shadow-sm hover:bg-gray-100 transition"
            >
              {cat.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Categories;
