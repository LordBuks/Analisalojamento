import React from 'react';

interface MonthSelectorProps {
  availableMonths: { month: string; year: number }[];
  selectedMonth: string | null;
  selectedYear: number | null;
  onMonthChange: (month: string, year: number) => void;
  showAllOption?: boolean;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
  availableMonths,
  selectedMonth,
  selectedYear,
  onMonthChange,
  showAllOption = true
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'all') {
      onMonthChange('all', 0);
    } else {
      const [month, year] = value.split('-');
      onMonthChange(month, parseInt(year));
    }
  };

  const currentValue = selectedMonth === 'all' ? 'all' : `${selectedMonth}-${selectedYear}`;

  return (
    <div className="mb-6">
      <label htmlFor="month-selector" className="block text-sm font-medium text-red-600 mb-2">
        Selecionar Período:
      </label>
      <select
        id="month-selector"
        value={currentValue}
        onChange={handleChange}
        className="block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
      >
        {showAllOption && (
          <option value="all">Todos os Meses</option>
        )}
        {availableMonths.map(({ month, year }) => (
          <option key={`${month}-${year}`} value={`${month}-${year}`}>
            {month} {year}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MonthSelector;

