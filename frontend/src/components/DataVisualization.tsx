import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface DataVisualizationProps {
  data: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const DataVisualization: React.FC<DataVisualizationProps> = ({ data }) => {
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'pie'>('bar');

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Detect numeric and string columns
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    const numericKeys = keys.filter(key => {
      const value = firstRow[key];
      return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
    });

    const stringKeys = keys.filter(key => {
      const value = firstRow[key];
      return typeof value === 'string' && isNaN(parseFloat(value));
    });

    // Need at least one string (label) and one numeric (value) column
    if (numericKeys.length === 0 || stringKeys.length === 0) {
      return null;
    }

    // Use first string column as label, first numeric as value
    const labelKey = stringKeys[0];
    const valueKeys = numericKeys.slice(0, 3); // Up to 3 numeric columns

    // Transform data for charts
    return {
      data: data.slice(0, 20).map(row => {
        const transformed: any = { name: String(row[labelKey]) };
        valueKeys.forEach(key => {
          transformed[key] = parseFloat(row[key]);
        });
        return transformed;
      }),
      labelKey,
      valueKeys,
    };
  }, [data]);

  if (!chartData) {
    return null;
  }

  const { data: chartDataArray, valueKeys } = chartData;

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Visualization</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded ${
              chartType === 'bar'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Bar Chart"
          >
            <BarChart3 size={20} />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded ${
              chartType === 'line'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Line Chart"
          >
            <LineChartIcon size={20} />
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded ${
              chartType === 'pie'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Pie Chart"
          >
            <PieChartIcon size={20} />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'bar' && (
          <BarChart data={chartDataArray}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {valueKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        )}
        {chartType === 'line' && (
          <LineChart data={chartDataArray}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {valueKeys.map((key, index) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} />
            ))}
          </LineChart>
        )}
        {chartType === 'pie' && (
          <PieChart>
            <Pie
              data={chartDataArray}
              dataKey={valueKeys[0]}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {chartDataArray.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Showing {valueKeys.join(', ')} by category. Limited to first 20 rows.
      </p>
    </div>
  );
};

export default DataVisualization;
