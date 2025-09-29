import { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  BarChart3, 
  FileText, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2,
  Wifi,
  WifiOff,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useWebSocket } from '@/services/websocketService';
import MetricsOverview from '@/components/dashboard/MetricsOverview';
import MetricsChart from '@/components/dashboard/MetricsChart';
import LogEntry from '@/components/dashboard/LogEntry';
import StatusChip from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export default function RealTimeDashboard() {
  const {
    state,
    logs,
    metrics,
    recentLogs,
    autoScroll,
    isPaused,
    toggleAutoScroll,
    togglePause,
    clearLogs,
    reconnect,
    scrollToBottom,
  } = useWebSocket();

  const [activeTab, setActiveTab] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Connection status
  const connectionStatus = state.isConnecting ? 'running' : state.isConnected ? 'success' : 'error';
  const connectionLabel = state.isConnecting ? 'CONNECTING' : state.isConnected ? 'CONNECTED' : 'DISCONNECTED';

  // Generate trend data from logs
  const trendData = {
    success: logs.reduce((acc, log) => {
      const minute = new Date(log.timestamp).toISOString().slice(0, 16);
      if (!acc[minute]) {
        acc[minute] = { timestamp: minute, value: 0 };
      }
      if (log.level === 'success') {
        acc[minute].value++;
      }
      return acc;
    }, {} as Record<string, ChartDataPoint>),

    failure: logs.reduce((acc, log) => {
      const minute = new Date(log.timestamp).toISOString().slice(0, 16);
      if (!acc[minute]) {
        acc[minute] = { timestamp: minute, value: 0 };
      }
      if (log.level === 'error') {
        acc[minute].value++;
      }
      return acc;
    }, {} as Record<string, ChartDataPoint>),

    cost: logs.reduce((acc, log) => {
      const minute = new Date(log.timestamp).toISOString().slice(0, 16);
      if (!acc[minute]) {
        acc[minute] = { timestamp: minute, value: 0 };
      }
      if (log.cost) {
        acc[minute].value += log.cost;
      }
      return acc;
    }, {} as Record<string, ChartDataPoint>),
  };

  const successTrendData = Object.values(trendData.success);
  const failureTrendData = Object.values(trendData.failure);
  const costTrendData = Object.values(trendData.cost);

  // Handle scroll events
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    setIsUserScrolling(!isAtBottom);
  };

  // Auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && !isUserScrolling) {
      scrollToBottom();
    }
  }, [logs.length, autoScroll, isPaused, isUserScrolling, scrollToBottom]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'logs', label: 'Live Logs', icon: FileText },
    { id: 'charts', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={cn(
      'min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300',
      isFullscreen && 'fixed inset-0 z-50 bg-white dark:bg-gray-900'
    )}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Real-Time Dashboard
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Live experiment monitoring & analytics
                  </p>
                </div>
              </div>
              
              <StatusChip
                status={connectionStatus}
                label={connectionLabel}
                size="md"
                icon={state.isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{logs.length} logs</span>
                <span>{metrics.running} running</span>
                <span>${metrics.totalCost.toFixed(2)} spent</span>
              </div>
              
              {/* Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAutoScroll}
                  className={cn(
                    'transition-all duration-200',
                    autoScroll 
                      ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                  className={cn(
                    'transition-all duration-200',
                    isPaused 
                      ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <MetricsOverview metrics={metrics} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricsChart
                title="Success/Failure Trends"
                data={successTrendData}
                type="line"
                color="#10B981"
                height={300}
              />
              <MetricsChart
                title="Cost Over Time"
                data={costTrendData}
                type="line"
                color="#F59E0B"
                height={300}
              />
            </div>
          </TabsContent>

          {/* Live Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Real-Time Logs</span>
                    </CardTitle>
                    <CardDescription>
                      Live experiment logs with detailed information
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {logs.length} entries
                    </span>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showDetails}
                        onChange={(e) => setShowDetails(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Show Details
                      </span>
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={logsContainerRef}
                  id="logs-container"
                  className="h-96 overflow-y-auto space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border"
                  onScroll={handleScroll}
                >
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">No logs yet</p>
                        <p className="text-sm">Waiting for experiment data...</p>
                      </div>
                    </div>
                  ) : (
                    recentLogs.map((log) => (
                      <LogEntry
                        key={log.id}
                        log={log}
                        showDetails={showDetails}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricsChart
                title="Success Rate Over Time"
                data={successTrendData}
                type="line"
                color="#10B981"
                height={400}
              />
              <MetricsChart
                title="Failure Rate Over Time"
                data={failureTrendData}
                type="line"
                color="#EF4444"
                height={400}
              />
            </div>
            
            <MetricsChart
              title="Cost Analysis"
              data={costTrendData}
              type="bar"
              color="#F59E0B"
              height={400}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Settings</CardTitle>
                <CardDescription>
                  Configure your real-time dashboard preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Display Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={autoScroll}
                          onChange={(e) => toggleAutoScroll()}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Auto-scroll to latest logs
                        </span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showDetails}
                          onChange={(e) => setShowDetails(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Show detailed log information
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Connection Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">WebSocket Status</span>
                        <StatusChip
                          status={connectionStatus}
                          label={connectionLabel}
                          size="sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Log Entries</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {logs.length}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Running Experiments</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {metrics.running}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-4 right-4 md:hidden z-40">
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}