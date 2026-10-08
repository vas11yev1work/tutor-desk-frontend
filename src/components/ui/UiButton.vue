<template>
  <component
    :is="to ? RouterLink : href ? 'a' : 'button'"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :disabled="to || href ? undefined : disabled || loading"
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
  href = undefined,
} = defineProps<{
  type?: 'button' | 'submit';
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
  /** Ссылка вместо кнопки. */
  to?: RouteLocationRaw;
  /** Обычная ссылка (файл, внешний адрес) вместо кнопки. */
  href?: string;
  disabled?: boolean;
  loading?: boolean;
}>();

const SIZE = {
  /** Маленькая в строке списка: «Открыть» у прошлых домашек. */
  xs: 'min-h-9.5 rounded-xl px-3 text-[13.5px]',
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
  /** Призрачная с красным текстом: «Убрать». */
  ghostDanger: 'border border-line bg-white text-danger hover:bg-[#f6f7f9]',
  /** Белая на тёмном фоне. */
  light: 'bg-white text-ink hover:bg-[#f6f7f9]',
  danger: 'bg-alert text-ink hover:bg-[#ff6a47]',
  /** Лаймовая — главное действие на тёмной панели. */
  accent: 'bg-accent text-ink hover:bg-[#c6ea36]',
  /** Полупрозрачная тёмная на светлом цветном фоне: «Скачать» в карточке занятия ученика. */
  soft: 'bg-ink/8 text-ink hover:bg-ink/14',
  /** Полупрозрачная на тёмном фоне. */
  glass: 'border border-white/22 bg-white/10 text-white hover:bg-white/16',
};
</script>
