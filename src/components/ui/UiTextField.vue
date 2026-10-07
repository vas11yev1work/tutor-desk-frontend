<template>
  <div class="flex min-w-0 flex-col gap-2">
    <label :for="id" :class="hideLabel ? 'sr-only' : 'text-[13px] font-semibold text-label'">
      {{ label }}
      <span v-if="optional" class="font-medium text-[#6b6f86]">— необязательно</span>
    </label>
    <div
      :class="[
        dark
          ? 'border border-[#48495a] bg-ink text-white focus-within:outline-accent'
          : [filled ? 'bg-field' : 'bg-white', 'text-ink focus-within:outline-ink'],
        invalid ? 'border-[1.5px] border-alert' : !dark && 'border border-line',
        multiline ? 'items-start py-3.5' : 'h-13 items-center',
      ]"
      class="flex w-full gap-2.5 rounded-[14px] px-4 focus-within:outline-2 focus-within:outline-offset-1"
    >
      <span v-if="$slots.icon" class="flex flex-none text-muted" aria-hidden="true"><slot name="icon" /></span>
      <textarea
        v-if="multiline"
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :aria-invalid="invalid || undefined"
        class="min-w-0 flex-1 resize-none bg-transparent text-base leading-[1.45] font-medium outline-none"
      />
      <input
        v-else
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :aria-invalid="invalid || undefined"
        class="min-w-0 flex-1 bg-transparent text-base font-medium outline-none"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  invalid?: boolean;
  /** Подпись только для скринридеров — например, у поиска с плейсхолдером. */
  hideLabel?: boolean;
  /** Серый фон вместо белого — для поля на белой карточке (логин). */
  filled?: boolean;
  /** Многострочное поле (textarea); высоту задаёт rows. */
  multiline?: boolean;
  /** Приписка «— необязательно» к подписи. */
  optional?: boolean;
  /** Тёмное поле на тёмной панели. */
  dark?: boolean;
}>();
defineOptions({ inheritAttrs: false });
const model = defineModel<string>({ required: true });
const id = useId();
</script>
