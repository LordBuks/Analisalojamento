import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Calendar, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { loadMonthlyData, getAvailableMonths } from '../data/dataLoader';
import { analyzeByAgeCategoryAndOccurrenceType } from '../utils/analysisUtils';
import { testOccurrences } from '../data/testData';
import { RecurrenceAthleteModal } from '../components/dashboard/RecurrenceAthleteModal';
import { CategoryDetailModal } from '../components/dashboard/CategoryDetailModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Analytics = () => {
  const ageCategories = ['Sub-14', 'Sub-15', 'Sub-16', 'Sub-17', 'Sub-20'];
  const occurrenceTypes = [
    'Falta Escolar',
    'Alimentação Irregular',
    'Uniforme',
    'Desorganização',
    'Comportamento',
    'Atrasos/Sair sem autorização',
    'Outras'
  ];

  const [selectedAgeCategory, setSelectedAgeCategory] = useState<string | null>(null);
  const [selectedOccurrenceType, setSelectedOccurrenceType] = useState<string | null>(null);

  const categories = [
    { name: 'Falta Escolar', color: '#FFC0CB' },
    { name: 'Alimentação Irregular', color: '#36A2EB' },
    { name: 'Uniforme', color: '#FFCE56' },
    { name: 'Desorganização', color: '#4BC0C0' },
    { name: 'Comportamento', color: '#FF0000' },
    { name: 'Atrasos/Sair sem autorização', color: '#FF9F40' },
    { name: 'Outras', color: '#8B5CF6' }
  ];

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'occurrences' | 'athletes' | 'value'>('occurrences');
  const [selectedRecurrenceType, setSelectedRecurrenceType] = useState<string | null>(null);
  const [categoryDetailModal, setCategoryDetailModal] = useState<{ isOpen: boolean; category: string; month: string; count: number; color: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await loadMonthlyData();
        setMonthlyData(data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Dados para gráfico de tendência temporal
  const timelineData = useMemo(() => {
    return monthlyData.map(monthData => {
      const uniqueAthletes = new Set(monthData.data.map(occ => occ.NOME)).size;
      const totalOccurrences = monthData.data.length;
      const totalValue = monthData.data.reduce((sum, occ) => sum + parseInt(occ.VALOR), 0);

      return {
        month: monthData.month,
        athletes: uniqueAthletes,
        occurrences: totalOccurrences,
        value: totalValue,
        averagePerAthlete: uniqueAthletes > 0 ? (totalValue / uniqueAthletes) : 0
      };
    }).reverse();
  }, [monthlyData]);

  // Análise de reincidência
  const athleteOccurrences = useMemo(() => {
    const map = new Map();
    monthlyData.forEach(monthData => {
      monthData.data.forEach(occ => {
        if (!map.has(occ.NOME)) {
          map.set(occ.NOME, new Set());
        }
        map.get(occ.NOME).add(monthData.month);
      });
    });
    return map;
  }, [monthlyData]);

  const recurrenceAnalysis = useMemo(() => {
    const recurrenceStats = {
      oneMonth: 0,
      twoMonths: 0,
      threeMonths: 0
    };

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
    if (!selectedAgeCategory || !selectedOccurrenceType) {
      return [];
    }

    const filteredData = monthlyData.map(monthData => {
      const occurrencesInMonth = monthData.data.filter(occ => 
        occ.CAT === selectedAgeCategory && occ.TIPO === selectedOccurrenceType
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
  }, [monthlyData, selectedAgeCategory, selectedOccurrenceType]);

  const topRecurrentAthletes = useMemo(() => {
    const athleteStats = new Map();
    
    monthlyData.forEach(monthData => {
      monthData.data.forEach(occ => {
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

    return Array.from(athleteStats.values())
      .filter(athlete => athlete.months.size > 1)
      .sort((a, b) => b.months.size - a.months.size || b.totalOccurrences - a.totalOccurrences)
      .slice(0, 10);
  }, [monthlyData]);

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

  const handlePieClick = (data: any) => {
    setSelectedRecurrenceType(data.name);
  };

  const handleCloseRecurrenceModal = () => {
    setSelectedRecurrenceType(null);
  };

  const colors = ['#FFC0CB', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF0000', '#FF9F40', '#8B5CF6'];

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
          {/* Nova seção para Análise por Categoria de Idade e Tipo de Ocorrência */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Análise por Categoria de Idade e Tipo de Ocorrência</h2>
            <div className="flex space-x-4 mb-4">
              <Select onValueChange={setSelectedAgeCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione a Categoria de Idade" />
                </SelectTrigger>
                <SelectContent>
                  {ageCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setSelectedOccurrenceType}>
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

            {selectedAgeCategory && selectedOccurrenceType ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredAgeCategoryOccurrenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Quantidade de Ocorrências" />
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
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>• <span className="font-bold text-green-800">1 Mês:</span> Atletas com ocorrências em apenas um mês</p>
              <p>• <span className="font-bold text-orange-600">2 Meses:</span> Atletas com ocorrências em dois meses</p>
              <p>• <span className="font-bold text-red-600">3+ Meses:</span> Atletas reincidentes (maior atenção)</p>
            </div>
          </div>

          {/* Top Atletas Reincidentes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl text-red-600 font-semibold mb-4">Top Atletas Reincidentes</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topRecurrentAthletes.map((athlete, index) => {
                const athleteOccurrence = monthlyData
                  .flatMap(monthData => monthData.data)
                  .find(occ => occ.NOME === athlete.name);
                const fotoUrl = athleteOccurrence?.fotoUrl;
                const initials = athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2);

                return (
                  <div key={athlete.name} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-gray-700 w-6">{index + 1}º</span>
                        <div className="relative">
                          {fotoUrl ? (
                          <img 
                              src={fotoUrl} 
                              alt={`Foto de ${athlete.name}`}
                              className="w-14 h-14 rounded-lg object-cover border-2 border-red-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-red-100 border-2 border-red-200 flex items-center justify-center">
                              <span className="text-red-700 font-bold text-sm">{initials}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{athlete.name}</span>
                          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {athlete.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {athlete.months.size} meses • {athlete.totalOccurrences} ocorrências
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">R$ {athlete.totalValue.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{athlete.totalValue > 0 ? `R$ ${(athlete.totalValue / athlete.totalOccurrences).toFixed(2)}/ocorrência` : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedRecurrenceType && (
          <RecurrenceAthleteModal
            isOpen={!!selectedRecurrenceType}
            onClose={handleCloseRecurrenceModal}
            recurrenceType={selectedRecurrenceType}
            athleteOccurrences={athleteOccurrences}
          />
        )}

        {categoryDetailModal && (
          <CategoryDetailModal
            isOpen={categoryDetailModal.isOpen}
            onClose={() => setCategoryDetailModal(null)}
            category={categoryDetailModal.category}
            month={categoryDetailModal.month}
            count={categoryDetailModal.count}
            color={categoryDetailModal.color}
          />
        )}
      </div>
    </div>
  );
};

export default Analytics;


