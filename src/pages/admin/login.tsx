import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../../assets/images/rapidons.png';

const Login = () => {
  const navigate = useNavigate();

  const [uid, setUid] = useState('+243826016607');
  const [password, setPassword] = useState('0826016607Makengo@');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = JSON.stringify({
      "uid": uid,
      "password": password
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://24.144.87.127:3333/login',
      headers: { 
        'Content-Type': 'application/json'
      },
      data: data
    };

    try {
      const response = await axios.request(config);
      
      // Extraire le token depuis la structure: response.data.token.token
      const token = response.data?.token?.token || response.data?.token;
      
      if (token && typeof token === 'string' && token.trim() !== '') {
        localStorage.setItem('authToken', token);
        setLoading(false);
        // Utiliser window.location pour forcer un rechargement complet
        window.location.href = '/dashboard';
      } else {
        setError('Token non reçu. Vérifiez la réponse du serveur.');
        setLoading(false);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 relative overflow-hidden items-center justify-center">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-20 -mt-20" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mb-32" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-24 h-24 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <img src={logo} alt="Rapidos" className="w-16 h-16 rounded-2xl object-cover" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Rapidons
          </h1>
          <p className="text-emerald-100/80 text-lg leading-relaxed">
            Plateforme d'administration pour gérer vos commandes, vendeurs, livreurs et produits en toute simplicité.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-xs text-emerald-200/70 font-medium">Rapide</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <p className="text-xs text-emerald-200/70 font-medium">Sécurisé</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
              </div>
              <p className="text-xs text-emerald-200/70 font-medium">Fiable</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit - Formulaire */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
              <img src={logo} alt="Rapidos" className="w-10 h-10 rounded-xl object-cover" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Bienvenue
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">Connectez-vous à votre espace administrateur</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-4.5 h-4.5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="+243..."
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4.5 h-4.5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez votre mot de passe"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 text-white py-3.5 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-200 font-semibold text-sm shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/25 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white/30 border-t-white"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Rapidons — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
