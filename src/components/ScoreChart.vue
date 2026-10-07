<template>
  <svg width="100%" :viewBox="`0 0 ${G.w} ${G.h}`" class="block" role="img" :aria-label="ariaLabel">
    <g stroke="#ecedf1" stroke-width="1">
      <line v-for="t in ticks" :key="t" :x1="G.gridLeft" :y1="y(t)" :x2="G.w" :y2="y(t)" />
    </g>
    <g font-family="JetBrains Mono, monospace" :font-size="compact ? 10 : 11" fill="#6b6f86">
      <text v-for="t in ticks" :key="t" x="0" :y="y(t) + (compact ? -4 : 4)">{{ t }}</text>
    </g>
    <polyline
      v-if="points.length > 1"
      :points="points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')"
      fill="none"
      stroke="#14162b"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Последний пробник — крупнее и лаймовый -->
    <circle
      v-for="(p, i) in points"
      :key="i"
      :cx="x(i)"
      :cy="y(p.value)"
      :r="isLast(i) ? (compact ? 7 : 8) : compact ? 5 : 5.5"
      :fill="isLast(i) ? '#d4f54c' : '#fff'"
      stroke="#14162b"
      stroke-width="2.5"
    />
    <g
      font-family="JetBrains Mono, monospace"
      :font-size="compact ? 12 : 13"
      font-weight="600"
      fill="#14162b"
      text-anchor="middle"
    >
      <text v-for="(p, i) in points" :key="i" :x="x(i)" :y="y(p.value) - (isLast(i) ? 16 : 13)">{{ p.value }}</text>
    </g>
    <g font-family="Onest, system-ui, sans-serif" :font-size="compact ? 11 : 12.5" fill="#5a5e76" text-anchor="middle">
      <text v-for="(p, i) in points" :key="i" :x="x(i)" :y="G.labelY">{{ p.label }}</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { chartTicks } from '@/features/assignments';

/** Динамика первичного балла по пробникам. compact — мобильная раскладка с короткими подписями. */
const { points, compact = false } = defineProps<{
  points: { value: number; label: string }[];
  compact?: boolean;
}>();

const G = compact
  ? { w: 324, h: 156, top: 36, bottom: 119.2, labelY: 150, gridLeft: 0 }
  : { w: 960, h: 168, top: 30, bottom: 130, labelY: 160, gridLeft: 32 };

const ticks = computed(() => chartTicks(points.map(p => p.value)));
const y = (v: number) => {
  const [lo, hi] = [ticks.value[0]!, ticks.value.at(-1)!];
  return G.bottom - ((v - lo) / (hi - lo)) * (G.bottom - G.top);
};
const x = (i: number) => (i + 0.5) * (G.w / points.length);
const isLast = (i: number) => i === points.length - 1;
const ariaLabel = computed(() => `Динамика первичного балла: ${points.map(p => p.value).join(', ')}`);
</script>
