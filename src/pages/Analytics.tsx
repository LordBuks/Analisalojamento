import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Calendar, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { loadMonthlyData, getAvailableMonths, getMonthData } from '../data/dataLoader';
import { analyzeByAgeCategoryAndOccurrenceType } from '../utils/analysisUtils';
import { testOccurrences } from '../data/testData';
import { RecurrenceAthleteModal } from '../components/dashboard/RecurrenceAthleteModal';
import { CategoryDetailModal } from '../components/dashboard/CategoryDetailModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState("occurrences");
  const [selectedAgeCategory, setSelectedAgeCategory] = useState<string>("");
  const [selectedAgeCategoryOccurrenceType, setSelectedAgeCategoryOccurrenceType] = useState<string>("");
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");
  const [selectedBehavioralTrendOccurrenceType, setSelectedBehavioralTrendOccurrenceType] = useState<string>("");
  const [selectedRecurrenceType, setSelectedRecurrenceType] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const availableMonths = await getAvailableMonths();
        const data = await Promise.all(
          availableMonths.map(async (month: { month: string; year: number }) => {
            const monthData = await getMonthData(month.month, month.year);
            return { month: month.month, data: monthData };
          })
        );
        setMonthlyData(data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Dados para timeline
  const timelineData = useMemo(() => {
    return monthlyData.map(monthData => {
      const uniqueAthletes = new Set(monthData.data.map((occ: any) => occ.NOME));
      const totalValue = monthData.data.reduce((sum: number, occ: any) => sum + parseInt(occ.VALOR), 0);
      
      return {
        month: monthData.month,
        occurrences: monthData.data.length,
        athletes: uniqueAthletes.size,
        value: totalValue
      };
    }).sort((a, b) => {
      const monthOrder = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
  }, [monthlyData]);

  // Categorias de idade e tipos de ocorrência
  const ageCategories = useMemo(() => {
    const categories = new Set<string>();
    monthlyData.forEach(monthData => {
      monthData.data.forEach((occ: any) => {
        if (occ.CAT) categories.add(occ.CAT);
      });
    });
    return Array.from(categories).sort();
  }, [monthlyData]);

  const occurrenceTypes = useMemo(() => {
    const types = new Set<string>();
    monthlyData.forEach(monthData => {
      monthData.data.forEach((occ: any) => {
        if (occ.TIPO) types.add(occ.TIPO);
      });
    });
    return Array.from(types).sort();
  }, [monthlyData]);

  // Análise de reincidência
  const athleteOccurrences = useMemo(() => {
    const athleteMap = new Map();
    
    monthlyData.forEach(monthData => {
      monthData.data.forEach((occ: any) => {
        if (!athleteMap.has(occ.NOME)) {
          athleteMap.set(occ.NOME, new Set());
        }
        athleteMap.get(occ.NOME).add(monthData.month);
      });
    });

    return athleteMap;
  }, [monthlyData]);

  const recurrenceAnalysis = useMemo(() => {
    const recurrenceStats = { oneMonth: 0, twoMonths: 0, threeMonths: 0 };
    
    athleteOccurrences.forEach((months) => {
      const monthCount = months.size;
      if (monthCount === 1) recurrenceStats.oneMonth++;
      else if (monthCount === 2) recurrenceStats.twoMonths++;
      else if (monthCount >= 3) recurrenceStats.threeMonths++;
    });

    return [
      { name: '1 Mês', value: recurrenceStats.oneMonth, color: '#10B981' },
      { name: '2 Meses', value: recurrenceStats.twoMonths, color: '#F59E0B' },
      { name: '3+ Meses', value: recurrenceStats.threeMonths, color: '#EF4444' }
    ];
  }, [athleteOccurrences]);

  // Dados para o novo gráfico de comparação por categoria de idade e tipo de ocorrência
  const ageCategoryOccurrenceData = useMemo(() => {
    // Usando os dados de teste para simular a análise
    return analyzeByAgeCategoryAndOccurrenceType(testOccurrences);
  }, []);

  const filteredAgeCategoryOccurrenceData = useMemo(() => {
    if (!selectedAgeCategory || !selectedAgeCategoryOccurrenceType) {
      return [];
    }

    const filteredData = monthlyData.map(monthData => {
      const occurrencesInMonth = monthData.data.filter((occ: any) => 
        occ.CAT === selectedAgeCategory && occ.TIPO === selectedAgeCategoryOccurrenceType
      );
      return {
        month: monthData.month,
        count: occurrencesInMonth.length
      };
    }).sort((a, b) => {
      const monthOrder = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
    return filteredData;
  }, [monthlyData, selectedAgeCategory, selectedAgeCategoryOccurrenceType]);

  const filteredBehavioralTrendData = useMemo(() => {
    if (!selectedAthlete || !selectedBehavioralTrendOccurrenceType) {
      return [];
    }

    const athleteOccurrences = monthlyData.flatMap(monthData => 
      monthData.data.filter((occ: any) => 
        occ.NOME === selectedAthlete && occ.TIPO === selectedBehavioralTrendOccurrenceType
      ).map((occ: any) => ({ ...occ, month: monthData.month }))
    );

    const monthlyCounts = athleteOccurrences.reduce((acc, occ) => {
      acc[occ.month] = (acc[occ.month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthOrder = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return Object.keys(monthlyCounts).map(month => ({
      month,
      count: monthlyCounts[month]
    })).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

  }, [monthlyData, selectedAthlete, selectedBehavioralTrendOccurrenceType]);

  const allAthleteStats = useMemo(() => {
    const athleteStats = new Map();
    
    monthlyData.forEach(monthData => {
      monthData.data.forEach((occ: any) => {
        if (!athleteStats.has(occ.NOME)) {
          athleteStats.set(occ.NOME, {
            name: occ.NOME,
            category: occ.CAT,
            months: new Set(),
            totalOccurrences: 0,
            totalValue: 0
          });
        }
        
        const athlete = athleteStats.get(occ.NOME);
        athlete.months.add(monthData.month);
        athlete.totalOccurrences++;
        athlete.totalValue += parseInt(occ.VALOR);
      });
    });

    return Array.from(athleteStats.values());
  }, [monthlyData]);

  const topRecurrentAthletes = useMemo(() => {
    return allAthleteStats
      .filter((athlete: any) => athlete.months.size > 1)
      .sort((a: any, b: any) => b.months.size - a.months.size || b.totalOccurrences - a.totalOccurrences)
      .slice(0, 10);
  }, [allAthleteStats]);

  // Estatísticas comparativas
  const comparativeStats = useMemo(() => {
    if (timelineData.length < 2) return null;

    const current = timelineData[timelineData.length - 1];
    const previous = timelineData[timelineData.length - 2];

    return {
      occurrences: {
        current: current.occurrences,
        previous: previous.occurrences,
        change: ((current.occurrences - previous.occurrences) / previous.occurrences * 100).toFixed(1)
      },
      athletes: {
        current: current.athletes,
        previous: previous.athletes,
        change: ((current.athletes - previous.athletes) / previous.athletes * 100).toFixed(1)
      },
      value: {
        current: current.value,
        previous: previous.value,
        change: ((current.value - previous.value) / previous.value * 100).toFixed(1)
      }
    };
  }, [timelineData]);

  // *** CORREÇÃO APLICADA AQUI ***
  // A constante foi movida para dentro do componente, antes do return.
  const filteredRecurrenceAthletes = useMemo(() => {
    if (!selectedRecurrenceType) return [];

    return allAthleteStats.filter((athlete: any) => {
      if (selectedRecurrenceType === '1 Mês') {
        return athlete.months.size === 1;
      } else if (selectedRecurrenceType === '2 Meses') {
        return athlete.months.size === 2;
      } else if (selectedRecurrenceType === '3+ Meses') {
        return athlete.months.size >= 3;
      }
      return false;
    });
  }, [allAthleteStats, selectedRecurrenceType]);

  const handlePieClick = (data: any) => {
    setSelectedRecurrenceType(data.name);
  };

  const handleCloseRecurrenceModal = () => {
    setSelectedRecurrenceType(null);
  };

  const colors = ['#FFC0CB', '#FF6384', '#FFCE56', '#4BC0C0', '#FF0000', '#FF9F40', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">Análises Comparativas</h1>
          <p className="text-gray-600 font-bold">Insights e tendências ao longo dos meses</p>
        </div>

        {/* Cards de Comparação */}
        {comparativeStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Ocorrências</p>
                  <p className="text-2xl font-bold text-gray-600">{comparativeStats.occurrences.current}</p>
                </div>
                <div className={`flex items-center ${parseFloat(comparativeStats.occurrences.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(comparativeStats.occurrences.change) >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span className="text-sm font-medium">{Math.abs(parseFloat(comparativeStats.occurrences.change))}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-800 mt-2">vs. mês anterior: {comparativeStats.occurrences.previous}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Atletas com Ocorrências</p>
                  <p className="text-2xl font-bold text-gray-900">{comparativeStats.athletes.current}</p>
                </div>
                <div className={`flex items-center ${parseFloat(comparativeStats.athletes.change) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {parseFloat(comparativeStats.athletes.change) >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span className="text-sm font-medium">{Math.abs(parseFloat(comparativeStats.athletes.change))}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">vs. mês anterior: {comparativeStats.athletes.previous}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">R$ {comparativeStats.value.current.toLocaleString()}</p>
                </div>
                <div className={`flex items-center ${parseFloat(comparativeStats.value.change) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {parseFloat(comparativeStats.value.change) >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span className="text-sm font-medium">{Math.abs(parseFloat(comparativeStats.value.change))}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">vs. mês anterior: R$ {comparativeStats.value.previous.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Gráfico de Tendência Temporal */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-red-600 font-semibold">Tendência Temporal</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedMetric("occurrences")}
                className={`px-3 py-1 rounded text-sm ${selectedMetric === "occurrences" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Ocorrências
              </button>
              <button
                onClick={() => setSelectedMetric("athletes")}
                className={`px-3 py-1 rounded text-sm ${selectedMetric === "athletes" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Atletas
              </button>
              <button
                onClick={() => setSelectedMetric("value")}
                className={`px-3 py-1 rounded text-sm ${selectedMetric === "value" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Valor
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'value') return [`R$ ${value.toLocaleString()}`, 'Valor Total'];
                    return [value, name === 'athletes' ? 'Atletas' : 'Ocorrências'];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      
        {/* Gráficos lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Comparação por Categoria de Idade e Tipo de Ocorrência */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Comparação por Categoria e Tipo</h2>
            <div className="flex space-x-4 mb-4">
              <Select onValueChange={setSelectedAgeCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione a Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {ageCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setSelectedAgeCategoryOccurrenceType}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Selecione o Tipo de Ocorrência" />
                </SelectTrigger>
                <SelectContent>
                  {occurrenceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAgeCategory && selectedAgeCategoryOccurrenceType ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredAgeCategoryOccurrenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#EF4444" name="Quantidade de Ocorrências" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Selecione uma Categoria de Idade e um Tipo de Ocorrência para visualizar o gráfico.
              </div>
            )}
          </div>

          {/* Análise de Reincidência */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Análise de Reincidência</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recurrenceAnalysis}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    onClick={handlePieClick}
                  >
                    {recurrenceAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="text-sm text-gray-600 mt-4">
              <li><span className="inline-block w-3 h-3 rounded-full bg-green-600 mr-2"></span>1 Mês: Atletas com ocorrências em apenas um mês</li>
              <li><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>2 Meses: Atletas com ocorrências em dois meses</li>
              <li><span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-2"></span>3+ Meses: Atletas reincidentes (maior atenção)</li>
            </ul>
          </div>
        </div>

        {/* Nova seção para Top Atletas Reincidentes e Análise de Tendências Comportamentais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Atletas Reincidentes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Top 10 Atletas Reincidentes</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topRecurrentAthletes.map((athlete: any, index) => (
                <div key={athlete.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-red-600 mr-2">{index + 1}º</span>
                    <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center text-red-800 font-bold text-sm mr-2">
                      {athlete.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{athlete.name}</p>
                      <p className="text-xs text-gray-500">{athlete.months.size} meses • {athlete.totalOccurrences} ocorrências</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">R$ {athlete.totalValue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{athlete.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Análise de Tendências Comportamentais */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Tendências Comportamentais dos Top 10</h2>
            <div className="flex space-x-4 mb-4">
              <Select onValueChange={setSelectedAthlete}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o Atleta" />
                </SelectTrigger>
                <SelectContent>
                  {topRecurrentAthletes.map((athlete: any) => (
                    <SelectItem key={athlete.name} value={athlete.name}>{athlete.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setSelectedBehavioralTrendOccurrenceType}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Selecione o Tipo de Ocorrência" />
                </SelectTrigger>
                <SelectContent>
                  {occurrenceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAthlete && selectedBehavioralTrendOccurrenceType ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredBehavioralTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                      name="Quantidade de Ocorrências"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                Selecione um Atleta e um Tipo de Ocorrência para visualizar as tendências comportamentais.
              </div>
            )}
          </div>
        </div>

        {/* Modais */}
        {selectedRecurrenceType && (
          <RecurrenceAthleteModal
            isOpen={!!selectedRecurrenceType}
            onClose={handleCloseRecurrenceModal}
            recurrenceType={selectedRecurrenceType}
            athletes={filteredRecurrenceAthletes}
          />
        )}
      </div>
    </div>
  );
};

export default Analytics;
