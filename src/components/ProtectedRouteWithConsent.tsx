import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useConsentManager } from '../services/ConsentService';
import ConsentModal from './ConsentModal';

interface ProtectedRouteWithConsentProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const ProtectedRouteWithConsent: React.FC<ProtectedRouteWithConsentProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { needsConsent, isLoading: consentLoading, recordConsent } = useConsentManager();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentDenied, setConsentDenied] = useState(false);

  useEffect(() => {
    if (!authLoading && !consentLoading && user && needsConsent) {
      setShowConsentModal(true);
    }
  }, [authLoading, consentLoading, user, needsConsent]);

  const handleConsent = async (consented: boolean) => {
    try {
      await recordConsent(consented);
      
      if (consented) {
        setShowConsentModal(false);
      } else {
        setConsentDenied(true);
        setShowConsentModal(false);
      }
    } catch (error) {
      console.error('Erro ao registrar consentimento:', error);
      alert('Erro ao registrar consentimento. Tente novamente.');
    }
  };

  const handleCloseModal = () => {
    // Não permitir fechar o modal sem dar consentimento
    // O usuário deve escolher aceitar ou negar
  };

  // Mostrar loading enquanto verifica autenticação e consentimento
  if (authLoading || consentLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permissões de role se especificado
  if (requiredRole && requiredRole.length > 0) {
    const userRole = user.role || user.customClaims?.role;
    if (!requiredRole.includes(userRole)) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso Negado</h2>
            <p className="text-gray-600 mb-6">
              Você não possui permissão para acessar esta área do sistema.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }

  // Mostrar tela de consentimento negado
  if (consentDenied) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Consentimento Necessário</h2>
          <p className="text-gray-600 mb-6">
            Para acessar o sistema, é necessário aceitar os termos de uso e política 
            de privacidade para o tratamento de dados de atletas menores de idade.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setConsentDenied(false);
                setShowConsentModal(true);
              }}
              className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Revisar Termos
            </button>
            <button
              onClick={() => {
                // Fazer logout do usuário
                window.location.href = '/login';
              }}
              className="w-full bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Sair do Sistema
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Modal de Consentimento */}
      <ConsentModal
        isOpen={showConsentModal}
        onClose={handleCloseModal}
        onConsent={handleConsent}
        userEmail={user.email || ''}
      />
    </>
  );
};

export default ProtectedRouteWithConsent;

