<template>
  <div role="radiogroup" :aria-label="label">
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :class="model === o.value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'"
      class="h-11 min-w-11 cursor-pointer rounded-xl border px-3.5 text-sm font-semibold"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T">
/** Выбор одного варианта пилюлями. Раскладку (flex-wrap / grid) задаёт родитель через class. */
defineProps<{ label: string; options: { value: T; label: string }[] }>();
const model = defineModel<T>();
</script>
