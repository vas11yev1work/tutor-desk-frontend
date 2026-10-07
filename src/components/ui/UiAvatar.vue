<template>
  <span
    :class="TONE[tone]"
    class="flex size-10.5 flex-none items-center justify-center rounded-full text-[13px] font-bold"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { TONE, type Tone } from './tones';

const { name, tone = 'neutral' } = defineProps<{ name: string; tone?: Tone }>();

/** «Маша Соколова» → «МС». */
const initials = computed(() =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join(''),
);
</script>
