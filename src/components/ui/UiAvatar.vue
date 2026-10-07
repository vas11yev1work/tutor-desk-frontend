<template>
  <span
    :class="[
      TONE[tone],
      size === 'lg'
        ? 'size-17 -rotate-4 rounded-[22px] font-display text-[22px] font-semibold tracking-[-0.02em]'
        : 'size-10.5 rounded-full text-[13px] font-bold',
    ]"
    class="flex flex-none items-center justify-center"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { TONE, type Tone } from './tones';

const {
  name,
  tone = 'neutral',
  size = 'md',
} = defineProps<{
  name: string;
  tone?: Tone;
  /** lg — крупная наклонённая плашка в карточке ученика. */
  size?: 'md' | 'lg';
}>();

/** «Маша Соколова» → «МС». */
const initials = computed(() =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join(''),
);
</script>
