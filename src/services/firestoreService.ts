import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
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
      // Carregar dados de abril-2025
      const abrilResponse = await fetch('/data/abril-2025.json');
      const abrilData: OccurrenceData[] = await abrilResponse.json();
      
      // Adicionar informações de mês e ano
      const abrilProcessed = abrilData.map(item => ({
        ...item,
        month: 'abril',
        year: 2025
      }));

      // Carregar dados de maio-2025
      const maioResponse = await fetch('/data/maio-2025.json');
      const maioData: OccurrenceData[] = await maioResponse.json();
      
      const maioProcessed = maioData.map(item => ({
        ...item,
        month: 'maio',
        year: 2025
      }));

      // Carregar dados de junho-2025
      const junhoResponse = await fetch('/data/junho-2025.json');
      const junhoData: OccurrenceData[] = await junhoResponse.json();
      
      const junhoProcessed = junhoData.map(item => ({
        ...item,
        month: 'junho',
        year: 2025
      }));

      // Combinar todos os dados
      const allData = [...abrilProcessed, ...maioProcessed, ...junhoProcessed];

      // Carregar para a coleção 'monthlyData' (conforme os índices)
      await this.addMultipleOccurrences(allData, 'monthlyData');

      // Carregar também para 'occurrences' se necessário
      await this.addMultipleOccurrences(allData, 'occurrences');

      console.log('Dados carregados com sucesso para o Firebase!');
    } catch (error) {
      console.error('Erro ao carregar dados JSON para o Firebase:', error);
      throw error;
    }
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

  // Atualizar o status de abono/remoção de uma ocorrência
  async updateOccurrenceAbatementStatus(occurrenceId: string, isAbatedOrRemoved: boolean, actionByEmail: string, collectionName: string = 'occurrences'): Promise<void> {
    try {
      const occurrenceRef = doc(db, collectionName, occurrenceId);
      await updateDoc(occurrenceRef, {
        isAbatedOrRemoved: isAbatedOrRemoved,
        actionBy: actionByEmail,
        actionAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar status de abono/remoção da ocorrência:', error);
      throw error;
    }
  }
};