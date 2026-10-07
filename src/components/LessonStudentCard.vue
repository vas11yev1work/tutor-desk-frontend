<template>
  <div class="flex items-center gap-3.5 card rounded-2xl! px-4 py-3.5">
    <UiAvatar :name="student.name" :tone="EXAM_TONE[student.exam ?? 'none']" />
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="text-[15px] font-semibold">{{ student.name }}</span>
      <span class="text-[13px] text-muted"><slot /></span>
    </div>
    <slot name="aside" />
  </div>
</template>

<script setup lang="ts">
import type { Lesson } from '@/api/types';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import { EXAM_TONE } from '@/features/students';

/** Шапка окон переноса и правила: ученик и что сейчас. */
defineProps<{ student: Lesson['student'] }>();
</script>
