/* eslint-disable react-refresh/only-export-components */
import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sseService } from '@/services/sseService';

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
    
    try {
      await sseService.connect();
      setConnected(true);
      setLastActivity(new Date());
      if (!hasShownConnectToastRef.current) {
        toast({
          title: "Connected",
          description: "Real-time data connection established",
        });
        hasShownConnectToastRef.current = true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      // Don't show toast for connection failures on startup
      console.warn('SSE connection failed:', errorMessage);
    } finally {
      setConnecting(false);
    }
  }, [connecting, connected, toast]);

  const disconnect = React.useCallback((): void => {
    sseService.disconnect();
    setConnected(false);
    setError(null);
  }, []);

  const subscribe = <T,>(type: string, callback: (data: T) => void) => {
    return sseService.subscribe(type, (data: T) => {
      setLastActivity(new Date());
      callback(data);
    });
  };

  // Auto-connect on mount (with error handling)
  useEffect(() => {
    // Delay connection to allow app to fully load
    const timer = setTimeout(() => {
      connect().catch((error) => {
        console.warn('Failed to connect to SSE on mount:', error);
        // Don't crash the app if SSE connection fails
      });
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect]);

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