import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/coimport React, { useState, useEffect, useMemo } from 'react';
import { Users, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import OccurrenceChart from '../components/dashboard/OccurrenceChart';
import AthleteModal from '../components/dashboard/AthleteModal';
import CategoryAthleteModal from '../components/dashboard/CategoryAthleteModal';
import MonthSelector from '../components/MonthSelector';
import { getAllOccurrences, getMonthData, getAvailableMonths } from '../data/dataLoader';
import { AthleteOccurrence, extractSchool, categorizeOccurrence } from '../data/athleteData';
import { 
  Users, 
  AlertTriangle, 
  DollarSign, 
  GraduationCap,
  Search,
  Filter,
  TrendingUp,
  Shield,
  BarChart3,
  PieChart
} from "lucide-react";

const Index = () => {
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Processar dados dos atletas
  const athleteStats = useMemo(() => {
    const stats = new Map();
    
    athleteOccurrences.forEach(occ => {
      const key = occ.NOME;
      if (!stats.has(key)) {
        stats.set(key, {
          name: occ.NOME,
          category: occ.Cat,
          occurrences: [],
          totalValue: 0,
          occurrenceCount: 0
        });
      }
      
      const athlete = stats.get(key);
      athlete.occurrences.push(occ);
      athlete.totalValue += parseInt(occ.Valor);
      athlete.occurrenceCount += 1;
    });
    
    return Array.from(stats.values())
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }, []);

  // Filtrar atletas
  const filteredAthletes = useMemo(() => {
    return athleteStats.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || athlete.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [athleteStats, searchTerm, categoryFilter]);

  // Estatísticas gerais
  const totalOccurrences = athleteOccurrences.length;
  const totalAthletes = athleteStats.length;
  const totalValue = athleteOccurrences.reduce((sum, occ) => sum + parseInt(occ.Valor), 0);
  const averagePerAthlete = Math.round(totalValue / totalAthletes);

  // Dados para gráficos
  const occurrenceByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    athleteOccurrences.forEach(occ => {
      const category = categorizeOccurrence(occ.OCORRÊNCIA);
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const schoolStats = useMemo(() => {
    const schools: Record<string, number> = {};
    athleteOccurrences.forEach(occ => {
      const school = extractSchool(occ.OCORRÊNCIA);
      // Filtrar apenas as escolas especificadas, removendo "Alojamento"
      if (school !== "Alojamento") {
        schools[school] = (schools[school] || 0) + 1;
      }
    });
    
    return Object.entries(schools)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const categoryStats = useMemo(() => {
    const categories: Record<string, number> = {};
    athleteStats.forEach(athlete => {
      categories[athlete.category] = (categories[athlete.category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [athleteStats]);

  const categories = [...new Set(athleteStats.map(athlete => athlete.category))];

  // Handlers para os modais
  const handleSchoolClick = (schoolName: string) => {
    setSelectedSchool(schoolName);
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleAthleteClickFromModal = (athleteName: string) => {
    setSelectedSchool(null); // Fecha o modal de escola
    setSelectedCategory(null); // Fecha o modal de categoria
    setSelectedAthlete(athleteName); // Abre o perfil do atleta
  };

  return (
    <div className="min-h-screen inter-gradient-bg">
      {/* Header com Logo do Internacional */}
      <div className="px-6 py-4 mb-8 bg-white shadow-md rounded-b-lg">
        <div className="flex items-center space-x-4">
          <img 
            src="/inter-logo.png" 
            alt="Sport Club Internacional" 
            className="h-12 w-12 object-contain"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-red-600 flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <span>Controle Disciplinar Alojamento</span>
            </h1>
            <p className="inter-text-secondary mt-1">
              Monitoramento e análise de ocorrências disciplinares dos atletas alojados
            </p>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Atletas"
            value={totalAthletes}
            icon={Users}
            description="Atletas com ocorrências"
            className="inter-card animate-fade-in"
          />
          <StatCard
            title="Total de Ocorrências"
            value={totalOccurrences}
            icon={AlertTriangle}
            description="Registradas no período"
            className="inter-card animate-fade-in"
          />
          <StatCard
            title="Valor Total"
            value={`R$ ${totalValue.toLocaleString()}`}
            icon={DollarSign}
            description="Em multas aplicadas"
            className="inter-card animate-fade-in"
          />
          <StatCard
            title="Média por Atleta"
            value={`R$ ${averagePerAthlete}`}
            icon={TrendingUp}
            description="Valor médio de multas"
            className="inter-card animate-fade-in"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="inter-card-float animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <PieChart className="h-5 w-5" />
                <span>Tipos de ocorrências</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OccurrenceChart
                data={occurrenceByCategory}
                title="Ocorrências por Categoria"
                type="pie"
                onPieClick={handleCategoryClick}
              />
            </CardContent>
          </Card>
          
          <Card className="inter-card-float animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <BarChart3 className="h-5 w-5" />
                <span>Faltas Escolares</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OccurrenceChart
                data={schoolStats}
                title="Ocorrências por Local/Escola"
                type="bar"
                onBarClick={handleSchoolClick}
              />
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Lista de Atletas */}
        <Card className="inter-card-float animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <GraduationCap className="h-6 w-6" />
              <span>Ranking de Atletas</span>
            </CardTitle>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 inter-text-secondary" />
                <Input
                  placeholder="Buscar atleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-gray-200 focus:ring-gray-200"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 border-gray-200 focus:border-gray-200 focus:ring-gray-200">
                  <Filter className="h-4 w-4 mr-2 inter-text-secondary" />
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAthletes.map((athlete, index) => (
                <AthleteCard
                  key={athlete.name}
                  name={athlete.name}
                  category={athlete.category}
                  occurrenceCount={athlete.occurrenceCount}
                  totalValue={athlete.totalValue}
                  isSelected={selectedAthlete === athlete.name}
                  onClick={() => setSelectedAthlete(athlete.name)}
                  className="inter-hover-effect"
                />
              ))}
            </div>
            
            {filteredAthletes.length === 0 && (
              <div className="text-center py-12 inter-text-secondary">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum atleta encontrado com os filtros aplicados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Modal */}
      {selectedAthlete && (
        <AthleteProfile
          athleteName={selectedAthlete}
          onClose={() => setSelectedAthlete(null)}
        />
      )}

      {/* School Athletes Modal */}
      {selectedSchool && (
        <AthleteListModal
          schoolName={selectedSchool}
          onClose={() => setSelectedSchool(null)}
          onAthleteClick={handleAthleteClickFromModal}
        />
      )}

      {/* Category Athletes Modal */}
      {selectedCategory && (
        <CategoryAthleteModal
          categoryName={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onAthleteClick={handleAthleteClickFromModal}
        />
      )}
    </div>
  );
};

export default Index;

