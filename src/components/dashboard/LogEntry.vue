<template>
  <div
    :class="[
      'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
      'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      levelClasses,
    ]"
  >
    <!-- Timestamp -->
    <div class="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono">
      {{ formattedTime }}
    </div>

    <!-- Level indicator -->
    <div
      :class="[
        'flex-shrink-0 w-2 h-2 rounded-full mt-1.5',
        levelDotClasses,
      ]"
    />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <!-- Status chip -->
          <StatusChip
            :status="statusChipStatus"
            :label="log.level.toUpperCase()"
            size="sm"
            :show-dot="false"
          />

          <!-- Message -->
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ log.message }}
          </span>
        </div>

        <!-- Cost badge -->
        <div
          v-if="log.cost"
          class="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400"
        >
          <span class="font-mono">${{ log.cost.toFixed(4) }}</span>
        </div>
      </div>

      <!-- Additional data -->
      <div
        v-if="log.data && showDetails"
        class="mt-2 text-xs text-gray-600 dark:text-gray-400"
      >
        <details class="cursor-pointer">
          <summary class="hover:text-gray-800 dark:hover:text-gray-200">
            View Details
          </summary>
          <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">{{
            JSON.stringify(log.data, null, 2)
          }}</pre>
        </details>
      </div>

      <!-- Experiment/Agent info -->
      <div
        v-if="log.experimentId || log.agentId"
        class="mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400"
      >
        <span
          v-if="log.experimentId"
          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
        >
          Exp: {{ log.experimentId.slice(-8) }}
        </span>
        <span
          v-if="log.agentId"
          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400"
        >
          Agent: {{ log.agentId.slice(-8) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format } from 'date-fns';
import StatusChip from '@/components/ui/StatusChip.vue';
import type { LogEntry as LogEntryType } from '@/types';

interface Props {
  log: LogEntryType;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
});

const formattedTime = computed(() => {
  return format(new Date(props.log.timestamp), 'HH:mm:ss.SSS');
});

const levelClasses = computed(() => {
  switch (props.log.level) {
    case 'success':
      return 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10';
    case 'error':
      return 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10';
    case 'warn':
      return 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10';
    case 'info':
      return 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10';
    default:
      return 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50';
  }
});

const levelDotClasses = computed(() => {
  switch (props.log.level) {
    case 'success':
      return 'bg-green-400';
    case 'error':
      return 'bg-red-400';
    case 'warn':
      return 'bg-yellow-400';
    case 'info':
      return 'bg-blue-400';
    default:
      return 'bg-gray-400';
  }
});

const statusChipStatus = computed(() => {
  switch (props.log.level) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
});
</script>

