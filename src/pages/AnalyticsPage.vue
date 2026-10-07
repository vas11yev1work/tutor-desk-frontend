<template>
  <div class="flex flex-col gap-5.5 md:-mt-1">
    <div class="flex items-center gap-3 md:hidden">
      <UiButton variant="ghost" size="icon" aria-label="Назад" :to="`/students/${id}`">
        <ChevronLeft :size="20" :stroke-width="2" aria-hidden="true" />
      </UiButton>
      <div class="min-w-0 flex-1">
        <div class="text-[17px] font-bold">Аналитика</div>
        <div class="truncate text-[13px] text-muted">{{ [student?.name, examLabel].filter(Boolean).join(' · ') }}</div>
      </div>
    </div>

    <nav aria-label="Путь" class="hidden flex-wrap items-center gap-2 text-sm text-muted md:flex">
      <RouterLink to="/students" class="font-semibold text-label hover:text-ink">Ученики</RouterLink>
      <ChevronRight :size="14" :stroke-width="2" aria-hidden="true" />
      <RouterLink :to="`/students/${id}`" class="font-semibold text-label hover:text-ink">{{
        student?.name
      }}</RouterLink>
      <ChevronRight :size="14" :stroke-width="2" aria-hidden="true" />
      <span>Аналитика</span>
    </nav>

    <header class="hidden flex-col gap-1.5 md:flex">
      <h1 class="font-display text-[clamp(26px,3vw,34px)] font-semibold tracking-[-0.02em]">
        Аналитика · {{ student?.name }}
      </h1>
      <p class="text-[15px] text-muted">{{ examLabel }}</p>
    </header>

    <p v-if="student && !student.exam" class="text-muted">У ученика не выбран экзамен — аналитики по пробникам нет.</p>
    <p v-else-if="mocks && !scored.length" class="card px-4.5 py-6 text-center text-[15px] text-muted">
      Пока нет оценённых пробников — аналитика появится после первой оценки.
    </p>

    <template v-if="scored.length && max">
      <!-- Динамика первичного балла -->
      <section class="flex flex-col gap-3.5 card p-4 md:p-5.5">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="flex flex-col gap-1">
            <span class="text-[13px] text-muted">Последний</span>
            <span class="font-display text-[50px] leading-none font-bold tracking-[-0.02em] md:text-6xl">
              {{ last.total }}<span class="text-[0.45em] text-subtle"> / {{ maxTotal }}</span>
            </span>
          </div>
          <div class="flex gap-6">
            <div class="flex flex-col gap-0.5">
              <span class="font-mono text-[17px] font-semibold">{{ Math.round((last.total! / maxTotal) * 100) }}%</span>
              <span class="text-xs text-muted">от максимума</span>
            </div>
            <div v-if="scored.length > 1" class="flex flex-col gap-0.5">
              <span class="font-mono text-[17px] font-semibold">{{ signed(last.total! - scored[0]!.total!) }}</span>
              <span class="text-xs text-muted">с Пробника {{ scored[0]!.number }}</span>
            </div>
          </div>
        </div>
        <ScoreChart
          class="hidden max-h-50 md:block"
          :points="
            scored.map(m => ({ value: m.total!, label: `Пробник ${m.number} · ${shortDate(m.lessonStartsAt)}` }))
          "
        />
        <ScoreChart
          class="md:hidden"
          compact
          :points="scored.map(m => ({ value: m.total!, label: `П${m.number} · ${shortDate(m.lessonStartsAt)}` }))"
        />
      </section>

      <!-- Тепловая карта: задания × пробники -->
      <section class="flex flex-col gap-3.5 card p-4 md:p-5.5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="section-title">Задания × пробники</h2>
          <div class="flex flex-wrap gap-3.5 text-[12.5px] text-label">
            <span class="flex items-center gap-1.5"><i class="size-3.5 rounded bg-ink" />полностью</span>
            <span class="flex items-center gap-1.5"><i class="size-3.5 rounded bg-[#b9c1ee]" />частично</span>
            <span class="flex items-center gap-1.5">
              <i class="size-3.5 rounded border border-[#ffc2b0] bg-[#ffe1d8]" />0 баллов
            </span>
          </div>
        </div>

        <!-- Десктоп: пробники строками -->
        <div class="hidden overflow-x-auto md:block">
          <div class="flex min-w-190 flex-col gap-1">
            <div :style="desktopGrid" class="grid items-center gap-1">
              <span />
              <span v-for="(_, t) in max" :key="t" class="py-1 text-center font-mono text-xs font-semibold text-label">
                {{ t + 1 }}
              </span>
            </div>
            <div v-for="m in scored" :key="m.id" :style="desktopGrid" class="grid items-center gap-1">
              <span class="text-[13px] font-semibold">Пробник {{ m.number }}</span>
              <span
                v-for="(score, t) in m.scores!"
                :key="t"
                :class="CELL[cellLevel(score, max[t]!)]"
                class="flex h-8.5 items-center justify-center rounded-lg font-mono text-xs font-semibold"
              >
                <Check v-if="isTick(score, max[t]!)" :size="14" :stroke-width="3" aria-label="верно" />
                <template v-else>{{ cellText(score, max[t]!) }}</template>
              </span>
            </div>
            <div :style="desktopGrid" class="mt-1 grid items-center gap-1 border-t border-line-soft pt-1.5">
              <span class="text-xs text-muted">решено</span>
              <span
                v-for="(p, t) in solved"
                :key="t"
                :class="p >= 67 ? 'text-ink' : p > 0 ? 'text-label' : 'text-danger'"
                class="text-center font-mono text-[11.5px] font-semibold"
              >
                {{ p }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Мобила: задания строками, последние пробники столбцами -->
        <div class="flex flex-col gap-1 md:hidden">
          <div :style="mobileGrid" class="grid items-center gap-1 pb-1 text-xs font-bold text-muted">
            <span>Задание</span>
            <span v-for="m in mobileMocks" :key="m.id" class="text-center">П{{ m.number }}</span>
          </div>
          <div v-for="(_, t) in max" :key="t" :style="mobileGrid" class="grid items-center gap-1">
            <b class="font-mono text-[13px]">{{ t + 1 }}</b>
            <span
              v-for="m in mobileMocks"
              :key="m.id"
              :class="CELL[cellLevel(m.scores![t]!, max[t]!)]"
              class="flex h-7.5 items-center justify-center rounded-lg font-mono text-xs font-semibold"
            >
              <Check v-if="isTick(m.scores![t]!, max[t]!)" :size="14" :stroke-width="3" aria-label="верно" />
              <template v-else>{{ cellText(m.scores![t]!, max[t]!) }}</template>
            </span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import ScoreChart from '@/components/ScoreChart.vue';
import UiButton from '@/components/ui/UiButton.vue';
import { cellLevel, useExamMaxScores, useStudentMocks } from '@/features/assignments';
import { EXAM_LABEL, useStudent } from '@/features/students';

const CELL = {
  full: 'bg-ink text-accent',
  partial: 'bg-[#b9c1ee] text-ink',
  zero: 'bg-[#ffe1d8] text-[#9a2a0a]',
};
/** На мобиле столбцов немного — последние 4 пробника. */
const MOBILE_MOCKS = 4;

const route = useRoute();
const id = computed(() => String(route.params.id));

const { data: student } = useStudent(id);
const { data: mocks } = useStudentMocks(id);
const { data: exams } = useExamMaxScores();

const examLabel = computed(() => (student.value?.exam ? EXAM_LABEL[student.value.exam] : ''));
const max = computed(() => (student.value?.exam ? exams.value?.[student.value.exam] : undefined));
const maxTotal = computed(() => (max.value ?? []).reduce((a, b) => a + b, 0));

/** Только оценённые, по порядку выдачи; баллы — на столько же заданий, сколько у экзамена. */
const scored = computed(() =>
  (mocks.value ?? []).filter(m => m.scores && m.total !== null && m.scores.length === max.value?.length),
);
const last = computed(() => scored.value.at(-1)!);
const mobileMocks = computed(() => scored.value.slice(-MOBILE_MOCKS));

/** Доля набранных баллов по каждому заданию за все оценённые пробники. */
const solved = computed(() =>
  (max.value ?? []).map((mx, t) => {
    const sum = scored.value.reduce((s, m) => s + m.scores![t]!, 0);
    return Math.round((sum / (mx * scored.value.length)) * 100);
  }),
);

const desktopGrid = computed(() => ({
  gridTemplateColumns: `84px repeat(${max.value?.length ?? 0}, minmax(28px, 1fr))`,
}));
const mobileGrid = computed(() => ({
  gridTemplateColumns: `minmax(0, 1.6fr) repeat(${mobileMocks.value.length}, minmax(0, 1fr))`,
}));

/** Задание на 1 балл решено — галочка; иначе «0» или «2/3». */
const isTick = (score: number, mx: number) => mx === 1 && score >= 1;
const cellText = (score: number, mx: number) => (mx === 1 ? '0' : `${score}/${mx}`);
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' }).replace('.', '');
</script>
