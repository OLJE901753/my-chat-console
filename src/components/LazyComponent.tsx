import React, { Suspense, ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';
import ErrorBoundary from './ErrorBoundary';

interface LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingMessage?: string;
  onError?: (error: Error) => void;
}

const LazyComponent: React.FC<LazyComponentProps> = ({ 
  component, 
  fallback,
  errorFallback,
  loadingMessage = "Loading component...",
  onError
}) => {
  const LazyLoadedComponent = React.lazy(component);

  const defaultFallback = fallback || (
    <LoadingState 
      message={loadingMessage} 
      variant="default" 
      type="general" 
    />
  );

  const defaultErrorFallback = errorFallback || (
    <ErrorDisplay
      error="Failed to load component"
      title="Component Load Error"
      description="There was an error loading this component. Please try refreshing the page."
      onRetry={() => window.location.reload()}
      retryLabel="Refresh Page"
    />
  );

  return (
    <ErrorBoundary 
      fallback={defaultErrorFallback}
      onError={onError}
    >
      <Suspense fallback={defaultFallback}>
        <LazyLoadedComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyComponent;
