import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, ExternalLink, User, Bot } from 'lucide-react';
import StatusChip from '@/components/ui/StatusChip';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: any;
  cost?: number;
  experimentId?: string;
  agentId?: string;
}

interface LogEntryProps {
  log: LogEntry;
  showDetails?: boolean;
}

export default function LogEntryComponent({ log, showDetails = false }: LogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedTime = format(new Date(log.timestamp), 'HH:mm:ss.SSS');
  const formattedDate = format(new Date(log.timestamp), 'MMM dd, yyyy');

  const levelStyles = {
    success: {
      container: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10',
      dot: 'bg-green-400',
      status: 'success' as const,
    },
    error: {
      container: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10',
      dot: 'bg-red-400',
      status: 'error' as const,
    },
    warn: {
      container: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10',
      dot: 'bg-yellow-400',
      status: 'warning' as const,
    },
    info: {
      container: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10',
      dot: 'bg-blue-400',
      status: 'info' as const,
    },
  };

  const currentLevel = levelStyles[log.level] || levelStyles.info;

  return (
    <div
      className={cn(
        'group flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200',
        'hover:shadow-sm hover:scale-[1.01]',
        currentLevel.container
      )}
    >
      {/* Timestamp */}
      <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono min-w-[80px]">
        <div className="font-semibold">{formattedTime}</div>
        <div className="text-[10px] opacity-75">{formattedDate}</div>
      </div>

      {/* Level indicator */}
      <div
        className={cn(
          'flex-shrink-0 w-2 h-2 rounded-full mt-2',
          currentLevel.dot
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Status chip */}
            <StatusChip
              status={currentLevel.status}
              label={log.level.toUpperCase()}
              size="sm"
              showDot={false}
            />

            {/* Message */}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
              {log.message}
            </span>
          </div>

          {/* Cost badge */}
          {log.cost && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              <span className="font-mono font-semibold">${log.cost.toFixed(4)}</span>
            </div>
          )}
        </div>

        {/* Experiment/Agent info */}
        {(log.experimentId || log.agentId) && (
          <div className="mt-2 flex items-center space-x-2 text-xs">
            {log.experimentId && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 font-medium">
                <ExternalLink className="w-3 h-3 mr-1" />
                Exp: {log.experimentId.slice(-8)}
              </span>
            )}
            {log.agentId && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 font-medium">
                <Bot className="w-3 h-3 mr-1" />
                Agent: {log.agentId.slice(-8)}
              </span>
            )}
          </div>
        )}

        {/* Additional data */}
        {log.data && showDetails && (
          <div className="mt-3">
            <button
              className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
            </button>
            
            {isExpanded && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}