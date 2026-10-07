<template>
  <div
    :role="multiple ? 'group' : 'radiogroup'"
    :aria-label="label"
    :class="segmented && 'grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-[#e4e6ec] p-1'"
  >
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      :role="multiple ? undefined : 'radio'"
      :aria-checked="multiple ? undefined : isOn(o.value)"
      :aria-pressed="multiple ? isOn(o.value) : undefined"
      :class="
        segmented
          ? [isOn(o.value) ? 'bg-white text-ink' : 'text-label', 'h-10.5 text-[15px]']
          : [
              isOn(o.value) ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink',
              'h-11 min-w-11 border px-3.5 text-sm',
            ]
      "
      class="cursor-pointer rounded-xl font-semibold"
      @click="pick(o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T">
/**
 * Выбор варианта.
 * Пилюли — раскладку (flex-wrap / grid) задаёт родитель через class; segmented — серый переключатель на всю ширину.
 * multiple — модель-массив, пилюли переключаются независимо.
 */
const { multiple } = defineProps<{
  label: string;
  options: { value: T; label: string }[];
  segmented?: boolean;
  multiple?: boolean;
}>();
const model = defineModel<T | T[]>();

const isOn = (v: T) => (Array.isArray(model.value) ? model.value.includes(v) : model.value === v);
const pick = (v: T) => {
  if (!multiple) return (model.value = v);
  const list = Array.isArray(model.value) ? model.value : [];
  model.value = list.includes(v) ? list.filter(x => x !== v) : [...list, v];
};
</script>
