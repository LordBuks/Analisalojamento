import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { OccurrenceChart } from '../components/dashboard/OccurrenceChart';
import { AthleteListModal } from '../components/dashboard/AthleteListModal';
import { CategoryAthleteModal } from '../components/dashboard/CategoryAthleteModal';
import { AthleteOccurrencesModal } from '../components/dashboard/AthleteOccurrencesModal'; // Importar o novo modal
import MonthSelector from '../components/MonthSelector';
import DataLoader from '../components/DataLoader'; // Importar o DataLoader
import { useAuth } from '../hooks/useAuth'; // Importar o hook de autenticação
import { getAllOccurrences, getMonthData, getAvailableMonths } from '../data/dataLoader';
import { AthleteOccurrence } from '../data/athleteData';
import { generateAthletePDF, generateGeneralPDF } from '../utils/pdfGenerator';
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth(); // Obter informações do usuário autenticado
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAthleteForOccurrences, setSelectedAthleteForOccurrences] = useState<string | null>(null); // Novo estado para o modal de ocorrências do atleta

  // Estados para o sistema de meses
  const [availableMonths, setAvailableMonths] = useState<{month: string, year: number}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [currentData, setCurrentData] = useState<AthleteOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar meses disponíveis e dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const months = await getAvailableMonths();
        setAvailableMonths(months);
        
        // Carregar todos os dados inicialmente
        const allData = await getAllOccurrences();
        setCurrentData(allData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Atualizar dados quando o mês selecionado mudar
  useEffect(() => {
    const loadMonthData = async () => {
      if (selectedMonth === 'all') {
        const allData = await getAllOccurrences();
        setCurrentData(allData);
      } else {
        const monthData = await getMonthData(selectedMonth, selectedYear);
        setCurrentData(monthData);
      }
    };

    if (availableMonths.length > 0) {
      loadMonthData();
    }
  }, [selectedMonth, selectedYear, availableMonths]);

  // Processar dados dos atletas
  const athleteStats = useMemo(() => {
    const stats = new Map();
    
    currentData.forEach(occ => {
      const key = occ.NOME;
      if (!stats.has(key)) {
        stats.set(key, {
          name: occ.NOME,
          category: occ.CAT,
          occurrences: [],
          totalValue: 0,
          occurrenceCount: 0
        });
      }
      
      const athlete = stats.get(key);
      athlete.occurrences.push(occ);
      athlete.totalValue += Number(occ.VALOR) || 0;
      athlete.occurrenceCount += 1;
    });
    
    return Array.from(stats.values()).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }, [currentData]);

  // Estatísticas gerais
  const totalAthletes = athleteStats.length;
  const totalOccurrences = currentData.length;
  const totalValue = useMemo(() => {
    return currentData.reduce((sum, occ) => sum + (Number(occ.VALOR) || 0), 0);
  }, [currentData]);
  const averagePerAthlete = totalAthletes > 0 ? (totalValue / totalAthletes).toFixed(2) : "0";

  // Dados para gráfico de pizza (tipos de ocorrência)
  const occurrenceTypes = useMemo(() => {
    const types = new Map();
    currentData.forEach(occ => {
      const category = occ.TIPO;
      types.set(category, (types.get(category) || 0) + 1);
    });
    
    return Array.from(types.entries()).map(([name, value]) => ({ name, value }));
  }, [currentData]);

  // Dados para gráfico de barras (faltas escolares)
  const schoolAbsences = useMemo(() => {
    const schools = new Map();
    currentData
      .filter(occ => occ.TIPO === "Falta Escolar")
      .forEach(occ => {
        let school = "Alojamento";
        if (occ.OCORRÊNCIA.includes("Gentil")) school = "Escola Gentil";
        else if (occ.OCORRÊNCIA.includes("Julio Cesar")) school = "Escola Julio Cesar";
        else if (occ.OCORRÊNCIA.includes("Padre Léo")) school = "Escola Padre Léo";
        else if (occ.OCORRÊNCIA.includes("Juliano Nascimento")) school = "Escola Juliano Nascimento";
        
        schools.set(school, (schools.get(school) || 0) + 1);
      });
    
    return Array.from(schools.entries()).map(([name, value]) => ({ name, value }));
  }, [currentData]);

  // Filtros
  const filteredAthletes = useMemo(() => {
    return athleteStats.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || athlete.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [athleteStats, searchTerm, categoryFilter]);

  const handleAthleteClick = (athleteName: string) => {
    setSelectedAthleteForOccurrences(athleteName); // Abre o modal de ocorrências do atleta
  };

  const handleSchoolClick = (schoolName: string) => {
    setSelectedSchool(schoolName);
  };

  const handlePieClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  // Função para gerar PDF geral
  const handleGenerateGeneralPDF = async () => {
    try {
      // Preparar dados dos atletas para o PDF
      const allAthletesData = athleteStats.map(athlete => ({
        name: athlete.name,
        category: athlete.category,
        occurrences: athlete.occurrences
      }));

      const monthName = selectedMonth === 'all' ? 'Geral' : selectedMonth;
      
      await generateGeneralPDF(
        monthName,
        totalAthletes,
        totalOccurrences,
        totalValue,
        allAthletesData
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  };

  const handleMonthChange = (month: string, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl text-red-600 font-bold text-gray-900 mb-2">Análise Disciplinar do Alojamento</h1>
          <p className="text-gray-600 text-l font-bold">Monitoramento dos atletas alojados</p>
        </div>

        {/* Seletor de Mês */}
        <MonthSelector
          availableMonths={availableMonths}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
        />

        {/* Componente para carregar dados do Firebase - Apenas para Administradores */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <DataLoader />
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={<span className="text-bold text-red-600">Atletas com ocorrências</span>}
            value={totalAthletes.toString()}
            icon={Users}
            color="red"
          />
          <StatCard
            title={<span className="text-bold text-red-600">Total de Ocorrências</span>}
            value={totalOccurrences.toString()}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title={<span className="text-bold text-red-600">Valor Total</span>}
            value={`R$ ${totalValue.toLocaleString()}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title={<span className="text-bold text-red-600">Média por Atleta</span>}
            value={`R$ ${averagePerAthlete}`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Botão Gerar PDF Geral */}
        <div className="mb-8">
          <Button 
            onClick={handleGenerateGeneralPDF}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Gerar PDF Geral
          </Button>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Tipos de Ocorrências</h2>
            <OccurrenceChart 
              data={occurrenceTypes} 
              title="Tipos de Ocorrências"
              type="pie"
              onPieClick={handlePieClick} 
            />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Faltas Escolares</h2>
            <OccurrenceChart 
              data={schoolAbsences} 
              title="Faltas Escolares por Escola"
              type="bar"
              onBarClick={handleSchoolClick}
            />
          </div>
        </div>

        {/* Lista de Atletas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Ranking de Atletas</h2>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar atleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Todas as categorias</option>
                  <option value="Sub-14">Sub-14</option>
                  <option value="Sub-15">Sub-15</option>
                  <option value="Sub-16">Sub-16</option>
                  <option value="Sub-17">Sub-17</option>
                  <option value="Sub-20">Sub-20</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Posição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Atleta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Ocorrências
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Valor Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAthletes.map((athlete, index) => (
                  <tr
                    key={athlete.name}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAthleteClick(athlete.name)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                      {index + 1}º
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-14 w-14 rounded-lg border-2 border-gray-300">
                          {athlete.fotoUrl ? (
                            <AvatarImage 
                              src={athlete.fotoUrl} 
                              alt={`Foto de ${athlete.name}`}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-red-50 text-red-700 font-bold text-lg">
                              {athlete.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{athlete.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {athlete.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {athlete.occurrenceCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-bold">
                      R$ {athlete.totalValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAthletes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum atleta encontrado com os filtros aplicados.
            </div>
          )}
        </div>

        {/* Modais */}
        {selectedAthleteForOccurrences && (
          <AthleteOccurrencesModal
            athleteName={selectedAthleteForOccurrences}
            occurrences={currentData.filter(occ => occ.NOME === selectedAthleteForOccurrences)}
            onClose={() => setSelectedAthleteForOccurrences(null)}
            month={selectedMonth === 'all' ? 'Geral' : selectedMonth}
            year={selectedMonth === 'all' ? '2025' : selectedYear.toString()}
          />
        )}

        {selectedSchool && (
          <AthleteListModal
            athleteName={`Atletas da ${selectedSchool}`}
            occurrences={currentData.filter(occ => {
              if (occ.TIPO !== "Falta Escolar") return false;
              let school = "Alojamento";
              if (occ.OCORRÊNCIA.includes("Gentil")) school = "Escola Gentil";
              else if (occ.OCORRÊNCIA.includes("Julio Cesar")) school = "Escola Julio Cesar";
              else if (occ.OCORRÊNCIA.includes("Padre Léo")) school = "Escola Padre Léo";
        else if (occ.OCORRÊNCIA.includes("Juliano Nascimento")) school = "Escola Juliano Nascimento";
              return school === selectedSchool;
            })}
            onClose={() => setSelectedSchool(null)}
            month={selectedMonth === 'all' ? 'Geral' : selectedMonth}
            year={selectedMonth === 'all' ? '2025' : selectedYear}
          />
        )}

        {selectedCategory && (
          <CategoryAthleteModal
            categoryName={selectedCategory}
            occurrences={currentData.filter(occ => occ.TIPO === selectedCategory)}
            onClose={() => setSelectedCategory(null)}
            month={selectedMonth === 'all' ? 'Geral' : selectedMonth}
            year={selectedMonth === 'all' ? '2025' : selectedYear}
          />
        )}
      </div>
    </div>
  );
};

export default Index;


