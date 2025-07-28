import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface OccurrenceChartProps {
  data: ChartData[];
  title: string;
  type: "bar" | "pie";
  onBarClick?: (schoolName: string) => void;
  onPieClick?: (categoryName: string) => void;
}

// Paleta de cores completamente distintas para o gráfico de pizza
const INTER_COLORS = [
  '#f80c8eff',
  '#740a8fff',
  '#a6a8a5ff',
  '#ee780aff',
  '#FF0000',
  '#722710ff',
  '#8B5CF6'
];

export function OccurrenceChart({ data, title, type, onBarClick, onPieClick }: OccurrenceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-red-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-red-600 font-bold">
            {`Ocorrências: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 border border-red-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-red-600 font-bold">
            {`${data.value} ocorrências`}
          </p>
          <p className="text-gray-600 text-sm">
            {`${((data.value / data.payload.total) * 100).toFixed(1)}% do total`}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any) => {
    if (onBarClick && data && data.name) {
      onBarClick(data.name);
    }
  };

  const handlePieClick = (data: any) => {
    if (onPieClick && data && data.name) {
      onPieClick(data.name);
    }
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart 
        data={data} 
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        onClick={handleBarClick}
      >
        <defs>
          <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E5050F" stopOpacity={1}/>
            <stop offset="100%" stopColor="#C20C18" stopOpacity={0.8}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#F1F5F9" 
          strokeOpacity={0.6}
        />
        <XAxis 
          dataKey="name" 
          stroke="#374151"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fill: '#374151' }}
        />
        <YAxis 
          stroke="#374151" 
          fontSize={12}
          tick={{ fill: '#374151' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="value" 
          fill="url(#redGradient)"
          radius={[6, 6, 0, 0]}
          stroke="#E5050F"
          strokeWidth={1}
          cursor="pointer"
          onClick={handleBarClick}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    // Calcular total para percentuais
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const dataWithTotal = data.map(item => ({ ...item, total }));

    return (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => 
              percent > 0.01 ? `${name} (${(percent * 100).toFixed(1)}%)` : ''
            }
            outerRadius={100}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            onClick={handlePieClick}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={INTER_COLORS[index % INTER_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
              color: '#374151'
            }}
            iconType="rect"
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="w-full">
      {type === "bar" ? renderBarChart() : renderPieChart()}
    </div>
  );
}

