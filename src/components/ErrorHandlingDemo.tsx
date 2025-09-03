import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorDisplay from './ErrorDisplay';
import LoadingState from './LoadingState';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { apiClient, ApiClientError } from '@/services/apiClient';
import { useApiErrorHandler } from '@/services/apiClient';

const ErrorHandlingDemo: React.FC = () => {
  const [demoError, setDemoError] = useState<string | null>(null);
  const { handleError } = useApiErrorHandler();
  
  // Demo async operation with error handling
  const { data, loading, error, execute } = useAsyncOperation();

  const simulateNetworkError = () => {
    setDemoError('Network error: Unable to connect to server');
  };

  const simulateServerError = () => {
    setDemoError('Server error: Internal server error (500)');
  };

  const simulateDatabaseError = () => {
    setDemoError('Database error: Connection to Supabase failed');
  };

  const simulateTimeoutError = () => {
    setDemoError('Request timeout: The server took too long to respond');
  };

  const simulateApiCall = async () => {
    try {
      await execute(async () => {
        // Simulate a failing API call
        throw new ApiClientError('Simulated API error', 500, 'DEMO_ERROR');
      });
    } catch (error) {
      handleError(error, 'This is a demo error message');
    }
  };

  const clearError = () => {
    setDemoError(null);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="gradient-text">Error Handling Demo</CardTitle>
          <CardDescription>
            This component demonstrates the comprehensive error handling system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="errors" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="errors">Error Types</TabsTrigger>
              <TabsTrigger value="loading">Loading States</TabsTrigger>
              <TabsTrigger value="async">Async Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={simulateNetworkError} variant="outline">
                  Simulate Network Error
                </Button>
                <Button onClick={simulateServerError} variant="outline">
                  Simulate Server Error
                </Button>
                <Button onClick={simulateDatabaseError} variant="outline">
                  Simulate Database Error
                </Button>
                <Button onClick={simulateTimeoutError} variant="outline">
                  Simulate Timeout Error
                </Button>
              </div>

              {demoError && (
                <div className="space-y-4">
                  <ErrorDisplay
                    error={demoError}
                    onRetry={clearError}
                    retryLabel="Clear Error"
                    showDetails={true}
                  />
                  <Button onClick={clearError} size="sm" variant="outline">
                    Clear Error
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="loading" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Default Loading State</h3>
                  <LoadingState message="Loading data..." />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Network Loading State</h3>
                  <LoadingState message="Connecting to server..." type="network" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Database Loading State</h3>
                  <LoadingState message="Loading data from database..." type="database" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Processing Loading State</h3>
                  <LoadingState message="Processing request..." type="processing" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Compact Loading State</h3>
                  <LoadingState message="Loading..." variant="compact" />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Inline Loading State</h3>
                  <LoadingState message="Loading..." variant="inline" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="async" className="space-y-4">
              <div className="space-y-4">
                <Button onClick={simulateApiCall} disabled={loading}>
                  {loading ? 'Simulating...' : 'Simulate Async API Call'}
                </Button>

                {loading && (
                  <LoadingState message="Simulating API call..." type="server" />
                )}

                {error && (
                  <ErrorDisplay
                    error={error}
                    title="Async Operation Error"
                    description="This error was handled by the useAsyncOperation hook"
                    onRetry={() => execute(async () => {
                      throw new ApiClientError('Another simulated error', 400, 'DEMO_ERROR');
                    })}
                    retryLabel="Try Again"
                  />
                )}

                {data && (
                  <Card className="glass-card border-green-500/30">
                    <CardContent className="p-4">
                      <div className="text-green-400 text-sm">
                        ✅ Async operation completed successfully!
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorHandlingDemo;
