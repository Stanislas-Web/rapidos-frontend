import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const [uid, setUid] = useState('+243826016607');
  const [password, setPassword] = useState('0826016607Makengo?');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Connexion factice sans API
    setTimeout(() => {
      localStorage.setItem('authToken', 'mock-token'); // Stocke un faux token
      setLoading(false);
      navigate('/dashboard'); // Redirige vers le dashboard
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Connexion Rapidos</h2>

        {/* ❌ Plus de message d'erreur */}
        
        <input
          type="text"
          placeholder="Numéro de téléphone (uid)"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3A905B] text-white py-2 rounded-lg hover:bg-[#327C4E] transition"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
};

export default Login;
