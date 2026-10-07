<template>
  <div class="flex items-center gap-3">
    <div
      :class="compact ? 'size-10 rounded-xl' : 'size-11 rounded-[13px]'"
      class="flex -rotate-6 items-center justify-center bg-accent text-ink"
    >
      <svg
        :width="compact ? 22 : 24"
        :height="compact ? 22 : 24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M17.5 5H6.5l6 7-6 7h11" />
      </svg>
    </div>
    <span :class="compact ? 'text-lg' : 'text-xl'" class="font-display font-bold tracking-tight">TutorDesk</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ compact?: boolean }>();
</script>
