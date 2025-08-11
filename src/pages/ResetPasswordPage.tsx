import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import app from '../firebaseConfig'; // Importa a configuração do Firebase
import { InterLogo } from '../components/InterLogo';
import { ServicoSocialLogo } from '../components/ServicoSocialLogo';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({
    text: '',
    type: null,
  });
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(app);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('oobCode');
    setOobCode(code);

    if (!code) {
      setMessage({
        text: 'Link inválido ou expirado. Por favor, solicite um novo link de redefinição de senha.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    const verifyCode = async () => {
      try {
        const email = await verifyPasswordResetCode(auth, code);
        setUserEmail(email);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Erro ao verificar o código:', error);
        let errorMessage = 'Link inválido ou expirado. Por favor, solicite um novo link de redefinição de senha.';
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'Link expirado. Por favor, solicite um novo link.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Link inválido. Por favor, solicite um novo link.';
        }
        setMessage({ text: errorMessage, type: 'error' });
        setIsLoading(false);
      }
    };

    verifyCode();
  }, [location.search, auth]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (!/(?=.*[a-zA-Z])/.test(pwd)) {
      return 'A senha deve conter pelo menos uma letra.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: null });

    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage({ text: passwordError, type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem. Por favor, verifique e tente novamente.', type: 'error' });
      return;
    }

    if (!oobCode) {
      setMessage({ text: 'Código de redefinição não encontrado.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage({ text: 'Senha definida com sucesso! Você será redirecionado para a página de login.', type: 'success' });
      setTimeout(() => {
        navigate('/login'); // Redireciona para a página de login após sucesso
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao definir a senha:', error);
      let errorMessage = 'Erro ao definir a senha. Por favor, tente novamente.';
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'Link expirado. Por favor, solicite um novo link.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Link inválido. Por favor, solicite um novo link.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres com letras e números.';
      }
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
      {/* Logo CTB */}
      <div className="mb-8">
        <div className="mb-4 mx-auto w-16 h-16">
          <InterLogo width={64} height={64} />
        </div>
        <h1 className="text-2xl font-bold text-red-600 text-center">
          Alojamentos
        </h1>
      </div>

      {/* Formulário de Redefinição de Senha */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold text-red-600 text-center mb-6">
          Definir Nova Senha
        </h2>

        {isLoading && message.type === null && (
          <div className="text-center mb-4">
            <p className="text-gray-600">Verificando link...</p>
          </div>
        )}

        {message.text && (
          <div
            className={`text-sm text-center mb-4 p-3 rounded-md ${message.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' : 'text-green-700 bg-green-50 border border-green-200'}`}
          >
            {message.text}
          </div>
        )}

        {!isLoading && message.type !== 'success' && message.type !== 'error' && userEmail && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Defina sua senha para acessar o sistema
            </p>
            <p className="text-sm font-medium text-gray-800 mt-2">
              Email: <span className="text-red-600">{userEmail}</span>
            </p>
          </div>
        )}

        {!isLoading && message.type !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres com letras</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha:
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Definindo...' : 'Definir Senha'}
            </button>
          </form>
        )}
      </div>

      {/* Logo do Sistema */}
      <div className="mt-8 text-center">
        <div className="w-12 h-12 mx-auto mb-2">
          <ServicoSocialLogo width={64} height={64} />
        </div>
        <p className="text-sm text-gray-600">
          Sistema de Gestão de Atletas Alojados
        </p>
        <p className="text-xs text-gray-500">
          Departamento de Serviço Social
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;


