<template>
  <div ref="root" class="relative" @keydown.esc="open = false">
    <div
      v-if="open"
      role="listbox"
      :aria-label="label"
      :class="{
        'inset-x-0 bottom-[calc(100%+8px)]': variant === 'sidebar',
        'top-[calc(100%+8px)] -right-13 w-57.5': variant === 'compact',
        'inset-x-0 top-[calc(100%+8px)]': variant === 'field',
      }"
      class="absolute z-40 flex flex-col gap-0.5 rounded-2xl border border-line-card bg-white p-1.5 text-ink shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]"
    >
      <button
        v-for="t in THEMES"
        :key="t.id"
        type="button"
        role="option"
        :aria-selected="t.id === active.id"
        class="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[14.5px] font-semibold hover:bg-ghost-hover"
        @click="pick(t.id)"
      >
        <span class="size-5 flex-none rounded-[7px] border border-line" :style="swatch(t)" />
        <span class="flex-1">{{ t.name }}</span>
        <Check v-if="t.id === active.id" :size="16" :stroke-width="2.4" aria-hidden="true" />
      </button>
    </div>

    <button
      v-if="variant === 'compact'"
      type="button"
      :aria-label="`${label}: ${active.name}`"
      :aria-expanded="open"
      aria-haspopup="listbox"
      class="flex size-11 cursor-pointer items-center justify-center rounded-[14px] border border-white/22 bg-white/8"
      @click="open = !open"
    >
      <span class="size-5 rounded-[7px] border-[1.5px] border-white" :style="swatch(active)" />
    </button>
    <button
      v-else
      type="button"
      :aria-label="`${label}: ${active.name}`"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :class="variant === 'field' ? 'h-13 px-4' : 'min-h-11.5 px-3.5'"
      class="flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-ink-line bg-ink text-left text-[15px] font-semibold text-white transition-colors hover:bg-ink-hover"
      @click="open = !open"
    >
      <span class="size-5 flex-none rounded-[7px] border-[1.5px] border-white" :style="swatch(active)" />
      <span class="flex-1">{{ active.name }}</span>
      <component
        :is="variant === 'field' ? ChevronDown : ChevronUp"
        :size="variant === 'field' ? 18 : 16"
        :stroke-width="2"
        class="opacity-70"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Check, ChevronDown, ChevronUp } from '@lucide/vue';
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';

import { THEMES } from '@/features/theme';

/**
 * sidebar — кнопка в сайдбаре, список вверх; compact — квадратная кнопка в шапке на мобиле, список вниз;
 * field — поле на тёмной панели (тема кабинета ученика), список вниз.
 */
const { variant = 'sidebar', label = 'Тема' } = defineProps<{
  variant?: 'sidebar' | 'compact' | 'field';
  label?: string;
}>();
const model = defineModel<string>({ required: true });

const active = computed(() => THEMES.find(t => t.id === model.value) ?? THEMES[0]!);
const swatch = (t: (typeof THEMES)[number]) => ({
  background: `linear-gradient(135deg, ${t.ink} 0 50%, ${t.accent} 50% 100%)`,
});

const open = ref(false);
const root = useTemplateRef('root');
const closeOutside = (e: Event) => {
  if (!root.value?.contains(e.target as Node)) open.value = false;
};
watch(open, o => document[o ? 'addEventListener' : 'removeEventListener']('pointerdown', closeOutside));
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside));

const pick = (theme: string) => {
  open.value = false;
  model.value = theme;
};
</script>
