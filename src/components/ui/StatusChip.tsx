import { cn } from "@/lib/utils";

interface StatusChipProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'running' | 'pending';
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatusChip({ 
  status, 
  label, 
  size = 'md', 
  showDot = true,
  icon,
  className
}: StatusChipProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const statusClasses = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    running: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  };

  const dotClasses = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-blue-400',
    running: 'bg-purple-400 animate-pulse',
    pending: 'bg-gray-400',
  };

  const iconClasses = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
    running: 'text-purple-500',
    pending: 'text-gray-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeClasses[size],
        statusClasses[status],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotClasses[status]
          )}
        />
      )}
      {icon && (
        <span className={cn('w-3 h-3 mr-1', iconClasses[status])}>
          {icon}
        </span>
      )}
      {label}
    </span>
  );
}