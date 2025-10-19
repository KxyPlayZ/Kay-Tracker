// frontend/src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { authAPI } from '../../services/api';

const Login = () => {
  const { login, darkMode } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const response = await authAPI.register(formData);
        login(response.data.user, response.data.token);
      } else {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        login(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8 w-full max-w-md`}>
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp size={40} className="text-blue-500" />
          <h1 className="text-3xl font-bold">Aktien Tracker</h1>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          {isRegister ? 'Registrieren' : 'Anmelden'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block mb-2 text-sm font-medium">Benutzername</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full p-3 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
                placeholder="dein_benutzername"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium">E-Mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full p-3 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              required
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Passwort</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full p-3 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              required
              placeholder="••••••••"
              minLength="6"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded transition-colors disabled:bg-blue-300"
          >
            {loading ? 'Lädt...' : isRegister ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {isRegister ? 'Bereits ein Konto? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
