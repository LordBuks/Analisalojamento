// Serviço customizado para redefinição de senha sem Firebase

interface GenerateResetLinkResponse {
  success: boolean;
  resetLink: string;
  email: string;
  message: string;
}

interface ValidateTokenResponse {
  success: boolean;
  email: string;
  message: string;
}

interface ResetPasswordResponse {
  success: boolean;
  email: string;
  message: string;
  firebaseUpdated?: boolean;
  firebaseError?: string;
}

interface ErrorResponse {
  error: string;
  code: string;
}

class CustomResetPasswordService {
  private baseUrl: string;

  constructor() {
    // URL do backend customizado - usando a variável de ambiente ou fallback
    this.baseUrl = import.meta.env.VITE_CUSTOM_RESET_BACKEND_URL || 'https://backend-git-main-lucianos-projects-3b17d3d8.vercel.app';
    
    // Remover barra final se existir
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
    
    console.log(`🔗 Backend URL configurada: ${this.baseUrl}`);
  }

  /**
   * Gera um link de redefinição de senha para o email especificado
   */
  async generateResetLink(email: string): Promise<GenerateResetLinkResponse> {
    try {
      console.log(`🔄 Gerando link para: ${email}`);
      console.log(`🌐 URL do backend: ${this.baseUrl}/generate-reset-link`);
      
      const response = await fetch(`${this.baseUrl}/generate-reset-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log(`📡 Status da resposta: ${response.status}`);
      
      const data = await response.json();
      console.log(`📋 Dados recebidos:`, data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar link de redefinição');
      }

      return data as GenerateResetLinkResponse;
    } catch (error) {
      console.error('❌ Erro ao gerar link de redefinição:', error);
      throw error;
    }
  }

  /**
   * Valida um token de redefinição e retorna informações do usuário
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      console.log(`🔍 Validando token: ${token.substring(0, 8)}...`);
      
      const response = await fetch(`${this.baseUrl}/validate-token/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao validar token');
      }

      return data as ValidateTokenResponse;
    } catch (error) {
      console.error('❌ Erro ao validar token:', error);
      throw error;
    }
  }

  /**
   * Redefine a senha usando o token
   */
  async resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
    try {
      console.log(`🔄 Redefinindo senha com token: ${token.substring(0, 8)}...`);
      
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }

      return data as ResetPasswordResponse;
    } catch (error) {
      console.error('❌ Erro ao redefinir senha:', error);
      throw error;
    }
  }

  /**
   * Verifica se o backend está funcionando
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log(`🏥 Verificando saúde do backend: ${this.baseUrl}/health`);
      
      const response = await fetch(`${this.baseUrl}/health`);
      const isHealthy = response.ok;
      
      console.log(`💚 Backend está ${isHealthy ? 'saudável' : 'com problemas'}`);
      
      return isHealthy;
    } catch (error) {
      console.error('❌ Erro no health check:', error);
      return false;
    }
  }

  /**
   * Traduz códigos de erro para mensagens amigáveis
   */
  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'MISSING_EMAIL': 'Email é obrigatório',
      'INVALID_EMAIL_FORMAT': 'Formato de email inválido',
      'USER_NOT_FOUND': 'Usuário não encontrado no sistema',
      'RATE_LIMIT_EXCEEDED': 'Muitas tentativas. Tente novamente em 15 minutos',
      'MISSING_TOKEN': 'Token é obrigatório',
      'TOKEN_NOT_FOUND': 'Link inválido',
      'TOKEN_EXPIRED': 'Link expirado. Solicite um novo link',
      'TOKEN_USED': 'Link já utilizado. Solicite um novo link',
      'MISSING_FIELDS': 'Todos os campos são obrigatórios',
      'WEAK_PASSWORD': 'Senha deve ter pelo menos 6 caracteres com letras',
      'INTERNAL_ERROR': 'Erro interno do servidor. Tente novamente',
    };

    return errorMessages[errorCode] || 'Erro desconhecido';
  }

  /**
   * Obtém a URL base do backend
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const customResetPasswordService = new CustomResetPasswordService();
export type { GenerateResetLinkResponse, ValidateTokenResponse, ResetPasswordResponse, ErrorResponse };

