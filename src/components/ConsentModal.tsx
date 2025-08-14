import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, Users, Lock, AlertTriangle } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consented: boolean) => void;
  userEmail: string;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ 
  isOpen, 
  onClose, 
  onConsent, 
  userEmail 
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setHasScrolledToBottom(isAtBottom);
  };

  const handleConsent = (consented: boolean) => {
    onConsent(consented);
    if (consented) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Termo de Consentimento LGPD</h2>
              <p className="text-red-50 font-bold">Sistema de Gestão de Atletas Alojados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors"
            disabled={!hasScrolledToBottom}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onScroll={handleScroll}
        >
          {/* Informações do Usuário */}
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-600">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-800">Informações do Funcionário</h3>
            </div>
            <p><strong>Email:</strong> {userEmail}</p>
            <p><strong>Data/Hora:</strong> {currentTime.toLocaleString('pt-BR')}</p>
            <p><strong>Sistema:</strong> Analisalojamento - Gestão de Atletas</p>
          </div>

          {/* Aviso Importante */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Aviso Importante</h3>
                <p className="text-yellow-700">
                  Este sistema processa dados pessoais sensíveis de atletas menores de idade. 
                  O acesso e uso destes dados estão sujeitos às disposições da Lei Geral de 
                  Proteção de Dados (LGPD), Estatuto da Criança e do Adolescente (ECA) e 
                  demais legislações aplicáveis.
                </p>
              </div>
            </div>
          </div>

          {/* Política de Privacidade */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-red-600" />
              <h3 className="text-xl font-semibold text-gray-800">Política de Privacidade e Termos de Uso</h3>
            </div>

            <div className="space-y-6 text-gray-700">
              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">1. Finalidade do Tratamento de Dados</h4>
                <p className="mb-3">
                  Os dados pessoais dos atletas menores de idade são tratados exclusivamente para:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Gestão e acompanhamento pedagógico dos atletas alojados.</li>
                  <li>Registro e controle de ocorrências disciplinares para fins educativos.</li>
                  <li>Elaboração de relatórios individuais de desenvolvimento.</li>
                  <li>Comunicação com responsáveis legais quando necessário.</li>
                  <li>Cumprimento de obrigações legais e regulamentares.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">2. Base Legal para o Tratamento</h4>
                <p className="mb-3">
                  O tratamento dos dados pessoais dos atletas menores de idade fundamenta-se em:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Consentimento específico dos pais ou responsáveis legais (Art. 7º, I da LGPD).</li>
                  <li>Proteção da vida ou da incolumidade física do titular (Art. 7º, III da LGPD).</li>
                  <li>Exercício regular de direitos em processo judicial, administrativo ou arbitral (Art. 7º, VI da LGPD).</li>
                  <li>Proteção do crédito, conforme disposto em legislação específica (Art. 7º, X da LGPD).</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">3. Dados Coletados e Processados</h4>
                <p className="mb-3">
                  O sistema processa as seguintes categorias de dados pessoais:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de identificação:</strong> nome completo, data de nascimento.</li>
                  <li><strong>Dados acadêmicos:</strong> categoria, desempenho, frequência.</li>
                  <li><strong>Dados comportamentais:</strong> ocorrências disciplinares, observações pedagógicas.</li>
                  <li><strong>Dados biométricos:</strong> fotografias para identificação (quando aplicável).</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">4. Confidencialidade e Segurança dos Dados</h4>
                <p className="mb-3">
                  Como funcionário autorizado, você se compromete a:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Manter absoluto sigilo sobre todos os dados pessoais acessados.</li>
                  <li>Utilizar os dados exclusivamente para as finalidades autorizadas.</li>
                  <li>Não compartilhar, copiar ou distribuir dados para terceiros não autorizados.</li>
                  <li>Não acessar dados de atletas sem justificativa profissional.</li>
                  <li>Reportar imediatamente qualquer incidente de segurança ou vazamento de dados.</li>
                  <li>Seguir todas as políticas internas de segurança da informação.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">5. Relatórios e Documentos Impressos</h4>
                <p className="mb-3">
                  Quanto aos relatórios gerados pelo sistema:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Os relatórios são <strong>exclusivos ao atleta</strong> e seus responsáveis legais.</li>
                  <li>É <strong>vedado</strong> mostrar, compartilhar ou discutir relatórios de um atleta com outros atletas.</li>
                  <li>Documentos impressos devem ser armazenados em <strong>local seguro e restrito.</strong></li>
                  <li>Impressões desnecessárias devem ser evitadas, priorizando o meio digital.</li>
                  <li>Documentos físicos devem ser descartados de forma segura quando não mais necessários.</li>
                  <li>O acesso a relatórios impressos deve ser limitado apenas aos profissionais diretamente envolvidos.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">6. Direitos dos Titulares de Dados</h4>
                <p className="mb-3">
                  Os atletas e seus responsáveis possuem os seguintes direitos:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Confirmação da existência de tratamento de dados pessoais.</li>
                  <li>Acesso aos dados pessoais tratados.</li>
                  <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
                  <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
                  <li>Portabilidade dos dados a outro fornecedor.</li>
                  <li>Eliminação dos dados tratados com consentimento.</li>
                  <li>Revogação do consentimento.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">7. Responsabilidades e Penalidades</h4>
                <p className="mb-3">
                  O descumprimento das disposições deste termo pode resultar em:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Medidas disciplinares internas, incluindo advertência, suspensão ou demissão.</li>
                  <li>Responsabilização civil e criminal conforme legislação aplicável.</li>
                  <li>Multas e sanções previstas na LGPD.</li>
                  <li>Indenização por danos morais e materiais causados aos titulares.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-lg text-red-600 mb-3">8. Contato e Dúvidas</h4>
                <p className="mb-3">
                  Para esclarecimentos sobre o sistema
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Departamento de Serviço Social:</strong> Tiane Orleis Bitencourt Fone: (51) 99312-0679</li>
                  <li><strong>Email:</strong> tbitencourt@internacional.com.br</li>
                  <li><strong>Departamento de Serviço Social:</strong> Fabiana Batista da Silva Fone: (51) 99861-0523</li>
                  <li><strong>Email:</strong> fbsilva@internacional.com.br</li>
                </ul>
              </section>
            </div>
          </div>

          {/* Declaração de Consentimento */}
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <div className="flex items-start space-x-3">
              <Lock className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-3">Declaração de Consentimento</h3>
                <p className="text-red-700 mb-4">
                  Ao clicar em "ACEITO E CONCORDO", você declara que:
                </p>
                <ul className="list-disc list-inside space-y-2 text-red-700 ml-4">
                  <li>Leu e compreendeu integralmente este termo.</li>
                  <li>Concorda em cumprir todas as disposições aqui estabelecidas.</li>
                  <li>Compromete-se a tratar os dados de forma responsável e segura.</li>
                  <li>Entende as consequências do descumprimento das normas.</li>
                  <li>Reconhece a importância da proteção de dados de menores.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Informações de Auditoria */}
          <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600">
            <p><strong>Informações de Auditoria:</strong></p>
            <p>Este consentimento será registrado com data, hora, IP e identificação do usuário para fins de compliance e auditoria.</p>
            <p>Versão do documento: 1.0 | Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Footer com botões */}
        <div className="bg-gray-50 p-6 rounded-b-lg border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600">
              {!hasScrolledToBottom && (
                <p className="text-yellow-600 font-medium">
                  ⚠️ Role até o final do documento para habilitar os botões
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => handleConsent(false)}
                disabled={!hasScrolledToBottom}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                NÃO ACEITO
              </button>
              <button
                onClick={() => handleConsent(true)}
                disabled={!hasScrolledToBottom}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                ACEITO E CONCORDO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;

