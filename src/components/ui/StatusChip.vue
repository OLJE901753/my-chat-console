<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      sizeClasses,
      statusClasses,
    ]"
  >
    <span
      v-if="showDot"
      :class="[
        'w-1.5 h-1.5 rounded-full mr-1.5',
        dotClasses,
      ]"
    />
    <component
      v-if="icon"
      :is="icon"
      :class="['w-3 h-3 mr-1', iconClasses]"
    />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StatusChipProps } from '@/types';

interface Props extends StatusChipProps {
  showDot?: boolean;
  icon?: any;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showDot: true,
  icon: null,
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs';
    case 'lg':
      return 'px-3 py-1 text-sm';
    default:
      return 'px-2.5 py-0.5 text-xs';
  }
});

const statusClasses = computed(() => {
  switch (props.status) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'running':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'pending':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
});

const dotClasses = computed(() => {
  switch (props.status) {
    case 'success':
      return 'bg-green-400';
    case 'error':
      return 'bg-red-400';
    case 'warning':
      return 'bg-yellow-400';
    case 'info':
      return 'bg-blue-400';
    case 'running':
      return 'bg-purple-400 animate-pulse';
    case 'pending':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
});

const iconClasses = computed(() => {
  switch (props.status) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    case 'running':
      return 'text-purple-500';
    case 'pending':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
});
</script>

