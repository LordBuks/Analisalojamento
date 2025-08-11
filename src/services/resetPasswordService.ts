// Serviço para comunicação com o backend de redefinição de senha

interface GenerateResetLinkResponse {
  success: boolean;
  resetLink: string;
  email: string;
  message: string;
}

interface ErrorResponse {
  error: string;
  code: string;
}

class ResetPasswordService {
  private baseUrl: string;

  constructor() {
    // URL do backend - vai usar a variável de ambiente ou localhost para desenvolvimento
    this.baseUrl = import.meta.env.VITE_RESET_PASSWORD_BACKEND_URL || 'http://localhost:3001';
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
      'INTERNAL_ERROR': 'Erro interno do servidor. Tente novamente',
    };

    return errorMessages[errorCode] || 'Erro desconhecido';
  }
}

export const resetPasswordService = new ResetPasswordService();
export type { GenerateResetLinkResponse, ErrorResponse };

