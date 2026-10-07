<template>
  <div class="flex min-w-0 flex-col gap-2">
    <label :for="id" class="text-[13px] font-semibold text-label">{{ label }}</label>
    <div
      class="relative flex h-13 w-full items-center gap-2.5 rounded-[14px] border border-line bg-white px-4 text-ink focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ink"
    >
      <span v-if="$slots.icon" class="flex flex-none" aria-hidden="true"><slot name="icon" /></span>
      <!-- Нативный select на всю площадь поля: клавиатура, скринридеры и мобильные пикеры — браузера. -->
      <select
        :id="id"
        v-model="model"
        v-bind="$attrs"
        class="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-base font-medium outline-none"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <ChevronDown :size="18" :stroke-width="2" class="pointer-events-none absolute right-4" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import { useId } from 'vue';

defineProps<{ label: string; options: { value: string; label: string }[]; placeholder?: string }>();
defineOptions({ inheritAttrs: false });
const model = defineModel<string>({ required: true });
const id = useId();
</script>
