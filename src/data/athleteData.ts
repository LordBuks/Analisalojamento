export interface AthleteOccurrence {
  id: string; // Adicionando ID para facilitar a atualização
  NOME: string;
  CAT: string;
  DATA: number; // Agora é um número, provavelmente um serial de data
  TIPO: string; // Novo campo para o tipo de ocorrência
  OCORRÊNCIA: string;
  VALOR: number;
  fotoUrl?: string;
  isAbatedOrRemoved?: boolean; // Indica se a ocorrência foi desconsiderada
  actionBy?: string; // Email ou ID do usuário que realizou a ação
  actionAt?: number; // Data e hora da ação (timestamp)
}


