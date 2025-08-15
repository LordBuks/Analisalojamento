import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import ConsentModal from './ConsentModal';
import { useAuth } from '../hooks/useAuth';

const PrivacyPolicyLink: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConsent = (consented: boolean) => {
    // Não é necessário fazer nada aqui, pois é apenas para visualização
    // O consentimento já foi dado anteriormente
    console.log('Política visualizada:', consented);
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
      >
        <Shield className="h-4 w-4" />
        <span>Política de Privacidade LGPD</span>
      </button>

      <ConsentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConsent={handleConsent}
        userEmail={user?.email || ''}
      />
    </>
  );
};

export default PrivacyPolicyLink;

