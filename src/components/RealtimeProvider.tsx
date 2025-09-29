/* eslint-disable react-refresh/only-export-components */
import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
// SSE service removed - using WebSocket instead

interface RealtimeContextType {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastActivity: Date | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: <T>(type: string, callback: (data: T) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: ReactNode;
  showStatusIndicator?: boolean;
}

const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  showStatusIndicator = false,
}) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const { toast } = useToast();
  const hasShownConnectToastRef = React.useRef(false);

  const connect = React.useCallback(async (): Promise<void> => {
    if (connecting || connected) return;
    
    setConnecting(true);
    setError(null);
    
    // SSE connection disabled - using WebSocket instead
    setConnected(false);
    setError('SSE service disabled - using WebSocket for real-time data');
    setConnecting(false);
  }, [connecting, connected, toast]);

  const disconnect = React.useCallback((): void => {
    // SSE service disabled - using WebSocket instead
    setConnected(false);
    setError(null);
  }, []);

  const subscribe = <T,>(type: string, callback: (data: T) => void) => {
    // SSE service disabled - using WebSocket instead
    console.warn('SSE subscribe disabled - using WebSocket for real-time data');
    return () => {}; // Return empty unsubscribe function
  };

  // Auto-connect on mount (with error handling) - DISABLED to prevent CORS errors
  useEffect(() => {
    // SSE connection disabled to prevent CORS errors with /api/events endpoint
    // The original RealtimeDashboard now uses WebSocket service instead
    console.log('RealtimeProvider: SSE connection disabled to prevent CORS errors');
    
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const contextValue: RealtimeContextType = {
    connected,
    connecting,
    error,
    lastActivity,
    connect,
    disconnect,
    subscribe,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
      {showStatusIndicator && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {connected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <div className="text-sm font-medium">
                      {connected ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lastActivity ? `Last update: ${lastActivity.toLocaleTimeString()}` : 'No updates yet'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={connected ? 'default' : 'destructive'}>
                    {connected ? 'Live' : 'Offline'}
                  </Badge>
                  {!connected && !connecting && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={connect}
                      className="h-6 px-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                  {connecting && (
                    <Activity className="h-4 w-4 animate-pulse text-blue-500" />
                  )}
                </div>
              </div>
              {error && (
                <div className="mt-2 text-xs text-red-500">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    console.warn('useRealtime used outside of RealtimeProvider, returning fallback');
    return {
      connected: false,
      connecting: false,
      error: 'Not connected to realtime provider',
      lastActivity: null,
      connect: async () => {},
      disconnect: () => {},
      subscribe: () => () => {}
    };
  }
  return context;
};

export default RealtimeProvider;