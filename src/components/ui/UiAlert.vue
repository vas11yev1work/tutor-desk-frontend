<template>
  <div role="alert" class="flex items-start gap-3 rounded-2xl bg-danger-soft px-4 py-3.5">
    <span class="flex size-7.5 flex-none items-center justify-center rounded-[10px] bg-alert text-ink">
      <CircleAlert :size="16" :stroke-width="2.4" aria-hidden="true" />
    </span>
    <div class="text-sm leading-[1.45] text-[#7a1f06]"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { CircleAlert } from '@lucide/vue';
</script>
