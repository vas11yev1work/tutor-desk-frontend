<template>
  <span
    :class="[TONE[tone], SIZE[size]]"
    class="inline-flex items-center gap-1.25 rounded-full font-semibold whitespace-nowrap"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { TONE, type Tone } from './tones';

const { tone = 'neutral', size = 'md' } = defineProps<{ tone?: Tone; size?: 'sm' | 'md' | 'lg' }>();

const SIZE = {
  sm: 'h-5 px-2.25 text-[11px]',
  md: 'h-6 px-2.25 text-xs',
  lg: 'h-7 px-2.75 text-sm',
};
</script>
