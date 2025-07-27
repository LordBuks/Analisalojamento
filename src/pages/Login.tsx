import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import internacionalLogo from '@/assets/internacional_logo.png';
import servicoSocialLogo from '@/assets/servico_social_logo.png';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Credenciais inválidas.');
      } else {
        setError('Falha ao fazer login.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header com logo do Internacional */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo do Internacional */}
          <div className="text-center mb-8">
            <img 
              src={internacionalLogo} 
              alt="Sport Club Internacional" 
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Alojamento CTB
            </h1>
            <h2 className="text-lg font-semibold text-red-600 mb-8">
              Login
            </h2>
          </div>

          {/* Formulário de Login */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleEmailAuth} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email:
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha:
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Carregando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="mb-4">
            <img 
              src={servicoSocialLogo} 
              alt="Serviço Social" 
              className="w-16 h-16 mx-auto mb-2 object-contain"
            />
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">Sistema de Gestão de Atletas Alojados</p>
            <p>Departamento de Serviço Social</p>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            © 2025 TechVamp.
          </div>
        </div>
      </footer>
    </div>
  );
}

