<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ title }}
      </h3>
      <div class="flex items-center space-x-2">
        <button
          v-for="period in periods"
          :key="period.value"
          :class="[
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            selectedPeriod === period.value
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          ]"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div class="h-64">
      <canvas
        ref="chartCanvas"
        class="w-full h-full"
      />
    </div>

    <!-- Legend -->
    <div
      v-if="showLegend"
      class="flex items-center justify-center space-x-6 mt-4"
    >
      <div
        v-for="dataset in chartData.datasets"
        :key="dataset.label"
        class="flex items-center space-x-2"
      >
        <div
          :class="[
            'w-3 h-3 rounded-full',
            dataset.backgroundColor,
          ]"
        />
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ dataset.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  title: string;
  data: Array<{ timestamp: string; value: number; label?: string }>;
  type?: 'line' | 'bar';
  showLegend?: boolean;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  showLegend: true,
  color: '#3B82F6',
});

const chartCanvas = ref<HTMLCanvasElement>();
let chart: ChartJS | null = null;

const periods = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
];

const selectedPeriod = ref('1h');

const chartData = computed(() => {
  const filteredData = filterDataByPeriod(props.data, selectedPeriod.value);
  
  return {
    labels: filteredData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    }),
    datasets: [
      {
        label: props.title,
        data: filteredData.map(item => item.value),
        borderColor: props.color,
        backgroundColor: props.color + '20',
        fill: props.type === 'line',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: props.showLegend,
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        title: (context: any) => {
          const index = context[0].dataIndex;
          const item = props.data[index];
          return new Date(item.timestamp).toLocaleString();
        },
        label: (context: any) => {
          return `${context.dataset.label}: ${context.parsed.y}`;
        },
      },
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
    y: {
      display: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      beginAtZero: true,
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
}));

function filterDataByPeriod(data: Array<{ timestamp: string; value: number }>, period: string) {
  const now = new Date();
  const cutoff = new Date();
  
  switch (period) {
    case '1h':
      cutoff.setHours(now.getHours() - 1);
      break;
    case '6h':
      cutoff.setHours(now.getHours() - 6);
      break;
    case '24h':
      cutoff.setDate(now.getDate() - 1);
      break;
    case '7d':
      cutoff.setDate(now.getDate() - 7);
      break;
    default:
      cutoff.setHours(now.getHours() - 1);
  }
  
  return data.filter(item => new Date(item.timestamp) >= cutoff);
}

function createChart() {
  if (!chartCanvas.value) return;
  
  chart = new ChartJS(chartCanvas.value, {
    type: props.type,
    data: chartData.value,
    options: chartOptions.value,
  });
}

function updateChart() {
  if (!chart) return;
  
  chart.data = chartData.value;
  chart.update('none');
}

onMounted(() => {
  createChart();
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});

watch(chartData, () => {
  updateChart();
}, { deep: true });

watch(selectedPeriod, () => {
  updateChart();
});
</script>

