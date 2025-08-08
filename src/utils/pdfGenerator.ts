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
    if (true) {
      try {
        const img = new Image();
        img.src = "/servico_social_logo.png"; // Caminho relativo à raiz do projeto
        const logoHeight = 10;
        const logoWidth = (25.92 / 18) * logoHeight;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = footerY - 10 - (logoHeight / 2); // Centralizado com a linha vermelha passando pelo meio
        doc.addImage(img, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn("Erro ao adicionar logo no footer", error);
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

  let logoBase64 = `data:image/jpeg;base64,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`;
  // Carregar logo do serviço social
  // let logoBase64 = "";
  // try {
  //   logoBase64 = await getImageAsBase64("/servico_social_logo.png");
  // } catch (error) {
  //   console.warn("Não foi possível carregar o logo do serviço social");
  // }

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

    if (true) {
      try {
        const img = new Image();
        img.src = "/servico_social_logo.png"; // Caminho relativo à raiz do projeto
        const logoHeight = 10;
        const logoWidth = (25.92 / 18) * logoHeight;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = footerY - 10 - (logoHeight / 2); // Centralizado com a linha vermelha passando pelo meio
        doc.addImage(img, "PNG", logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.warn("Erro ao adicionar logo no footer", error);
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

