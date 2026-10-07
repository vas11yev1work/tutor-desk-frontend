<template>
  <dialog
    ref="el"
    :aria-labelledby="titleId"
    class="m-auto w-full max-w-150 flex-col rounded-[28px] bg-field text-ink shadow-[0_30px_80px_-20px_rgba(20,22,43,0.55)] backdrop:bg-ink/50 open:flex max-md:h-full max-md:max-h-none max-md:max-w-none max-md:rounded-none max-md:bg-surface max-md:shadow-none"
    @close="open = false"
  >
    <div class="flex items-center justify-between gap-3 px-4 pt-3 md:px-6 md:pt-5.5 md:pb-1">
      <h2 :id="titleId" class="font-display text-[22px] font-semibold tracking-[-0.02em]">{{ title }}</h2>
      <button
        type="button"
        aria-label="Закрыть"
        class="flex size-11 flex-none cursor-pointer items-center justify-center rounded-[14px] border border-line bg-white"
        @click="open = false"
      >
        <X :size="20" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <div class="flex flex-1 flex-col gap-5 px-4 pt-4 md:px-6 md:pt-4.5 md:pb-6">
      <slot />
      <div
        v-if="$slots.footer"
        class="flex flex-wrap justify-end gap-2.5 pt-1 max-md:sticky max-md:bottom-0 max-md:-mx-4 max-md:mt-auto max-md:border-t max-md:border-line-card max-md:bg-surface max-md:px-4 max-md:pt-3.5 max-md:pb-7 max-md:*:flex-1"
      >
        <slot name="footer" />
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue';
import { useId, useTemplateRef, watch } from 'vue';

defineProps<{ title: string }>();
const open = defineModel<boolean>('open', { required: true });

const el = useTemplateRef('el');
const titleId = useId();

// Нативный <dialog>: фокус внутри, Esc и затемнение фона — браузер.
watch(open, v => (v ? el.value?.showModal() : el.value?.close()), { flush: 'post' });
</script>
