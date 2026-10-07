<template>
  <div class="flex flex-col gap-3.5 md:gap-5">
    <header class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="font-display text-[clamp(26px,3vw,34px)] font-semibold tracking-[-0.02em]">Ученики</h1>
        <UiChip
          v-if="students"
          tone="ink"
          size="lg"
          class="font-mono"
          :aria-label="`${students.length} ${pluralize(students.length, ['ученик', 'ученика', 'учеников'])}`"
          >{{ students.length }}</UiChip
        >
      </div>
      <UiButton aria-label="Добавить ученика" class="max-md:w-11 max-md:px-0" @click="adding = true">
        <Plus :size="20" :stroke-width="2" aria-hidden="true" />
        <span class="max-md:hidden">Добавить ученика</span>
      </UiButton>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex-[1_1_100%] md:max-w-105 md:flex-[1_1_320px]">
        <UiTextField v-model="q" label="Поиск по имени" hide-label type="search" placeholder="Найти по имени">
          <template #icon><Search :size="20" :stroke-width="2" /></template>
        </UiTextField>
      </div>
      <div
        class="-mx-4 flex w-[calc(100%+32px)] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:w-auto md:flex-wrap md:overflow-visible md:p-0"
      >
        <button
          v-for="f in FILTERS"
          :key="f.value"
          type="button"
          :aria-pressed="filter === f.value"
          :class="filter === f.value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'"
          class="h-9.5 flex-none cursor-pointer rounded-full border px-3.5 text-[13.5px] font-semibold md:h-10 md:px-4 md:text-sm"
          @click="filter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-danger">Не удалось загрузить учеников</p>

    <!-- Десктоп: таблица -->
    <div v-if="students" class="hidden overflow-x-auto card md:block">
      <div role="table" aria-label="Ученики" class="min-w-175">
        <div
          role="row"
          :class="ROW"
          class="h-12 border-b border-line-card text-xs font-bold tracking-[0.06em] text-muted uppercase"
        >
          <span role="columnheader">Ученик</span>
          <span role="columnheader">Класс</span>
          <span role="columnheader">Экзамен</span>
          <span role="columnheader">Ближайшее занятие</span>
        </div>
        <div
          v-for="s in list"
          :key="s.id"
          role="row"
          :class="ROW"
          class="relative min-h-16 border-b border-line-soft text-[14.5px] hover:bg-hover"
        >
          <span role="cell" class="flex min-w-0 items-center gap-3">
            <UiAvatar :name="s.name" :tone="examTone(s)" />
            <span class="flex min-w-0 flex-col items-start gap-px">
              <!-- after: растягивает ссылку на всю строку -->
              <RouterLink
                :to="`/students/${s.id}`"
                class="text-[15px] font-semibold after:absolute after:inset-0 after:content-['']"
              >
                {{ s.name }}
              </RouterLink>
              <a
                v-if="telegram(s.contact)"
                :href="telegram(s.contact)!.url"
                target="_blank"
                rel="noopener"
                class="relative z-10 text-[13px] text-link hover:text-link-hover hover:underline"
              >
                {{ telegram(s.contact)!.label }}
              </a>
            </span>
          </span>
          <span role="cell" class="text-label">{{ gradeLabel(s) }}</span>
          <span role="cell">
            <UiChip :tone="examTone(s)">{{ s.exam ? EXAM_LABEL[s.exam] : 'Без экзамена' }}</UiChip>
          </span>
          <span role="cell" class="font-mono text-[13.5px]">{{ nextLabel(s.id) }}</span>
        </div>
      </div>
      <p v-if="!list.length" class="px-5 py-7 text-center text-[15px] text-muted">{{ emptyText }}</p>
    </div>

    <!-- Мобила: список -->
    <div v-if="students" class="flex flex-col overflow-hidden card md:hidden">
      <RouterLink
        v-for="(s, i) in list"
        :key="s.id"
        :to="`/students/${s.id}`"
        :class="i > 0 && 'border-t border-line-soft'"
        class="flex items-center gap-3 px-3.5 py-3 hover:bg-hover"
      >
        <UiAvatar :name="s.name" :tone="examTone(s)" />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <b class="text-[15.5px] font-semibold">{{ s.name }}</b>
          <span class="text-[13px] text-muted">{{
            [gradeLabel(s), s.exam ? EXAM_LABEL[s.exam] : 'без экзамена'].join(' · ')
          }}</span>
        </span>
        <span v-if="next.get(s.id)" class="flex flex-none flex-col items-end gap-px">
          <span class="font-mono text-lg font-semibold">{{ fmtWeekday(next.get(s.id)!) }}</span>
          <span class="text-[11px] text-muted">{{ formatTime(next.get(s.id)!) }}</span>
        </span>
      </RouterLink>
      <p v-if="!list.length" class="px-5 py-7 text-center text-sm text-muted">{{ emptyText }}</p>
    </div>

    <StudentFormDialog v-model:open="adding" @saved="s => router.push(`/students/${s.id}`)" />
  </div>
</template>

<script setup lang="ts">
import { Plus, Search } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { Student } from '@/api/types';
import StudentFormDialog from '@/components/StudentFormDialog.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import UiTextField from '@/components/ui/UiTextField.vue';
import { addDays, formatTime, pluralize, sameDay, startOfDay, startOfWeek, useLessons } from '@/features/lessons';
import { EXAM_LABEL, EXAM_TONE, telegram, useStudents } from '@/features/students';

const ROW = 'grid grid-cols-[2.4fr_1fr_1.3fr_1.4fr] items-center gap-3 px-5';

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'ege', label: 'ЕГЭ' },
  { value: 'oge', label: 'ОГЭ' },
  { value: 'none', label: 'Без экзамена' },
] as const;

const { data: students, error } = useStudents();
const q = ref('');
const adding = ref(false);
const router = useRouter();
const filter = ref<(typeof FILTERS)[number]['value']>('all');

const group = (s: Student) => (!s.exam ? 'none' : s.exam === 'oge' ? 'oge' : 'ege');
const list = computed(() => {
  const query = q.value.trim().toLowerCase();
  return (students.value ?? []).filter(
    s => (filter.value === 'all' || group(s) === filter.value) && s.name.toLowerCase().includes(query),
  );
});
const emptyText = computed(() =>
  q.value.trim() ? `Никого не нашли по запросу «${q.value.trim()}»` : 'Учеников пока нет',
);

const examTone = (s: Student) => EXAM_TONE[s.exam ?? 'none'];
const gradeLabel = (s: Student) => (s.grade ? `${s.grade} класс` : 'не школьник');

// Ближайшее занятие каждого ученика — из занятий на две недели вперёд.
const now = new Date();
const { data: lessons } = useLessons({ from: startOfDay(now), to: addDays(now, 15) });
const next = computed(() => {
  const map = new Map<string, Date>();
  for (const l of lessons.value ?? []) {
    const at = new Date(l.startsAt);
    if (l.status === 'scheduled' && at > now && !map.has(l.student.id)) map.set(l.student.id, at);
  }
  return map;
});

const fmtWeekday = (d: Date) => d.toLocaleDateString('ru', { weekday: 'short' });
const nextLabel = (id: string) => {
  const at = next.value.get(id);
  if (!at) return '—';
  const time = formatTime(at);
  if (sameDay(at, now)) return `сегодня ${time}`;
  if (sameDay(at, addDays(now, 1))) return `завтра ${time}`;
  if (at < addDays(startOfWeek(now), 7)) return `${fmtWeekday(at)} ${time}`;
  return `${fmtWeekday(at)} ${at.getDate()}.${String(at.getMonth() + 1).padStart(2, '0')} ${time}`;
};
</script>
