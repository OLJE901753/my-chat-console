import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Zap, Database, Wifi, Server } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  variant?: 'default' | 'compact' | 'inline' | 'overlay';
  type?: 'general' | 'network' | 'database' | 'server' | 'processing';
  className?: string;
}

const getLoadingIcon = (type: string) => {
  switch (type) {
    case 'network':
      return <Wifi className="h-6 w-6 animate-pulse" />;
    case 'database':
      return <Database className="h-6 w-6 animate-pulse" />;
    case 'server':
      return <Server className="h-6 w-6 animate-pulse" />;
    case 'processing':
      return <Zap className="h-6 w-6 animate-pulse" />;
    default:
      return <Loader2 className="h-6 w-6 animate-spin" />;
  }
};

const getDefaultMessage = (type: string) => {
  switch (type) {
    case 'network':
      return 'Connecting to server...';
    case 'database':
      return 'Loading data...';
    case 'server':
      return 'Processing request...';
    case 'processing':
      return 'Processing...';
    default:
      return 'Loading...';
  }
};

const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  variant = 'default',
  type = 'general',
  className = '',
}) => {
  const loadingMessage = message || getDefaultMessage(type);
  const loadingIcon = getLoadingIcon(type);

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {loadingIcon}
        <span className="text-gray-400 text-sm">{loadingMessage}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          {loadingIcon}
          <span className="text-gray-400 text-sm">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={`fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
        <Card className="glass-card border-lime-500/30">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-3">
              {loadingIcon}
              <span className="text-gray-400">{loadingMessage}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className={`glass-card border-lime-500/30 ${className}`}>
      <CardContent className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          {loadingIcon}
          <span className="text-gray-400">{loadingMessage}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingState;
