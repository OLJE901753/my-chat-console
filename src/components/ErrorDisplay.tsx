import { 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  Server, 
  Database,
  Zap
} from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ErrorDisplayProps {
  error: string | Error | null;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

const getErrorIcon = (error: string | Error) => {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return <WifiOff className="h-5 w-5" />;
  }
  if (lowerMessage.includes('server') || lowerMessage.includes('500') || lowerMessage.includes('502') || lowerMessage.includes('503')) {
    return <Server className="h-5 w-5" />;
  }
  if (lowerMessage.includes('database') || lowerMessage.includes('supabase') || lowerMessage.includes('sql')) {
    return <Database className="h-5 w-5" />;
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('slow')) {
    return <Zap className="h-5 w-5" />;
  }
  return <AlertTriangle className="h-5 w-5" />;
};

const getErrorType = (error: string | Error) => {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return {
      type: 'Network Error',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    };
  }
  if (lowerMessage.includes('server') || lowerMessage.includes('500') || lowerMessage.includes('502') || lowerMessage.includes('503')) {
    return {
      type: 'Server Error',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    };
  }
  if (lowerMessage.includes('database') || lowerMessage.includes('supabase') || lowerMessage.includes('sql')) {
    return {
      type: 'Database Error',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    };
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('slow')) {
    return {
      type: 'Timeout Error',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    };
  }
  return {
    type: 'Unknown Error',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
  };
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  description,
  onRetry,
  retryLabel = 'Try Again',
  showDetails = false,
  variant = 'default',
  className = '',
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorType = getErrorType(error);
  const errorIcon = getErrorIcon(error);

  if (variant === 'inline') {
    return (
      <Alert className={`${errorType.bgColor} ${errorType.borderColor} ${className}`}>
        {errorIcon}
        <AlertDescription className={errorType.color}>
          {errorMessage}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-3 rounded-lg ${errorType.bgColor} ${errorType.borderColor} border ${className}`}>
        <div className="flex items-center space-x-2">
          {errorIcon}
          <span className={`text-sm ${errorType.color}`}>{errorMessage}</span>
          {onRetry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="ml-auto h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`glass-card ${errorType.borderColor} border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {errorIcon}
          <CardTitle className={`text-lg ${errorType.color}`}>
            {title || errorType.type}
          </CardTitle>
        </div>
        {description && (
          <CardDescription className="text-gray-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-3 rounded-lg ${errorType.bgColor}`}>
          <p className={`text-sm ${errorType.color}`}>{errorMessage}</p>
        </div>

        {showDetails && typeof error === 'object' && error.stack && (
          <details className="bg-gray-800/30 rounded-lg p-3">
            <summary className="text-sm font-medium text-gray-300 cursor-pointer">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}

        {onRetry && (
          <div className="flex justify-end">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="bg-lime-600/10 border-lime-500/30 text-lime-400 hover:bg-lime-600/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retryLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;
