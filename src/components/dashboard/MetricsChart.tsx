import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// Ensure line and bar controllers are available by importing them
import { LineController, BarController } from 'chart.js';
ChartJS.register(LineController, BarController);

interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

interface MetricsChartProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'line' | 'bar';
  showLegend?: boolean;
  color?: string;
  height?: number;
}

export default function MetricsChart({ 
  title, 
  data, 
  type = 'line', 
  showLegend = true,
  color = '#3B82F6',
  height = 300
}: MetricsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1h');

  const periods = [
    { label: '1H', value: '1h' },
    { label: '6H', value: '6h' },
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
  ];

  const filterDataByPeriod = (data: ChartDataPoint[], period: string) => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (period) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoff.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      default:
        cutoff.setHours(now.getHours() - 1);
    }
    
    return data.filter(item => new Date(item.timestamp) >= cutoff);
  };

  const filteredData = filterDataByPeriod(data, selectedPeriod);

  const chartData = {
    labels: filteredData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    }),
    datasets: [
      {
        label: title,
        data: filteredData.map(item => item.value),
        borderColor: color,
        backgroundColor: color + '20',
        fill: type === 'line',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500' as const,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const item = data[index];
            return new Date(item.timestamp).toLocaleString();
          },
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    // Wait for next tick to ensure canvas is clean
    const timeoutId = setTimeout(() => {
      if (!chartRef.current) return;

      // Create new chart with safety check
      try {
        chartInstance.current = new ChartJS(chartRef.current, {
          type,
          data: chartData,
          options: chartOptions,
        });
      } catch (error) {
        console.error('Chart creation failed:', error);
        // Fallback to bar chart if line chart fails
        if (type === 'line') {
          try {
            chartInstance.current = new ChartJS(chartRef.current, {
              type: 'bar',
              data: chartData,
              options: chartOptions,
            });
          } catch (fallbackError) {
            console.error('Fallback chart creation also failed:', fallbackError);
          }
        }
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, selectedPeriod, type, color, showLegend]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex items-center space-x-1">
          {periods.map((period) => (
            <button
              key={period.value}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                selectedPeriod === period.value
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: `${height}px` }}>
        <canvas ref={chartRef} className="w-full h-full" />
      </div>

      {/* Stats */}
      {filteredData.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Data points: {filteredData.length}</span>
          <span>
            Range: {Math.min(...filteredData.map(d => d.value))} - {Math.max(...filteredData.map(d => d.value))}
          </span>
        </div>
      )}
    </div>
  );
}