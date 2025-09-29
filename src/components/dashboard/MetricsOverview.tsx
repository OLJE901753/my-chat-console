import { TrendingUp, TrendingDown, Activity, DollarSign, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import StatusChip from '@/components/ui/StatusChip';
import { cn } from '@/lib/utils';

interface ExperimentMetrics {
  total: number;
  success: number;
  failed: number;
  running: number;
  totalCost: number;
  avgCost: number;
  successRate: number;
}

interface MetricsOverviewProps {
  metrics: ExperimentMetrics;
}

export default function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const successRate = metrics.total === 0 ? 0 : Math.round((metrics.success / metrics.total) * 100);
  const avgCost = metrics.total === 0 ? 0 : metrics.totalCost / metrics.total;
  const failureRate = metrics.total === 0 ? 0 : Math.round((metrics.failed / metrics.total) * 100);

  const metricCards = [
    {
      title: 'Total Experiments',
      value: metrics.total,
      icon: Activity,
      color: 'blue',
      trend: null,
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      icon: CheckCircle,
      color: 'green',
      trend: successRate > 80 ? 'up' : successRate > 60 ? 'stable' : 'down',
    },
    {
      title: 'Running Now',
      value: metrics.running,
      icon: Clock,
      color: 'purple',
      trend: null,
    },
    {
      title: 'Total Cost',
      value: `$${metrics.totalCost.toFixed(4)}`,
      icon: DollarSign,
      color: 'yellow',
      trend: null,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-900 dark:text-blue-100',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-900 dark:text-green-100',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-900 dark:text-purple-100',
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-900 dark:text-yellow-100',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendIcon = (trend: string | null) => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => {
          const colors = getColorClasses(card.color);
          const Icon = card.icon;
          
          return (
            <div
              key={index}
              className={cn(
                'relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105',
                colors.bg
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className={cn('text-3xl font-bold', colors.text)}>
                    {card.value}
                  </p>
                  {card.trend && (
                    <div className="flex items-center mt-2">
                      {getTrendIcon(card.trend)}
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        {card.trend === 'up' ? 'Improving' : card.trend === 'down' ? 'Declining' : 'Stable'}
                      </span>
                    </div>
                  )}
                </div>
                <div className={cn('p-3 rounded-lg', colors.bg)}>
                  <Icon className={cn('w-6 h-6', colors.icon)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Success/Failure Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Experiment Results
            </h3>
            <Zap className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusChip status="success" label="SUCCESS" size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.success} experiments
                </span>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics.success}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusChip status="error" label="FAILED" size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.failed} experiments
                </span>
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {metrics.failed}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {successRate}% success rate
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cost Analysis
            </h3>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                ${metrics.totalCost.toFixed(4)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Spent
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Average per experiment:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ${avgCost.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              System Status
            </h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active experiments:</span>
              <StatusChip 
                status={metrics.running > 0 ? 'running' : 'pending'} 
                label={metrics.running > 0 ? 'ACTIVE' : 'IDLE'} 
                size="sm" 
              />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {metrics.running}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Currently Running
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}