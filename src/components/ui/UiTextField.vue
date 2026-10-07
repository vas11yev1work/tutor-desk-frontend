<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-[13px] font-semibold text-label">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :aria-invalid="invalid || undefined"
      class="h-13 rounded-[14px] border border-line bg-field px-4 text-base font-medium text-ink transition-colors focus:bg-white focus:outline-2 focus:outline-offset-1 focus:outline-ink aria-invalid:border-alert"
    />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineProps<{ label: string; invalid?: boolean }>();
defineOptions({ inheritAttrs: false });
const model = defineModel<string>({ required: true });
const id = useId();
</script>
