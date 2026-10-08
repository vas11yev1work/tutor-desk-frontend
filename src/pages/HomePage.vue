<template>
  <div class="flex flex-col gap-6">
    <header
      class="relative flex flex-col gap-4 max-md:-mx-4 max-md:-mt-4 max-md:rounded-b-[30px] max-md:bg-paper max-md:px-5 max-md:pt-5 max-md:pb-7 max-md:text-white md:flex-row md:flex-wrap md:items-end md:justify-between"
    >
      <div class="flex flex-col gap-2.5">
        <span
          class="flex min-h-11 items-center pr-28 font-mono text-xs tracking-[0.08em] text-accent uppercase md:min-h-0 md:pr-0 md:text-muted"
        >
          {{ todayLabel }}
        </span>
        <h1
          class="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] md:text-[clamp(28px,3vw,38px)]"
        >
          <template v-if="active.length">
            Сегодня
            <span class="inline-block -rotate-2 rounded-[10px] bg-accent px-2.5 text-ink">{{ active.length }}</span>
            {{ pluralize(active.length, ['занятие', 'занятия', 'занятий']) }}
          </template>
          <template v-else>Сегодня свободно</template>
        </h1>
        <p v-if="summary" class="text-[15px] text-white/78 md:text-muted">{{ summary }}</p>
      </div>

      <div class="hidden flex-wrap gap-2.5 md:flex">
        <UiButton variant="ghost" to="/students"><Search :size="18" aria-hidden="true" />Найти ученика</UiButton>
        <UiButton @click="adding = true"><Plus :size="18" :stroke-width="2" aria-hidden="true" />Занятие</UiButton>
      </div>

      <ThemePicker compact class="absolute! top-5 right-18 md:hidden" />
      <button
        type="button"
        aria-label="Выйти"
        class="absolute top-5 right-5 flex size-11 cursor-pointer items-center justify-center rounded-[14px] border border-white/22 bg-white/8 md:hidden"
        @click="logout"
      >
        <LogOut :size="20" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </header>

    <p v-if="error" class="text-danger">Не удалось загрузить расписание</p>

    <section class="flex flex-col gap-3">
      <div class="flex items-baseline justify-between px-1">
        <h2 class="section-title">Сегодня</h2>
        <span v-if="today.length" class="font-mono text-[13px] text-muted">{{ todayRange }}</span>
      </div>
      <LessonList
        :lessons="today"
        :now="now"
        :highlight="next?.id"
        :clashes="clashes"
        tiles
        empty="На сегодня занятий нет"
      />
    </section>

    <section class="flex flex-col gap-3 md:hidden">
      <div class="flex items-baseline justify-between px-1">
        <h2 class="section-title">Завтра</h2>
        <span class="font-mono text-[13px] text-muted">{{ tomorrowLabel }}</span>
      </div>
      <LessonList :lessons="tomorrow" :now="now" :clashes="clashes" with-duration empty="Завтра занятий нет" />
    </section>

    <section class="hidden flex-col gap-3.5 md:flex">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="section-title">Неделя · {{ weekLabel }}</h2>
        <RouterLink to="/schedule" class="text-sm font-semibold text-link hover:text-link-hover">
          Открыть расписание →
        </RouterLink>
      </div>
      <div class="overflow-x-auto card p-3.5">
        <div class="grid min-w-210 grid-cols-7 gap-2.5">
          <div
            v-for="day in week"
            :key="day.date.getTime()"
            :class="[day.isToday && '-m-1.5 rounded-[14px] bg-accent-tint p-1.5', day.isPast && 'opacity-55']"
            class="flex flex-col gap-1.5"
          >
            <div class="flex items-baseline gap-1.5 px-1 pt-1 pb-1.5">
              <b class="text-[13px] capitalize">{{ fmt(day.date, { weekday: 'short' }) }}</b>
              <span class="font-mono text-[13px] text-muted">{{ day.date.getDate() }}</span>
              <UiChip v-if="day.isToday" tone="accent" size="sm" class="ml-auto">сегодня</UiChip>
            </div>
            <RouterLink
              v-for="item in day.items"
              :key="item.key"
              :to="`/lessons/${item.lesson.id}`"
              :class="KIND[item.kind].block"
              class="flex flex-col gap-0.5 rounded-[10px] px-2.5 py-2 text-[13px] hover:brightness-95"
            >
              <span
                :class="[KIND[item.kind].time, isStruck(item) && 'line-through']"
                class="flex items-center gap-1.5 font-mono text-xs font-semibold"
              >
                {{ formatTime(item.start) }}
                <i
                  v-if="item.kind === 'noHomework' || item.kind === 'clash'"
                  class="size-1.5 rounded-full bg-alert"
                  aria-hidden="true"
                />
              </span>
              <span :class="isStruck(item) && 'line-through'">{{ shortName(item.lesson.student.name) }}</span>
              <span v-if="NOTE[item.kind]" class="text-[11.5px] opacity-80">{{ NOTE[item.kind] }}</span>
            </RouterLink>
            <div v-if="!day.items.length" class="px-2.5 py-2 text-[13px] text-subtle">Выходной</div>
          </div>
        </div>
      </div>
    </section>

    <NewLessonDialog v-model:open="adding" />
  </div>
</template>

<script setup lang="ts">
import { LogOut, Plus, Search } from '@lucide/vue';
import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { KIND } from '@/components/lessonKinds';
import LessonList from '@/components/LessonList.vue';
import NewLessonDialog from '@/components/NewLessonDialog.vue';
import ThemePicker from '@/components/ThemePicker.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import { useLogout } from '@/features/auth';
import {
  addDays,
  formatTime,
  formatUntil,
  lessonEnd,
  pluralize,
  sameDay,
  startOfDay,
  startOfWeek,
  useLessons,
} from '@/features/lessons';
import { buildWeek, clashIds, formatWeekRange, type WeekItem, type WeekItemKind } from '@/features/lessons/week';

// Раз в минуту: «через 2 ч», подсветка ближайшего и смена дня в полночь.
const adding = ref(false);
const now = ref(new Date());
const timer = setInterval(() => (now.value = new Date()), 60_000);
onUnmounted(() => clearInterval(timer));
const todayStart = computed(() => startOfDay(now.value).getTime());

const range = computed(() => {
  const from = startOfWeek(new Date(todayStart.value));
  const tomorrowEnd = addDays(new Date(todayStart.value), 2);
  const weekEnd = addDays(from, 7);
  return { from, to: tomorrowEnd > weekEnd ? tomorrowEnd : weekEnd };
});
const { data, error } = useLessons(range);

const startsOn = (day: Date) => (data.value ?? []).filter(l => sameDay(new Date(l.startsAt), day));

const today = computed(() => startsOn(now.value));
const tomorrow = computed(() => startsOn(addDays(now.value, 1)));
const active = computed(() => today.value.filter(l => l.status === 'scheduled'));
const next = computed(() => active.value.find(l => lessonEnd(l) > now.value));

const todayRange = computed(() => {
  const list = active.value.length ? active.value : today.value;
  return `${formatTime(new Date(list[0]!.startsAt))} – ${formatTime(lessonEnd(list.at(-1)!))}`;
});

const summary = computed(() => {
  if (!active.value.length) return '';
  const range = `С ${todayRange.value.replace(' – ', ' до ')}.`;
  if (!next.value) return `${range} На сегодня всё.`;
  const start = new Date(next.value.startsAt);
  return `${range} ${start <= now.value ? 'Сейчас идёт занятие.' : `Ближайшее — через ${formatUntil(now.value, start)}.`}`;
});

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('ru', opts);
const todayLabel = computed(() => {
  const d = now.value;
  return `${fmt(d, { weekday: 'long' })} · ${fmt(d, { day: 'numeric', month: 'long' })}`;
});
const tomorrowLabel = computed(() => {
  const d = addDays(now.value, 1);
  return `${fmt(d, { weekday: 'short' })} ${d.getDate()}.${d.getMonth() + 1}`;
});

const shortName = (name: string) => {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : name;
};

const clashes = computed(() => clashIds(data.value ?? []));

// Та же неделя и те же виды плашек, что в расписании.
const week = computed(() => buildWeek(data.value ?? [], startOfWeek(now.value), now.value));

/** Короткая подпись под именем: статус важнее экзамена. */
const NOTE: Partial<Record<WeekItemKind, string>> = {
  movedFrom: 'перенос',
  cancelled: 'отмена',
  clash: 'пересечение',
  noHomework: 'нет домашки',
};
const isStruck = (item: WeekItem) => item.kind === 'cancelled' || item.kind === 'movedFrom';

const weekLabel = computed(() => formatWeekRange(startOfWeek(now.value)));

const router = useRouter();
const { mutate: logoutMutate } = useLogout();
const logout = () => logoutMutate(undefined, { onSuccess: () => router.replace('/login') });
</script>
