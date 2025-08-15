import { AthleteOccurrence } from './athleteData';
import { normalizeData } from '../utils/dataTransformer';
import { firestoreService } from '../services/firestoreService';

export interface MonthlyData {
  month: string;
  year: number;
  data: AthleteOccurrence[];
}

// Função para carregar dados do Firebase primeiro, depois JSON local como fallback
export const loadMonthlyData = async (): Promise<MonthlyData[]> => {
  const monthlyDataList: MonthlyData[] = [];
  
  try {
    // Tentar carregar dados do Firebase primeiro
    console.log('Tentando carregar dados do Firebase...');
    const firebaseData = await firestoreService.getAllOccurrences('monthlyData');
    
    if (firebaseData && firebaseData.length > 0) {
      console.log(`Carregados ${firebaseData.length} registros do Firebase`);
      
      // Agrupar dados por mês e ano
      const groupedData = firebaseData.reduce((acc, occurrence) => {
        const month = occurrence.month || 'Geral';
        const year = occurrence.year || 2025;
        const key = `${month}-${year}`;
        
        if (!acc[key]) {
          acc[key] = { month, year, data: [] };
        }
        acc[key].data.push(occurrence);
        return acc;
      }, {} as { [key: string]: MonthlyData });
      
      return Object.values(groupedData);
    }
  } catch (error) {
    console.log('Erro ao carregar dados do Firebase, tentando JSON local:', error);
  }

  // Fallback para arquivos JSON locais APENAS se Firebase estiver vazio
  console.log('Firebase vazio ou inacessível, carregando dados dos arquivos JSON locais...');
  
  const monthlyFiles = [
    { file: 'dezembro-2025.json', month: 'Dezembro', year: 2025 },
    { file: 'novembro-2025.json', month: 'Novembro', year: 2025 },
    { file: 'outubro-2025.json', month: 'Outubro', year: 2025 },
    { file: 'setembro-2025.json', month: 'Setembro', year: 2025 },
    { file: 'agosto-2025.json', month: 'Agosto', year: 2025 },
    { file: 'julho-2025.json', month: 'Julho', year: 2025 },
    { file: 'junho-2025.json', month: 'Junho', year: 2025 },
    { file: 'maio-2025.json', month: 'Maio', year: 2025 },
    { file: 'abril-2025.json', month: 'Abril', year: 2025 },
    { file: 'marco-2025.json', month: 'Março', year: 2025 },
    { file: 'fevereiro-2025.json', month: 'Fevereiro', year: 2025 },
    { file: 'janeiro-2025.json', month: 'Janeiro', year: 2025 }
  ];

  for (const { file, month, year } of monthlyFiles) {
    try {
      const response = await fetch(`/data/${file}`);
      if (response.ok) {
        const rawData = await response.json();
        const monthData: AthleteOccurrence[] = normalizeData(rawData);
        
        if (Array.isArray(monthData) && monthData.length > 0) {
          monthlyDataList.push({
            month,
            year,
            data: monthData
          });
        }
      }
    } catch (error) {
      console.log(`Erro ao carregar ${file}:`, error);
    }
  }

  return monthlyDataList;
};

// Função para consolidar todos os dados em um array único
export const getAllOccurrences = async (): Promise<AthleteOccurrence[]> => {
  try {
    // Tentar carregar diretamente do Firebase primeiro
    console.log('Carregando todas as ocorrências do Firebase...');
    const firebaseData = await firestoreService.getAllOccurrences('monthlyData');
    
    if (firebaseData && firebaseData.length > 0) {
      console.log(`Retornando ${firebaseData.length} ocorrências do Firebase`);
      return firebaseData;
    }
  } catch (error) {
    console.log('Erro ao carregar do Firebase, usando fallback:', error);
  }

  // Fallback para dados locais
  console.log('Usando fallback para dados locais...');
  const monthlyDataList = await loadMonthlyData();
  const allOccurrences: AthleteOccurrence[] = [];
  
  monthlyDataList.forEach(monthData => {
    allOccurrences.push(...monthData.data);
  });
  
  return allOccurrences;
};

// Função para obter dados de um mês específico
export const getMonthData = async (month: string, year: number): Promise<AthleteOccurrence[]> => {
  try {
    // Tentar carregar do Firebase primeiro
    const firebaseData = await firestoreService.getOccurrencesByMonth(month, year, 'monthlyData');
    
    if (firebaseData && firebaseData.length > 0) {
      console.log(`Retornando ${firebaseData.length} ocorrências de ${month}/${year} do Firebase`);
      return firebaseData;
    }
  } catch (error) {
    console.log(`Erro ao carregar ${month}/${year} do Firebase, usando fallback:`, error);
  }

  // Fallback para dados locais
  const monthlyDataList = await loadMonthlyData();
  const monthData = monthlyDataList.find(data => data.month === month && data.year === year);
  return monthData ? monthData.data : [];
};

// Função para obter lista de meses disponíveis, ordenada do mais recente para o mais antigo
export const getAvailableMonths = async (): Promise<{month: string, year: number}[]> => {
  const monthlyDataList = await loadMonthlyData();
  // Mapeia os nomes dos meses para números para facilitar a comparação
  const monthOrder: { [key: string]: number } = {
    'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
    'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
    'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
  };

  return monthlyDataList.map(data => ({ month: data.month, year: data.year }))
    .sort((a, b) => {
      // Ordena por ano (descendente) e depois por mês (descendente)
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return monthOrder[b.month] - monthOrder[a.month];
    });
};

