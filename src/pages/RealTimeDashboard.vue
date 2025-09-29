<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Real-Time Dashboard
            </h1>
            <StatusChip
              :status="connectionStatus"
              :label="connectionLabel"
              size="md"
            />
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Controls -->
            <div class="flex items-center space-x-2">
              <button
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  autoScroll
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                ]"
                @click="toggleAutoScroll"
              >
                {{ autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF' }}
              </button>
              
              <button
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  isPaused
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                ]"
                @click="togglePause"
              >
                {{ isPaused ? 'PAUSED' : 'LIVE' }}
              </button>
              
              <button
                class="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md transition-colors"
                @click="clearLogs"
              >
                Clear Logs
              </button>
              
              <button
                class="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md transition-colors"
                @click="reconnect"
              >
                Reconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Metrics Overview -->
      <MetricsOverview :metrics="metrics" />

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Success/Failure Trends -->
        <MetricsChart
          title="Success/Failure Trends"
          :data="trendData.success"
          type="line"
          color="#10B981"
        />
        
        <!-- Cost Over Time -->
        <MetricsChart
          title="Cost Over Time"
          :data="trendData.cost"
          type="line"
          color="#F59E0B"
        />
      </div>

      <!-- Logs Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Real-Time Logs
            </h2>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ logs.length }} entries
              </span>
              <div class="flex items-center space-x-2">
                <label class="flex items-center">
                  <input
                    v-model="showDetails"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  >
                  <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Show Details
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Logs Container -->
        <div
          id="logs-container"
          class="h-96 overflow-y-auto p-4 space-y-2"
          @scroll="handleScroll"
        >
          <div
            v-if="logs.length === 0"
            class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
          >
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="mt-2">No logs yet. Waiting for data...</p>
            </div>
          </div>

          <LogEntry
            v-for="log in recentLogs"
            :key="log.id"
            :log="log"
            :show-details="showDetails"
          />
        </div>
      </div>
    </div>

    <!-- Mobile Floating Action Button -->
    <div class="fixed bottom-4 right-4 md:hidden">
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        @click="scrollToBottom"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWebSocket } from '@/services/websocketService';
import MetricsOverview from '@/components/dashboard/MetricsOverview.vue';
import MetricsChart from '@/components/dashboard/MetricsChart.vue';
import LogEntry from '@/components/dashboard/LogEntry.vue';
import StatusChip from '@/components/ui/StatusChip.vue';
import type { ChartDataPoint } from '@/types';

// WebSocket service
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

// Local state
const showDetails = ref(false);
const isUserScrolling = ref(false);

// Computed properties
const connectionStatus = computed(() => {
  if (state.isConnecting) return 'running';
  if (state.isConnected) return 'success';
  return 'error';
});

const connectionLabel = computed(() => {
  if (state.isConnecting) return 'CONNECTING';
  if (state.isConnected) return 'CONNECTED';
  return 'DISCONNECTED';
});

// Generate trend data from logs
const trendData = computed(() => {
  const success: ChartDataPoint[] = [];
  const failure: ChartDataPoint[] = [];
  const cost: ChartDataPoint[] = [];

  // Group logs by minute for trend analysis
  const groupedLogs = logs.value.reduce((acc, log) => {
    const minute = new Date(log.timestamp).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    if (!acc[minute]) {
      acc[minute] = { success: 0, failure: 0, cost: 0 };
    }
    
    if (log.level === 'success') {
      acc[minute].success++;
    } else if (log.level === 'error') {
      acc[minute].failure++;
    }
    
    if (log.cost) {
      acc[minute].cost += log.cost;
    }
    
    return acc;
  }, {} as Record<string, { success: number; failure: number; cost: number }>);

  // Convert to chart data
  Object.entries(groupedLogs).forEach(([timestamp, data]) => {
    success.push({ timestamp, value: data.success });
    failure.push({ timestamp, value: data.failure });
    cost.push({ timestamp, value: data.cost });
  });

  return { success, failure, cost };
});

// Handle scroll events
function handleScroll(event: Event) {
  const target = event.target as HTMLElement;
  const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
  
  if (isAtBottom) {
    isUserScrolling.value = false;
  } else {
    isUserScrolling.value = true;
  }
}

// Auto-scroll when new logs arrive
const stopWatcher = computed(() => {
  if (autoScroll.value && !isPaused.value && !isUserScrolling.value) {
    return logs.value.length;
  }
  return null;
});

// Watch for new logs and auto-scroll
watch(stopWatcher, () => {
  if (stopWatcher.value !== null) {
    nextTick(() => {
      scrollToBottom();
    });
  }
});

onMounted(() => {
  // Initialize any additional setup if needed
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

