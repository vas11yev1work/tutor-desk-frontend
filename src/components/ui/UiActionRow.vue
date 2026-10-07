<template>
  <button
    type="button"
    class="flex min-h-16 w-full cursor-pointer items-center gap-3.5 px-4 py-2.5 text-left not-first:border-t not-first:border-line-soft hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60 md:px-4.5"
  >
    <span
      :class="danger ? 'bg-danger-soft text-danger' : 'bg-chip'"
      class="flex size-9.5 flex-none items-center justify-center rounded-xl"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
    <span class="flex-1">
      <b class="block text-[15px] font-semibold">{{ title }}</b>
      <small class="mt-0.5 block text-[13px] text-muted">{{ hint }}</small>
    </span>
  </button>
</template>

<script setup lang="ts">
/** Строка-действие в карточке: иконка в плашке, заголовок и пояснение. Ставить подряд внутри .card. */
defineProps<{ title: string; hint: string; danger?: boolean }>();
</script>
