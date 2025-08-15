import { AthleteOccurrence } from '../data/athleteData';

// Função auxiliar para converter número de série do Excel para data JavaScript
const excelSerialDateToJSDate = (serial: number): number => {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel considera 30/12/1899 como dia 0
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const jsDate = new Date(excelEpoch.getTime() + serial * millisecondsPerDay);
  return jsDate.getTime();
};

// Função para gerar ID único baseado nos dados da ocorrência
const generateOccurrenceId = (item: any, index: number): string => {
  const nome = (item.NOME || item.nome || '').replace(/\s+/g, '_');
  const data = item.DATA || Date.now();
  const tipo = (item.TIPO || '').replace(/\s+/g, '_');
  const valor = item.VALOR || item.Valor || 0;
  
  // Criar um hash simples baseado nos dados
  const dataStr = `${nome}_${data}_${tipo}_${valor}_${index}`;
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `occ_${Math.abs(hash)}_${Date.now()}_${index}`;
};

// Função para normalizar os dados para o formato esperado
export const normalizeData = (data: any[]): AthleteOccurrence[] => {
  if (!data || data.length === 0) return [];
  
  return data.map((item, index) => {
    let normalizedDate: number;
    
    // Verifica se DATA é uma string no formato DD/MM/YY
    if (typeof item.DATA === 'string') {
      const [day, month, year] = item.DATA.split('/').map(Number);
      // Converte ano de 2 dígitos para 4 dígitos (assumindo 20XX)
      const fullYear = year < 100 ? 2000 + year : year; 
      normalizedDate = new Date(fullYear, month - 1, day).getTime();
    } else if (typeof item.DATA === 'number') {
      // Se DATA é um número, assume que é um número de série do Excel
      normalizedDate = excelSerialDateToJSDate(item.DATA);
    } else {
      // Caso contrário, usa o valor original (pode ser um timestamp já)
      normalizedDate = item.DATA;
    }

    return {
      id: item.id || generateOccurrenceId(item, index), // Gerar ID se não existir
      NOME: item.NOME || item.nome,
      CAT: item.CAT || item.Cat,
      DATA: normalizedDate,
      TIPO: item.TIPO,
      OCORRÊNCIA: item.OCORRÊNCIA,
      VALOR: item.VALOR || item.Valor,
      month: item.month,
      year: item.year,
      isAbatedOrRemoved: item.isAbatedOrRemoved || false,
      actionBy: item.actionBy,
      actionAt: item.actionAt
    };
  });
};
