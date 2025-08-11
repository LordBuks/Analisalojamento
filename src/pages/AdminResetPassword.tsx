import React, { useState } from 'react';
import { resetPasswordService } from '../services/resetPasswordService';
import { InterLogo } from '../components/InterLogo';
import { ServicoSocialLogo } from '../components/ServicoSocialLogo';

const AdminResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({
    text: '',
    type: null,
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: null });
    setGeneratedLink(null);

    if (!email) {
      setMessage({ text: 'Email é obrigatório', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPasswordService.generateResetLink(email);
      
      setGeneratedLink(response.resetLink);
      setMessage({ 
        text: `Link gerado com sucesso para ${response.email}`, 
        type: 'success' 
      });
      
      // Limpar o email após sucesso
      setEmail('');
    } catch (error: any) {
      console.error('Erro ao gerar link:', error);
      
      let errorMessage = 'Erro ao gerar link de redefinição';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setMessage({ text: 'Link copiado para a área de transferência!', type: 'success' });
      } catch (error) {
        console.error('Erro ao copiar:', error);
        setMessage({ text: 'Erro ao copiar link', type: 'error' });
      }
    }
  };

  const sendViaWhatsApp = () => {
    if (generatedLink) {
      const message = `Olá! Aqui está o link para você definir sua senha de acesso ao Sistema de Alojamentos:\n\n${generatedLink}\n\nClique no link e siga as instruções para criar sua senha. O link é válido por 1 hora.\n\nQualquer dúvida, entre em contato conosco.`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
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

      {/* Formulário de Geração de Link */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold text-red-600 text-center mb-6">
          Gerar Link de Redefinição
        </h2>

        <p className="text-sm text-gray-600 text-center mb-6">
          Digite o email do usuário para gerar um link seguro de redefinição de senha
        </p>

        {message.text && (
          <div
            className={`text-sm text-center mb-4 p-3 rounded-md ${
              message.type === 'error' 
                ? 'text-red-700 bg-red-50 border border-red-200' 
                : 'text-green-700 bg-green-50 border border-green-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email do Usuário:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="usuario@exemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Gerando Link...' : 'Gerar Link'}
          </button>
        </form>

        {/* Link Gerado */}
        {generatedLink && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Link Gerado:
            </h3>
            <div className="bg-white p-3 rounded border text-xs break-all text-gray-600">
              {generatedLink}
            </div>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                📋 Copiar
              </button>
              <button
                onClick={sendViaWhatsApp}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
              >
                📱 WhatsApp
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              ⚠️ O link expira em 1 hora
            </p>
          </div>
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

export default AdminResetPassword;

