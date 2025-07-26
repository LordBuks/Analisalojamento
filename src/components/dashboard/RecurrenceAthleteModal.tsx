import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, User, AlertTriangle, Calendar } from "lucide-react";
import { AthleteOccurrence } from "@/data/athleteData";
import { AthleteOccurrencesModal } from "./AthleteOccurrencesModal";

interface RecurrenceAthleteModalProps {
  isOpen: boolean;
  recurrenceType: string;
  athletes: {
    name: string;
    category: string;
    totalOccurrences: number;
    totalValue: number;
    months: Set<string>;
    occurrences: AthleteOccurrence[];
  }[];
  onClose: () => void;
}

export function RecurrenceAthleteModal({ recurrenceType, athletes, onClose }: RecurrenceAthleteModalProps) {
  const [selectedAthleteOccurrences, setSelectedAthleteOccurrences] = useState<AthleteOccurrence[] | null>(null);
  const [selectedAthleteName, setSelectedAthleteName] = useState<string | null>(null);

  const sortedAthletes = useMemo(() => {
    // Ensure athletes is an array before sorting
    if (!Array.isArray(athletes)) {
      console.error("Expected 'athletes' to be an array, but received:", athletes);
      return [];
    }
    return [...athletes].sort((a, b) => b.totalOccurrences - a.totalOccurrences);
  }, [athletes]);

  const formatDate = (timestamp: number): string => {
    const dateObject = new Date(timestamp);
    return isNaN(dateObject.getTime()) ? 'Data Inválida' : dateObject.toLocaleDateString("pt-BR");
  };

  const handleAthleteClick = (athleteName: string, athleteOccurrences: AthleteOccurrence[]) => {
    setSelectedAthleteOccurrences(athleteOccurrences);
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
              Atletas com Reincidência: {recurrenceType}
            </DialogTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {sortedAthletes.length > 0 ? (
              <div className="space-y-4">
                {sortedAthletes.map((athlete, index) => {
                  const initials = athlete.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                  
                  // Encontrar a última ocorrência para exibir a data
                  const lastOccurrence = athlete.occurrences && athlete.occurrences.length > 0 
                    ? athlete.occurrences.reduce((latest, current) => {
                        return (current.DATA > latest.DATA) ? current : latest;
                      }, athlete.occurrences[0])
                    : null;

                  return (
                    <Card 
                      key={index}
                      className="transition-all duration-300 group bg-white border border-red-100 hover:border-red-200 hover:shadow-lg cursor-pointer"
                      onClick={() => handleAthleteClick(athlete.name, athlete.occurrences)}
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
                              Ocorrências
                            </div>
                            
                            <div className="flex items-center justify-end space-x-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{lastOccurrence ? formatDate(lastOccurrence.DATA) : 'N/A'}</span>
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
                <p className="text-lg">
                  Nenhum atleta encontrado para esta categoria de reincidência.
                </p>
              </div>
            )}
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

