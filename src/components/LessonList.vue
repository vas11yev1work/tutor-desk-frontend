<template>
  <div :class="tiles ? 'flex flex-col gap-1.5 p-2' : 'overflow-hidden'" class="card">
    <RouterLink
      v-for="(l, i) in lessons"
      :key="l.id"
      :to="`/lessons/${l.id}`"
      :class="[
        tiles ? 'rounded-2xl' : i > 0 && 'border-t border-line-soft',
        l.id === highlight && 'bg-accent',
        l.status === 'cancelled' && 'bg-hover',
      ]"
      class="flex items-center gap-3.5 px-3.5 py-3.5 md:px-4.5"
    >
      <div class="w-12.5 flex-none font-mono">
        <div :class="l.status === 'cancelled' && 'text-subtle line-through'" class="text-[15px] font-semibold">
          {{ formatTime(new Date(l.startsAt)) }}
        </div>
        <div v-if="!withDuration" :class="l.id !== highlight && 'text-muted'" class="text-xs">
          {{ formatTime(lessonEnd(l)) }}
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <div :class="['text-[15px] font-semibold', l.status === 'cancelled' && 'text-muted line-through']">
          {{ l.student.name }}
        </div>
        <div :class="l.id !== highlight && 'text-muted'" class="text-[13px]">
          {{ [studentCaption(l.student), withDuration && `${l.durationMin} мин`].filter(Boolean).join(' · ') }}
        </div>
      </div>
      <span
        v-if="l.id === highlight"
        class="font-mono text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase"
      >
        {{ highlightLabel(l) }}
      </span>
      <div v-else-if="chipsOf(l).length" class="flex flex-none flex-wrap justify-end gap-1.5">
        <UiChip v-for="c in chipsOf(l)" :key="c.label" :tone="c.tone">
          {{ c.label }}<component :is="c.icon" v-if="c.icon" :size="13" :stroke-width="3" aria-hidden="true" />
        </UiChip>
      </div>
    </RouterLink>
    <p v-if="!lessons.length" :class="tiles ? 'px-2.5 py-4' : 'px-4.5 py-6'" class="text-center text-[15px] text-muted">
      {{ empty }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Lesson } from '@/api/types';
import { lessonChips } from '@/components/lessonKinds';
import UiChip from '@/components/ui/UiChip.vue';
import { formatTime, formatUntil, lessonEnd } from '@/features/lessons';
import { studentCaption } from '@/features/students';

const props = defineProps<{
  lessons: Lesson[];
  now: Date;
  /** Ближайшее занятие — лаймовая плашка с «через 2 ч». */
  highlight?: string;
  /** Строки — отдельные скруглённые плашки без разделителей. */
  tiles?: boolean;
  /** Id занятий с пересечением — коралловый чип. */
  clashes?: Set<string>;
  /** «ОГЭ · 90 мин» вместо времени окончания. */
  withDuration?: boolean;
  empty: string;
}>();

const chipsOf = (l: Lesson) => lessonChips(l, props.now, props.clashes ?? new Set());

/** Лаймовая строка ближайшего: статусы текстом рядом со временем — «пересечение · перенос · нет домашки · 16 ч». */
const highlightLabel = (l: Lesson) => {
  const start = new Date(l.startsAt);
  return [
    props.clashes?.has(l.id) && 'пересечение',
    l.isModified && 'перенос',
    !l.assignments.length && 'нет домашки',
    start <= props.now ? 'идёт' : formatUntil(props.now, start),
  ]
    .filter(Boolean)
    .join(' · ');
};
</script>
