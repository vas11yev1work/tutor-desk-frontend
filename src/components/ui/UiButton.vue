<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-ink px-4.5 text-base leading-none font-semibold text-white transition-colors hover:bg-ink-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const { type = 'button' } = defineProps<{
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
}>();
</script>
