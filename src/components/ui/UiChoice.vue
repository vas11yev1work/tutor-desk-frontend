<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :class="segmented && 'grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-segment p-1'"
  >
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :class="
        segmented
          ? [model === o.value ? 'bg-white text-ink' : 'text-label', 'h-10.5 text-[15px]']
          : [
              model === o.value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink',
              'h-11 min-w-11 border px-3.5 text-sm',
            ]
      "
      class="cursor-pointer rounded-xl font-semibold"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T">
/**
 * Выбор одного варианта.
 * Пилюли — раскладку (flex-wrap / grid) задаёт родитель через class; segmented — серый переключатель на всю ширину.
 */
defineProps<{ label: string; options: { value: T; label: string }[]; segmented?: boolean }>();
const model = defineModel<T>();
</script>
