<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled || loading"
    :aria-busy="loading || undefined"
    :class="[
      size === 'lg' ? 'min-h-13 rounded-2xl px-4.5 text-base' : 'min-h-11 rounded-[14px] px-4 text-[15px]',
      variant === 'ghost'
        ? 'border border-line bg-white text-ink hover:bg-[#f6f7f9]'
        : 'bg-ink text-white hover:bg-ink-hover',
    ]"
    class="inline-flex cursor-pointer items-center justify-center gap-2 leading-none font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from 'vue-router';

const {
  type = 'button',
  variant = 'ink',
  size = 'md',
  to = undefined,
} = defineProps<{
  type?: 'button' | 'submit';
  variant?: 'ink' | 'ghost';
  size?: 'md' | 'lg';
  /** Ссылка вместо кнопки. */
  to?: RouteLocationRaw;
  disabled?: boolean;
  loading?: boolean;
}>();
</script>
