// Serviço para gerenciar dados locais como fallback quando Firebase não está disponível
import { AthleteOccurrence } from '../data/athleteData';

const LOCAL_STORAGE_KEY = 'occurrences_abated_status';

export interface LocalOccurrenceStatus {
  id: string;
  isAbatedOrRemoved: boolean;
  actionBy: string;
  actionAt: number;
}

export const localStorageService = {
  // Salvar status de abono/remoção no localStorage
  saveOccurrenceStatus(occurrenceId: string, isAbatedOrRemoved: boolean, actionBy: string): void {
    try {
      const existingData = this.getAllOccurrenceStatuses();
      const newStatus: LocalOccurrenceStatus = {
        id: occurrenceId,
        isAbatedOrRemoved,
        actionBy,
        actionAt: Date.now()
      };
      
      // Remover status anterior se existir
      const filteredData = existingData.filter(item => item.id !== occurrenceId);
      
      // Adicionar novo status
      filteredData.push(newStatus);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredData));
      console.log(`Status da ocorrência ${occurrenceId} salvo no localStorage`);
    } catch (error) {
      console.error('Erro ao salvar status no localStorage:', error);
    }
  },

  // Obter status de uma ocorrência específica
  getOccurrenceStatus(occurrenceId: string): LocalOccurrenceStatus | null {
    try {
      const allStatuses = this.getAllOccurrenceStatuses();
      return allStatuses.find(item => item.id === occurrenceId) || null;
    } catch (error) {
      console.error('Erro ao obter status do localStorage:', error);
      return null;
    }
  },

  // Obter todos os status salvos
  getAllOccurrenceStatuses(): LocalOccurrenceStatus[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao obter dados do localStorage:', error);
      return [];
    }
  },

  // Aplicar status salvos a uma lista de ocorrências
  applyLocalStatusesToOccurrences(occurrences: AthleteOccurrence[]): AthleteOccurrence[] {
    try {
      const allStatuses = this.getAllOccurrenceStatuses();
      
      return occurrences.map(occurrence => {
        const localStatus = allStatuses.find(status => status.id === occurrence.id);
        
        if (localStatus) {
          return {
            ...occurrence,
            isAbatedOrRemoved: localStatus.isAbatedOrRemoved,
            actionBy: localStatus.actionBy,
            actionAt: localStatus.actionAt
          };
        }
        
        return occurrence;
      });
    } catch (error) {
      console.error('Erro ao aplicar status locais:', error);
      return occurrences;
    }
  },

  // Limpar todos os dados salvos
  clearAllStatuses(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Todos os status locais foram limpos');
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }
};

