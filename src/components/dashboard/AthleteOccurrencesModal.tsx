import React from 'react';
import { X, User, AlertCircle, DollarSign, FileText } from 'lucide-react';
import { AthleteOccurrence } from '../../data/athleteData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateAthletePDF, generateAthletePDFWithoutValues, formatDate } from '@/utils/pdfGenerator';

interface AthleteOccurrencesModalProps {
  athleteName: string;
  occurrences: AthleteOccurrence[];
  onClose: () => void;
  month: string;
  year: string;
}




export const AthleteOccurrencesModal: React.FC<AthleteOccurrencesModalProps> = ({
  athleteName,
  occurrences,
  onClose,
  month,
  year,
}) => {
  const initials = athleteName.split(' ').map(n => n[0]).join('').slice(0, 2);
  const firstOccurrence = occurrences[0];
  const fotoUrl = firstOccurrence?.fotoUrl;
  const categoryColors: { [key: string]: string } = {
    'Falta Escolar': '#f80c8eff',
    'Alimentação Irregular': '#740a8fff',
    'Uniforme': '#a6a8a5ff',
    'Desorganização': '#ee780aff',
    'Comportamento': '#FF0000',
    'Atrasos/Sair sem autorização': '#722710ff',
    'Outras': '#8B5CF6',
  };

  const getCategoryColor = (category: string) => categoryColors[category] || '#CCCCCC'; // Default gray
  
  // Calcular categorias de reincidência
  const categoryRecurrence = occurrences.reduce((acc, occ) => {
    const category = occ.TIPO || 'Outras';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  const category = firstOccurrence?.CAT || 'N/A';
  const totalValue = occurrences.reduce((sum, occ) => sum + Number(occ.VALOR), 0);

  const handleGeneratePDF = () => {
    try {
      generateAthletePDF(athleteName, category, occurrences, month, parseInt(year), month === 'Geral');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleGeneratePDFWithoutValues = () => {
    try {
      generateAthletePDFWithoutValues(athleteName, category, occurrences, month, parseInt(year));
    } catch (error) {
      console.error('Erro ao gerar PDF sem valores:', error);
      alert('Erro ao gerar PDF sem valores. Tente novamente.');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Ocorrências de {athleteName}
            <div className="mt-2 text-sm font-normal text-gray-600 flex flex-wrap gap-2">
              {Object.entries(categoryRecurrence).map(([cat, count]) => (
                <span key={cat} className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: getCategoryColor(cat), color: '#FFFFFF' }}>
                  {cat} {count}
                </span>
              ))}
            </div>
          </DialogTitle>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={handleGeneratePDF}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF Caixinha
            </Button>
            <Button
              onClick={handleGeneratePDFWithoutValues}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF Análise
            </Button>
            <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors">
              <X size={20} />
            </button>
          </div>
        </DialogHeader>
        {/* Cabeçalho com foto e informações do atleta */}
        <div className="bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-lg p-6 mb-4">
            <Avatar className="h-24 w-24 rounded-lg border-3 border-red-200">
              {fotoUrl ? (
                <AvatarImage 
                  src={fotoUrl} 
                  alt={`Foto de ${athleteName}`}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-red-100 text-red-700 font-bold text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{athleteName}</h2>
              <div className="flex items-center space-x-4 mb-3">
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  <User className="h-4 w-4 mr-1" />
                  {category}
                </Badge>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-gray-700">
                    {occurrences.length} ocorrência{occurrences.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">
                    Total: R$ {totalValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        
        {occurrences.length === 0 ? (
          <p className="text-gray-600">Nenhuma ocorrência encontrada para este atleta.</p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {occurrences.map((occurrence, index) => {
              const dateObject = new Date(occurrence.DATA);
              const formattedDate = formatDate(dateObject);

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-red-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500 font-medium">Data: {formattedDate}</p>
                    <span className="text-sm font-bold text-red-600">R$ {occurrence.VALOR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <p className="font-medium text-gray-900 leading-relaxed">{occurrence.OCORRÊNCIA}</p>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

