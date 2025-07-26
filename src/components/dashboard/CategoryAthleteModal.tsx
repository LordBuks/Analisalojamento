import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AthleteOccurrence } from "@/data/athleteData";
import { useMemo, useState } from "react";
import { X, User, Calendar, AlertTriangle, Search } from "lucide-react";
import { AthleteOccurrencesModal } from "./AthleteOccurrencesModal";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CategoryAthleteModalProps {
  categoryName: string;
  occurrences: AthleteOccurrence[];
  onClose: () => void;
}

interface AthleteStats {
  name: string;
  category: string;
  totalOccurrences: number;
  totalValue: number;
  lastOccurrenceDate: string;
  fotoUrl?: string;
}

export function CategoryAthleteModal({ categoryName, occurrences, onClose }: CategoryAthleteModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthleteOccurrences, setSelectedAthleteOccurrences] = useState<AthleteOccurrence[] | null>(null);
  const [selectedAthleteName, setSelectedAthleteName] = useState<string | null>(null);

  const athletesInCategory = useMemo(() => {
    const athleteMap = new Map<string, AthleteStats>();
    
    occurrences.forEach(occ => {
      if (occ.TIPO === categoryName) {
        const key = occ.NOME;
        if (!athleteMap.has(key)) {
          athleteMap.set(key, {
            name: occ.NOME,
            category: occ.CAT,
            totalOccurrences: 0,
            totalValue: 0,
            lastOccurrenceDate: occ.DATA, // DATA já é um timestamp
            fotoUrl: occ.fotoUrl
          });
        }
        
        const athlete = athleteMap.get(key)!;
        athlete.totalOccurrences += 1;
        athlete.totalValue += Number(occ.VALOR); // Usar Number() para VALOR
        
        // Atualizar com a data mais recente (assumindo que DATA é um timestamp)
        if (occ.DATA > athlete.lastOccurrenceDate) {
          athlete.lastOccurrenceDate = occ.DATA;
        }
      }
    });

    return Array.from(athleteMap.values()).sort((a, b) => b.totalOccurrences - a.totalOccurrences);
  }, [categoryName, occurrences]);

  const filteredAthletes = useMemo(() => {
    return athletesInCategory.filter(athlete =>
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletesInCategory, searchTerm]);

  const formatDate = (timestamp: number): string => {
    const dateObject = new Date(timestamp);
    return isNaN(dateObject.getTime()) ? 'Data Inválida' : dateObject.toLocaleDateString("pt-BR");
  };

  const handleAthleteClick = (athleteName: string) => {
    const athleteAllOccurrences = occurrences.filter(occ => occ.NOME === athleteName);
    setSelectedAthleteOccurrences(athleteAllOccurrences);
    setSelectedAthleteName(athleteName);
  };

  const handleCloseAthleteOccurrencesModal = () => {
    setSelectedAthleteOccurrences(null);
    setSelectedAthleteName(null);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-xl font-bold text-red-600">
              Atletas com ocorrências por "{categoryName}"
            </DialogTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </DialogHeader>

          {/* Barra de busca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar atleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-red-100 focus:border-gray-300 focus:ring-gray-200"
            />
          </div>

          {/* Lista de atletas */}
          <div className="flex-1 overflow-y-auto pr-2">
            {filteredAthletes.length > 0 ? (
              <div className="space-y-4">
                {filteredAthletes.map((athlete, index) => {
                  const initials = athlete.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                  
                  return (
                    <Card 
                      key={index}
                      className="transition-all duration-300 group bg-white border border-red-100 hover:border-red-200 hover:shadow-lg cursor-pointer"
                      onClick={() => handleAthleteClick(athlete.name)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 8px 32px rgba(229, 5, 15, 0.15)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12 border-2 border-red-100 group-hover:border-red-200 transition-colors">
                            {athlete.fotoUrl ? (
                              <img src={athlete.fotoUrl} alt={`Foto de ${athlete.name}`} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-red-50 text-red-700 font-bold group-hover:bg-red-100 transition-colors">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-red-700 transition-colors">
                              {athlete.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                variant="secondary" 
                                className="text-xs bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                              >
                                <User className="h-3 w-3 mr-1" />
                                {athlete.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-2">
                            <div className="flex items-center justify-end space-x-1">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-xl font-bold text-red-600">
                                {athlete.totalOccurrences}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              Total de Ocorrências
                            </div>
                            
                            <div className="text-sm font-bold text-gray-700">
                              R$ {athlete.totalValue.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              Valor Total
                            </div>
                            
                            <div className="flex items-center justify-end space-x-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(athlete.lastOccurrenceDate)}</span>
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              Última Ocorrência
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  {searchTerm 
                    ? "Nenhum atleta encontrado com o termo de busca." 
                    : `Nenhum atleta encontrado para a categoria "${categoryName}".`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Rodapé com estatísticas */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                {filteredAthletes.length} atleta{filteredAthletes.length !== 1 ? 's' : ''}
                {searchTerm && ` encontrado${filteredAthletes.length !== 1 ? 's' : ''}`}
              </span>
              <span>
                Categoria: {categoryName}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedAthleteOccurrences && selectedAthleteName && (
        <AthleteOccurrencesModal
          athleteName={selectedAthleteName}
          occurrences={selectedAthleteOccurrences}
          onClose={handleCloseAthleteOccurrencesModal}
        />
      )}
    </>
  );
}


