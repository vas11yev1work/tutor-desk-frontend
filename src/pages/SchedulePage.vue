<template>
  <div class="flex flex-col gap-4.5 md:gap-5">
    <header class="flex flex-wrap items-center justify-between gap-3.5 md:gap-4">
      <h1 class="order-1 font-display text-[26px] font-semibold tracking-[-0.02em] md:text-[clamp(26px,3vw,34px)]">
        Расписание
      </h1>

      <div class="order-3 flex items-center gap-1.5 max-md:basis-full md:order-2">
        <UiButton variant="ghost" size="icon" aria-label="Предыдущая неделя" @click="shift(-1)">
          <ChevronLeft :size="18" :stroke-width="2" aria-hidden="true" />
        </UiButton>
        <div class="flex min-w-0 flex-1 flex-col gap-px text-center md:min-w-37.5 md:flex-none">
          <span class="text-base font-bold">{{ formatWeekRange(weekStart) }}</span>
          <span class="text-[13px] text-muted">{{ summary }}</span>
        </div>
        <UiButton variant="ghost" size="icon" aria-label="Следующая неделя" @click="shift(1)">
          <ChevronRight :size="18" :stroke-width="2" aria-hidden="true" />
        </UiButton>
        <UiButton variant="ghost" size="sm" class="max-md:hidden" @click="weekStart = startOfWeek(new Date())">
          Сегодня
        </UiButton>
      </div>

      <div class="order-2 flex gap-2.5 md:order-3">
        <label class="relative max-md:hidden">
          <span class="sr-only">Ученик</span>
          <select
            v-model="studentId"
            class="h-11 cursor-pointer appearance-none rounded-[14px] border border-line bg-white pr-10 pl-4 text-sm font-semibold hover:bg-[#f6f7f9]"
          >
            <option value="">Все ученики</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <ChevronDown
            :size="16"
            :stroke-width="2"
            class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
            aria-hidden="true"
          />
        </label>
        <UiButton aria-label="Новое занятие" class="max-md:w-11 max-md:px-0" @click="adding = true">
          <Plus :size="20" :stroke-width="2" aria-hidden="true" />
          <span class="max-md:hidden">Занятие</span>
        </UiButton>
      </div>
    </header>

    <!-- Мобила: полоса дней -->
    <div class="grid grid-cols-7 gap-1 md:hidden">
      <button
        v-for="(day, i) in week"
        :key="i"
        type="button"
        :class="[day.isToday && 'bg-accent', day.isPast ? 'text-subtle' : 'text-ink']"
        class="flex cursor-pointer flex-col items-center gap-1 rounded-[14px] py-2"
        @click="scrollToDay(i)"
      >
        <span class="text-[11px] font-semibold uppercase">{{ weekday(day.date, 'short') }}</span>
        <span class="font-mono text-[17px] font-semibold">{{ day.date.getDate() }}</span>
        <span class="flex h-1.25 gap-0.75">
          <i
            v-for="item in day.items.filter(isLive)"
            :key="item.key"
            :class="day.isPast ? 'bg-[#b7bac8]' : item.kind === 'clash' ? 'bg-alert' : 'bg-ink'"
            class="size-1.25 rounded-full"
          />
        </span>
      </button>
    </div>

    <p v-if="error" class="text-danger">Не удалось загрузить расписание</p>

    <div
      v-for="c in clashes"
      :key="c.pair[0].key"
      role="alert"
      class="flex items-center gap-3 rounded-2xl bg-danger-soft px-4 py-3 text-sm leading-[1.4] text-[#7a1f06]"
    >
      <span class="flex size-7 flex-none items-center justify-center rounded-[9px] bg-alert text-ink">
        <CircleAlert :size="16" :stroke-width="2.4" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1">
        <b>Пересечение {{ IN_WEEKDAY[(c.date.getDay() + 6) % 7] }}:</b>
        {{ c.pair[0].lesson.student.name }} {{ c.pair[0].range }} и {{ c.pair[1].lesson.student.name }}
        {{ c.pair[1].range }}
      </span>
    </div>

    <!-- Десктоп: неделя колонками -->
    <div class="hidden overflow-x-auto card p-4.5 md:block">
      <div class="grid min-w-225 grid-cols-7 gap-3">
        <div
          v-for="(day, i) in week"
          :key="i"
          :class="[day.isToday && 'bg-[#fafdeb]', day.isPast && 'opacity-60']"
          class="-m-2 flex min-h-90 flex-col gap-2 rounded-2xl p-2"
        >
          <div :class="day.isToday && 'bg-accent'" class="flex items-baseline gap-2 rounded-xl px-2.5 py-1.5">
            <b class="text-sm capitalize">{{ weekday(day.date, 'short') }}</b>
            <span class="font-mono text-[13px] text-label">{{ day.date.getDate() }}</span>
            <span v-if="day.liveCount" class="ml-auto font-mono text-[11px] text-label">{{ day.liveCount }}</span>
          </div>
          <RouterLink
            v-for="item in day.items"
            :key="item.key"
            :to="`/lessons/${item.lesson.id}`"
            :class="KIND[item.kind].block"
            class="flex flex-col gap-0.5 rounded-xl px-2.75 py-2.25 text-[13.5px] leading-[1.3] hover:brightness-97"
          >
            <span
              :class="[KIND[item.kind].time, isStruck(item) && 'line-through']"
              class="font-mono text-xs font-semibold"
            >
              {{ item.range }}
            </span>
            <b :class="isStruck(item) && 'line-through'" class="font-semibold">{{ item.lesson.student.name }}</b>
            <span class="text-xs opacity-85">{{ item.caption }}</span>
            <span v-if="!item.lesson.seriesId" class="text-xs opacity-85">Разовое</span>
          </RouterLink>
          <div
            v-if="!day.items.length"
            class="rounded-xl border-[1.5px] border-dashed border-[#cdd0da] px-2.5 py-3 text-[13px] text-muted"
          >
            Выходной
          </div>
        </div>
      </div>
    </div>
    <div class="hidden flex-wrap gap-5 text-[13px] text-label md:flex">
      <span class="flex items-center gap-1.5"><i class="size-3.5 rounded bg-warn-soft" />перенесено</span>
      <span class="flex items-center gap-1.5"><i class="size-3.5 rounded bg-danger-soft" />отменено</span>
      <span class="flex items-center gap-1.5"><i class="size-3.5 rounded bg-alert" />пересечение</span>
    </div>

    <!-- Мобила: список по дням -->
    <div class="flex flex-col gap-5 md:hidden">
      <section
        v-for="(day, i) in week"
        :key="i"
        :ref="el => (dayEls[i] = el as HTMLElement)"
        :class="day.isPast && 'opacity-60'"
        class="flex scroll-mt-4 flex-col gap-2"
      >
        <div class="flex items-center gap-2 px-1">
          <b class="text-[15px] capitalize">{{ weekday(day.date, 'long') }}</b>
          <span class="text-[13px] text-muted">{{ day.date.getDate() }} {{ month(day.date) }}</span>
          <UiChip v-if="day.isToday" tone="accent" class="ml-auto">Сегодня</UiChip>
        </div>
        <div
          v-if="!day.items.length"
          class="rounded-[20px] border-[1.5px] border-dashed border-[#cdd0da] p-4 text-center text-sm text-muted"
        >
          Выходной — занятий нет
        </div>
        <div v-else :class="day.isToday && 'border-ink!'" class="flex flex-col overflow-hidden card">
          <RouterLink
            v-for="(item, j) in day.items"
            :key="item.key"
            :to="`/lessons/${item.lesson.id}`"
            :class="j > 0 && 'border-t border-line-soft'"
            class="flex items-center gap-3 px-3.5 py-3 hover:bg-hover"
          >
            <div :class="isStruck(item) && 'line-through'" class="w-11.5 flex-none font-mono text-sm font-semibold">
              {{ formatTime(item.start) }}
            </div>
            <div class="min-w-0 flex-1">
              <div :class="isStruck(item) && 'line-through'" class="text-[15px] font-semibold">
                {{ item.lesson.student.name }}
              </div>
              <div class="text-[12.5px] text-muted">{{ item.caption }}</div>
              <div v-if="!item.lesson.seriesId" class="text-[12.5px] text-muted">Разовое</div>
            </div>
            <UiChip v-if="KIND[item.kind].chip" :tone="KIND[item.kind].chip!.tone">
              {{ KIND[item.kind].chip!.label }}
            </UiChip>
          </RouterLink>
        </div>
      </section>
    </div>

    <NewLessonDialog v-model:open="adding" />
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Plus } from '@lucide/vue';
import { computed, ref } from 'vue';

import NewLessonDialog from '@/components/NewLessonDialog.vue';
import type { Tone } from '@/components/ui/tones';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import { addDays, formatTime, pluralize, startOfWeek, useLessons } from '@/features/lessons';
import { buildWeek, findClashes, formatWeekRange, type WeekItem, type WeekItemKind } from '@/features/lessons/week';
import { useStudents } from '@/features/students';

// Обводки — ring/outline внутрь: не меняют размер, плашки не прыгают при смене недели.
const KIND: Record<WeekItemKind, { block: string; time: string; chip?: { label: string; tone: Tone } }> = {
  normal: { block: 'bg-white text-ink ring-1 ring-line ring-inset', time: 'text-label' },
  past: { block: 'bg-chip text-label opacity-70', time: 'text-label' },
  movedFrom: {
    block: 'bg-warn-soft text-warn outline-[length:1.5px] outline-offset-[-1.5px] outline-[#d9a93a] outline-dashed',
    time: 'text-warn',
    chip: { label: 'Перенос', tone: 'warn' },
  },
  cancelled: {
    block: 'bg-danger-soft text-[#8a2309]',
    time: 'text-[#8a2309]',
    chip: { label: 'Отменено', tone: 'danger' },
  },
  clash: { block: 'bg-alert text-ink', time: 'text-ink', chip: { label: 'Пересечение', tone: 'alert' } },
};

const IN_WEEKDAY = ['в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу', 'в воскресенье'];

const adding = ref(false);
const weekStart = ref(startOfWeek(new Date()));
const shift = (weeks: number) => (weekStart.value = addDays(weekStart.value, weeks * 7));

const { data: lessons, error } = useLessons(() => ({ from: weekStart.value, to: addDays(weekStart.value, 7) }));
const { data: students } = useStudents();
const studentId = ref('');

const week = computed(() => {
  const list = (lessons.value ?? []).filter(l => !studentId.value || l.student.id === studentId.value);
  return buildWeek(list, weekStart.value, new Date());
});
const clashes = computed(() => findClashes(week.value));

const summary = computed(() => {
  const live = week.value.reduce((n, d) => n + d.liveCount, 0);
  const cancelled = week.value.reduce((n, d) => n + d.items.filter(x => x.kind === 'cancelled').length, 0);
  const parts = [`${live} ${pluralize(live, ['занятие', 'занятия', 'занятий'])}`];
  if (cancelled) parts.push(`${cancelled} ${pluralize(cancelled, ['отмена', 'отмены', 'отмен'])}`);
  return parts.join(' · ');
});

const isLive = (item: WeekItem) => item.kind !== 'cancelled' && item.kind !== 'movedFrom';
const isStruck = (item: WeekItem) => !isLive(item);
const weekday = (d: Date, style: 'short' | 'long') => d.toLocaleDateString('ru', { weekday: style });
const month = (d: Date) => d.toLocaleDateString('ru', { month: 'short' }).replace('.', '');

const dayEls = ref<HTMLElement[]>([]);
const scrollToDay = (i: number) => dayEls.value[i]?.scrollIntoView({ behavior: 'smooth' });
</script>
