<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled || loading"
    :aria-busy="loading || undefined"
    :class="[SIZE[size], VARIANT[variant]]"
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
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
  /** Ссылка вместо кнопки. */
  to?: RouteLocationRaw;
  disabled?: boolean;
  loading?: boolean;
}>();

const SIZE = {
  /** Как md, но шрифт 14px — кнопки в карточке ученика. */
  sm: 'min-h-11 rounded-[14px] px-4 text-sm',
  md: 'min-h-11 rounded-[14px] px-4 text-[15px]',
  lg: 'min-h-13 rounded-2xl px-4.5 text-base',
  /** Квадратная кнопка с иконкой. */
  icon: 'size-11 flex-none rounded-[14px]',
};

const VARIANT = {
  ink: 'bg-ink text-white hover:bg-ink-hover',
  ghost: 'border border-line bg-white text-ink hover:bg-[#f6f7f9]',
  /** Белая на тёмном фоне. */
  light: 'bg-white text-ink hover:bg-[#f6f7f9]',
  danger: 'bg-alert text-ink hover:bg-[#ff6a47]',
};
</script>
