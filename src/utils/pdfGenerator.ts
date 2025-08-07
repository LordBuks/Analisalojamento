import jsPDF from 'jspdf';
import { AthleteOccurrence } from '../data/athleteData';

export interface GroupedOccurrences {
  [key: string]: AthleteOccurrence[];
}

// Função para formatar data sem usar date-fns
const formatDate = (date: Date): string => {
  if (isNaN(date.getTime())) return 'Data Inválida';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const formatDateTime = (date: Date): string => {
  if (isNaN(date.getTime())) return 'Data Inválida';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Função para converter imagem para base64
const getImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    return '';
  }
};

// Função para calcular o espaço necessário para uma ocorrência
const calculateOccurrenceSpace = (doc: jsPDF, occurrence: AthleteOccurrence, contentWidth: number, margin: number): number => {
  let requiredSpace = 0;
  
  // Espaço para data e valor (1 linha)
  requiredSpace += 6;
  
  // Espaço para descrição
  const description = occurrence.OCORRÊNCIA;
  const maxLineWidth = contentWidth - 10;
  const lines = doc.splitTextToSize(description, maxLineWidth);
  requiredSpace += lines.length * 4;
  
  // Espaço adicional entre ocorrências
  requiredSpace += 3;
  
  return requiredSpace;
};

export const generateAthletePDF = async (athleteName: string, category: string, occurrences: AthleteOccurrence[], month: string, year: number) => {
  const doc = new jsPDF();
  
  // Configurações de fonte e cores
  const primaryColor = [220, 38, 38]; // red-600
  const secondaryColor = [75, 85, 99]; // gray-600
  const lightGray = [229, 231, 235]; // gray-200
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const footerHeight = 30; // Espaço reservado para o footer
  const maxContentHeight = pageHeight - footerHeight - 20; // 20 para margem superior
  
  // Carregar logo do serviço social
  let logoBase64 = '';
  try {
    logoBase64 = await getImageAsBase64('/src/assets/servico_social_logo.png');
  } catch (error) {
    console.warn('Não foi possível carregar o logo do serviço social');
  }
  
  // Função para adicionar footer personalizado
  const addCustomFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 25;
    
    // Adicionar divisor vermelho acima do footer
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5 - (10 / 2), pageWidth - margin, footerY - 5 - (10 / 2)); // Posição ajustada para afastar da linha

    // Texto do footer centralizado
    doc.setFontSize(6); // Reduzido o tamanho da fonte
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    const footerText1 = 'Sistema de Gestão de Atletas Alojados';
    const footerText2 = 'Departamento de Serviço Social';
    
    const text1Width = doc.getTextWidth(footerText1);
    const text2Width = doc.getTextWidth(footerText2);
    
    // Adicionar logo do serviço social (proporcional a 10mm de altura)
    if (logoBase64) {
      try {
        const logoHeight = 10;
        const logoWidth = (25.92 / 18) * logoHeight;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = footerY - logoHeight - 5; // Ajustado para ficar acima do texto
        doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn("Erro ao adicionar logo no footer");
      }
    }
    
    doc.text(footerText1, (pageWidth - text1Width) / 2, footerY + 2);
    doc.text(footerText2, (pageWidth - text2Width) / 2, footerY + 6);
  };
  
  // Função para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > maxContentHeight) {
      addCustomFooter(doc.getNumberOfPages(), 0); // Adicionar footer na página atual
      doc.addPage();
      yPosition = 20;
    }
  };
  
  // Cabeçalho do relatório
  doc.setFont(undefined, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Relatório - Análise Comportamental do Atleta", margin, yPosition);
  yPosition += 8;
  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`${month} de ${year}`, margin, yPosition);
  yPosition += 15;
  
  // Linha separadora
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;
  
  // Informações do atleta
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Nome: ${athleteName}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Categoria: ${category}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Total de Ocorrências: ${occurrences.length}`, margin, yPosition);
  yPosition += 8;
  
  const totalValue = occurrences.reduce((sum, occ) => sum + Number(occ.VALOR), 0);
  doc.text(`Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin, yPosition);
  yPosition += 15;
  
  // Ordenar ocorrências por data (mais recente primeiro) e depois por tipo
  const sortedOccurrences = [...occurrences].sort((a, b) => {
    const dateA = new Date(a.DATA);
    const dateB = new Date(b.DATA);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Agrupar ocorrências por tipo
  const groupedOccurrences: GroupedOccurrences = sortedOccurrences.reduce((acc, occ) => {
    const type = occ.TIPO || 'Outras';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(occ);
    return acc;
  }, {} as GroupedOccurrences);
  
  // Renderizar cada grupo de ocorrências
  Object.entries(groupedOccurrences).forEach(([type, typeOccurrences]) => {
    checkPageBreak(30);
    
    // Título do tipo de ocorrência
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${type} (${typeOccurrences.length})`, margin, yPosition);
    yPosition += 10;
    
    // Linha separadora para o tipo
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    // Listar ocorrências do tipo
    typeOccurrences.forEach((occurrence, index) => {
      // Calcular espaço necessário para esta ocorrência
      const requiredSpace = calculateOccurrenceSpace(doc, occurrence, contentWidth, margin);
      checkPageBreak(requiredSpace);
      
      // Data e valor
      const dateObject = new Date(occurrence.DATA);
      const formattedDate = formatDate(dateObject);
      
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`${index + 1}. Data: ${formattedDate}`, margin + 5, yPosition);
      
      const valueText = `Valor: R$ ${occurrence.VALOR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const valueWidth = doc.getTextWidth(valueText);
      doc.text(valueText, pageWidth - margin - valueWidth, yPosition);
      yPosition += 6;
      
      // Descrição da ocorrência
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      // Quebrar texto longo em múltiplas linhas
      const description = occurrence.OCORRÊNCIA;
      const maxLineWidth = contentWidth - 10;
      const lines = doc.splitTextToSize(description, maxLineWidth);
      
      lines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin + 5, yPosition);
        yPosition += 4;
      });
      
      yPosition += 3; // Espaço entre ocorrências
    });
    
    yPosition += 8; // Espaço entre tipos
  });
  
  // Adicionar footer personalizado em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addCustomFooter(i, totalPages);
  }
  
  // Salvar o PDF
  const fileName = `Relatorio_${athleteName.replace(/\s+/g, '_')}_${formatDateTime(new Date()).replace(/[\/\s:]/g, '_')}.pdf`;
  doc.save(fileName);
};



export const generateGeneralPDF = async (month: string, totalAthletes: number, totalOccurrences: number, totalValue: number, allAthletesData: { name: string; category: string; occurrences: AthleteOccurrence[]; }[]) => {
  const doc = new jsPDF();

  const primaryColor = [220, 38, 38]; // red-600
  const secondaryColor = [75, 85, 99]; // gray-600
  const lightGray = [229, 231, 235]; // gray-200

  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const footerHeight = 30; // Espaço reservado para o footer
  const maxContentHeight = pageHeight - footerHeight - 20; // 20 para margem superior

  // Carregar logo do serviço social
  let logoBase64 = "";
  try {
    logoBase64 = await getImageAsBase64("/src/assets/servico_social_logo.png");
  } catch (error) {
    console.warn("Não foi possível carregar o logo do serviço social");
  }

  // Função para adicionar footer personalizado
  const addCustomFooter = (pageNumber: number, totalPages: number) => {
    const footerY = pageHeight - 25;

    // Adicionar divisor vermelho acima do footer
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5 - (10 / 2), pageWidth - margin, footerY - 5 - (10 / 2));

    // Texto do footer centralizado
    doc.setFontSize(6);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    const footerText1 = "Sistema de Gestão de Atletas Alojados";
    const footerText2 = "Departamento de Serviço Social";

    const text1Width = doc.getTextWidth(footerText1);
    const text2Width = doc.getTextWidth(footerText2);

    if (logoBase64) {
      try {
        const logoHeight = 10;
        const logoWidth = (25.92 / 18) * logoHeight;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = footerY - logoHeight - 5; // Ajustado para ficar acima do texto
        doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn("Erro ao adicionar logo no footer");
      }
    }

    doc.text(footerText1, (pageWidth - text1Width) / 2, footerY + 2);
    doc.text(footerText2, (pageWidth - text2Width) / 2, footerY + 6);
  };

  // Função para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > maxContentHeight) {
      addCustomFooter(doc.getNumberOfPages(), 0);
      doc.addPage();
      yPosition = 20;
    }
  };

  // Cabeçalho do relatório geral
  doc.setFont(undefined, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Relatório Geral - ${month}`, margin, yPosition);
  yPosition += 15;

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Informações do painel principal
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Total de Atletas: ${totalAthletes}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Total de Ocorrências: ${totalOccurrences}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Valor Total: R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, margin, yPosition);
  yPosition += 15;

  // Adicionar linha separadora antes de listar os atletas
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Listar ocorrências de cada atleta (ordenado alfabeticamente)
  const sortedAthletesData = [...allAthletesData].sort((a, b) => a.name.localeCompare(b.name));

  for (const athleteData of sortedAthletesData) {
    checkPageBreak(40); // Espaço para o cabeçalho do atleta

    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Atleta: ${athleteData.name} (${athleteData.category})`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Ocorrências do Atleta: ${athleteData.occurrences.length}`, margin, yPosition);
    yPosition += 8;
    const athleteTotalValue = athleteData.occurrences.reduce((sum, occ) => sum + Number(occ.VALOR), 0);
    doc.text(`Valor Total do Atleta: R$ ${athleteTotalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, margin, yPosition);
    yPosition += 15;

    // Ordenar e agrupar ocorrências por tipo (reutilizando a lógica do PDF individual)
    const sortedOccurrences = [...athleteData.occurrences].sort((a, b) => {
      const dateA = new Date(a.DATA);
      const dateB = new Date(b.DATA);
      return dateB.getTime() - dateA.getTime();
    });

    const groupedOccurrences: GroupedOccurrences = sortedOccurrences.reduce((acc, occ) => {
      const type = occ.TIPO || "Outras";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(occ);
      return acc;
    }, {} as GroupedOccurrences);

    Object.entries(groupedOccurrences).forEach(([type, typeOccurrences]) => {
      checkPageBreak(30); // Espaço para o título do tipo

      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${type} (${typeOccurrences.length})`, margin + 5, yPosition);
      yPosition += 10;

      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
      yPosition += 8;

      typeOccurrences.forEach((occurrence, index) => {
        const requiredSpace = calculateOccurrenceSpace(doc, occurrence, contentWidth, margin);
        checkPageBreak(requiredSpace);

        const dateObject = new Date(occurrence.DATA);
        const formattedDate = formatDate(dateObject);

        doc.setFontSize(10);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(`${index + 1}. Data: ${formattedDate}`, margin + 10, yPosition);

        const valueText = `Valor: R$ ${occurrence.VALOR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        const valueWidth = doc.getTextWidth(valueText);
        doc.text(valueText, pageWidth - margin - valueWidth - 5, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        const description = occurrence.OCORRÊNCIA;
        const maxLineWidth = contentWidth - 20;
        const lines = doc.splitTextToSize(description, maxLineWidth);

        lines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + 10, yPosition);
          yPosition += 4;
        });

        yPosition += 3;
      });
      yPosition += 8; // Espaço entre tipos
    });
    yPosition += 15; // Espaço entre atletas
  }

  // Adicionar footer personalizado em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addCustomFooter(i, totalPages);
  }

  const fileName = `Relatorio_Geral_${month.replace(/\s+/g, "_")}_${formatDateTime(new Date()).replace(/[\/\s:]/g, "_")}.pdf`;
  doc.save(fileName);
};

