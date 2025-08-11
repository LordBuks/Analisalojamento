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
}

interface ErrorResponse {
  error: string;
  code: string;
}

class CustomResetPasswordService {
  private baseUrl: string;

  constructor() {
    // URL do backend customizado
    this.baseUrl = 'https://backend-one-neon-11.vercel.app/';
  }

  /**
   * Gera um link de redefinição de senha para o email especificado
   */
  async generateResetLink(email: string): Promise<GenerateResetLinkResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-reset-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar link de redefinição');
      }

      return data as GenerateResetLinkResponse;
    } catch (error) {
      console.error('Erro ao gerar link de redefinição:', error);
      throw error;
    }
  }

  /**
   * Valida um token de redefinição e retorna informações do usuário
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
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
      console.error('Erro ao validar token:', error);
      throw error;
    }
  }

  /**
   * Redefine a senha usando o token
   */
  async resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
    try {
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
      console.error('Erro ao redefinir senha:', error);
      throw error;
    }
  }

  /**
   * Verifica se o backend está funcionando
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Erro no health check:', error);
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
}

export const customResetPasswordService = new CustomResetPasswordService();
export type { GenerateResetLinkResponse, ValidateTokenResponse, ResetPasswordResponse, ErrorResponse };



