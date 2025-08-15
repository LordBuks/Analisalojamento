import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, query, where, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
import app from '../firebaseConfig';

const db = getFirestore(app);

export interface OccurrenceData {
  NOME: string;
  Cat: string;
  DATA: number | string;
  TIPO: string;
  OCORRÊNCIA: string;
  Valor: number;
  month?: string;
  year?: number;
}

export const firestoreService = {
  // Adicionar uma ocorrência
  async addOccurrence(data: OccurrenceData, collectionName: string = 'occurrences'): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar ocorrência:', error);
      throw error;
    }
  },

  // Adicionar múltiplas ocorrências em lote
  async addMultipleOccurrences(occurrences: OccurrenceData[], collectionName: string = 'occurrences'): Promise<void> {
    try {
      const promises = occurrences.map(occurrence => 
        this.addOccurrence(occurrence, collectionName)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Erro ao adicionar múltiplas ocorrências:', error);
      throw error;
    }
  },

  // Buscar ocorrências por mês usando os índices corretos
  async getOccurrencesByMonth(month: string, year: number, collectionName: string = 'monthlyData'): Promise<OccurrenceData[]> {
    try {
      const q = query(
        collection(db, collectionName),
        where('year', '==', year),
        where('month', '==', month)
      );
      
      const querySnapshot = await getDocs(q);
      const occurrences: OccurrenceData[] = [];
      
      querySnapshot.forEach((doc) => {
        occurrences.push({ id: doc.id, ...doc.data() } as OccurrenceData & { id: string });
      });
      
      return occurrences;
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
      throw error;
    }
  },

  // Buscar todas as ocorrências
  async getAllOccurrences(collectionName: string = 'occurrences'): Promise<OccurrenceData[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const occurrences: OccurrenceData[] = [];
      
      querySnapshot.forEach((doc) => {
        occurrences.push({ id: doc.id, ...doc.data() } as OccurrenceData & { id: string });
      });
      
      return occurrences;
    } catch (error) {
      console.error('Erro ao buscar todas as ocorrências:', error);
      throw error;
    }
  },

  // Carregar dados dos arquivos JSON para o Firebase
  async loadJsonDataToFirestore(): Promise<void> {
    try {
      console.log('Iniciando carregamento de dados JSON para o Firebase...');
      
      // Lista de todos os arquivos JSON disponíveis
      const monthlyFiles = [
        { file: 'abril-2025.json', month: 'Abril', year: 2025 },
        { file: 'maio-2025.json', month: 'Maio', year: 2025 },
        { file: 'junho-2025.json', month: 'Junho', year: 2025 },
        { file: 'julho-2025.json', month: 'Julho', year: 2025 },
        { file: 'marco-2025.json', month: 'Março', year: 2025 }
      ];

      let totalProcessed = 0;
      
      for (const { file, month, year } of monthlyFiles) {
        try {
          console.log(`Carregando dados de ${file}...`);
          const response = await fetch(`/data/${file}`);
          
          if (!response.ok) {
            console.log(`Arquivo ${file} não encontrado ou vazio, pulando...`);
            continue;
          }
          
          const rawData = await response.json();
          
          if (!Array.isArray(rawData) || rawData.length === 0) {
            console.log(`Arquivo ${file} vazio ou formato inválido, pulando...`);
            continue;
          }

          // Processar dados usando o dataTransformer para garantir IDs consistentes
          const { normalizeData } = await import('../utils/dataTransformer');
          const processedData = normalizeData(rawData).map((item, index) => {
            // Limpar dados removendo campos undefined e null
            const cleanedItem = this.cleanDataForFirebase({
              ...item,
              month: month,
              year: year,
              sourceFile: file
            });
            
            return cleanedItem;
          });

          console.log(`Processados ${processedData.length} registros de ${file}`);

          // Salvar cada ocorrência com seu ID específico usando setDoc
          for (const occurrence of processedData) {
            if (occurrence.id) {
              try {
                // Salvar na coleção monthlyData
                const monthlyDataRef = doc(db, 'monthlyData', occurrence.id);
                await setDoc(monthlyDataRef, {
                  ...occurrence,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now()
                });

                // Salvar também na coleção occurrences para compatibilidade
                const occurrenceRef = doc(db, 'occurrences', occurrence.id);
                await setDoc(occurrenceRef, {
                  ...occurrence,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now()
                });

                totalProcessed++;
              } catch (docError) {
                console.error(`Erro ao salvar ocorrência ${occurrence.id}:`, docError);
                console.log('Dados da ocorrência:', occurrence);
              }
            }
          }

          console.log(`Dados de ${file} carregados com sucesso!`);
        } catch (fileError) {
          console.error(`Erro ao processar ${file}:`, fileError);
          // Continua com o próximo arquivo mesmo se um falhar
        }
      }

      console.log(`Carregamento concluído! Total de ${totalProcessed} ocorrências processadas.`);
      
      if (totalProcessed === 0) {
        throw new Error('Nenhum dado foi carregado. Verifique se os arquivos JSON existem na pasta public/data/');
      }

    } catch (error) {
      console.error('Erro ao carregar dados JSON para o Firebase:', error);
      throw error;
    }
  },

  // Função para limpar dados removendo campos undefined, null e vazios
  cleanDataForFirebase(data: any): any {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Pular campos undefined, null ou strings vazias
      if (value !== undefined && value !== null && value !== '') {
        // Se for um objeto, limpar recursivamente
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          const cleanedNested = this.cleanDataForFirebase(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  },

  // Verificar se os dados já foram carregados
  async checkIfDataExists(collectionName: string = 'occurrences'): Promise<boolean> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar dados existentes:', error);
      return false;
    }
  },

  // Atualizar o status de abono/remoção de uma ocorrência (com upsert)
  async updateOccurrenceAbatementStatus(occurrenceId: string, isAbatedOrRemoved: boolean, actionByEmail: string, collectionName: string = 'occurrences'): Promise<void> {
    try {
      // Validar se o ID da ocorrência é válido
      if (!occurrenceId || occurrenceId.trim() === '') {
        throw new Error('ID da ocorrência é obrigatório e não pode estar vazio');
      }

      // Validar se o email do usuário é válido
      if (!actionByEmail || actionByEmail.trim() === '') {
        throw new Error('Email do usuário é obrigatório');
      }

      console.log(`Tentando atualizar ocorrência ${occurrenceId} na coleção ${collectionName}`);
      
      const occurrenceRef = doc(db, collectionName, occurrenceId);
      
      // Primeiro, verificar se o documento existe
      const docSnap = await getDoc(occurrenceRef);
      
      if (docSnap.exists()) {
        // Documento existe, fazer update
        console.log('Documento existe, fazendo update...');
        await updateDoc(occurrenceRef, {
          isAbatedOrRemoved: isAbatedOrRemoved,
          actionBy: actionByEmail,
          actionAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        console.log(`Ocorrência ${occurrenceId} atualizada com sucesso`);
      } else {
        // Documento não existe, isso é esperado para dados locais
        console.log(`Documento ${occurrenceId} não existe no Firebase. Isso é normal para dados locais.`);
        throw new Error(`Documento não encontrado no Firebase. Funcionalidade disponível apenas para dados já salvos no Firebase.`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status de abono/remoção da ocorrência:', error);
      throw new Error(`Falha ao atualizar ocorrência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  },

  // Função para salvar uma ocorrência local no Firebase (para permitir futuras atualizações)
  async saveLocalOccurrenceToFirebase(occurrence: any, collectionName: string = 'occurrences'): Promise<string> {
    try {
      console.log('Salvando ocorrência local no Firebase...');
      
      // Se já tem ID, usar setDoc, senão usar addDoc
      if (occurrence.id) {
        const occurrenceRef = doc(db, collectionName, occurrence.id);
        await setDoc(occurrenceRef, {
          ...occurrence,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        console.log(`Ocorrência salva com ID: ${occurrence.id}`);
        return occurrence.id;
      } else {
        const docRef = await addDoc(collection(db, collectionName), {
          ...occurrence,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        console.log(`Ocorrência salva com novo ID: ${docRef.id}`);
        return docRef.id;
      }
    } catch (error) {
      console.error('Erro ao salvar ocorrência no Firebase:', error);
      throw error;
    }
  },

  // Função para buscar uma ocorrência específica por ID
  async getOccurrenceById(occurrenceId: string, collectionName: string = 'occurrences'): Promise<any> {
    try {
      if (!occurrenceId || occurrenceId.trim() === '') {
        throw new Error('ID da ocorrência é obrigatório');
      }

      const occurrenceRef = doc(db, collectionName, occurrenceId);
      const docSnap = await getDoc(occurrenceRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Ocorrência com ID ${occurrenceId} não encontrada`);
      }

      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      console.error('Erro ao buscar ocorrência por ID:', error);
      throw error;
    }
  }
};