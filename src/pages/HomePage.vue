<template>
  <div class="flex flex-col gap-6">
    <header
      class="relative flex flex-col gap-4 max-md:-mx-4 max-md:-mt-4 max-md:rounded-b-[30px] max-md:bg-paper max-md:px-5 max-md:pt-5 max-md:pb-7 max-md:text-white md:flex-row md:flex-wrap md:items-end md:justify-between"
    >
      <div class="flex flex-col gap-2.5">
        <span
          class="flex min-h-11 items-center pr-14 font-mono text-xs tracking-[0.08em] text-accent uppercase md:min-h-0 md:pr-0 md:text-muted"
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
      </div>

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
      <LessonList :lessons="today" :now="now" :highlight="next?.id" tiles empty="На сегодня занятий нет" />
    </section>

    <section class="flex flex-col gap-3 md:hidden">
      <div class="flex items-baseline justify-between px-1">
        <h2 class="section-title">Завтра</h2>
        <span class="font-mono text-[13px] text-muted">{{ tomorrowLabel }}</span>
      </div>
      <LessonList :lessons="tomorrow" :now="now" with-duration empty="Завтра занятий нет" />
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
            :class="[day.isToday && '-m-1.5 rounded-[14px] bg-[#f7fbe3] p-1.5', day.isPast && 'opacity-55']"
            class="flex flex-col gap-1.5"
          >
            <div class="flex items-baseline gap-1.5 px-1 pt-1 pb-1.5">
              <b class="text-[13px] capitalize">{{ day.weekday }}</b>
              <span class="font-mono text-[13px] text-muted">{{ day.date.getDate() }}</span>
              <span v-if="day.isToday" class="ml-auto chip h-5 bg-accent text-[11px]">сегодня</span>
            </div>
            <div
              v-for="item in day.items"
              :key="item.key"
              :class="day.isToday ? 'bg-ink text-white' : 'bg-[#f4f5f7]'"
              class="flex flex-col gap-0.5 rounded-[10px] px-2.5 py-2 text-[13px]"
            >
              <span
                :class="[item.struck ? 'text-subtle line-through' : day.isToday ? 'text-white/75' : 'text-label']"
                class="font-mono text-xs font-semibold"
              >
                {{ item.time }}
              </span>
              <span :class="item.struck && 'text-subtle line-through'">{{ item.name }}</span>
              <span v-if="item.caption" :class="day.isToday ? 'text-white/70' : 'text-[#6b6f86]'" class="text-[11.5px]">
                {{ item.caption }}
              </span>
            </div>
            <div v-if="!day.items.length" class="px-2.5 py-2 text-[13px] text-subtle">Выходной</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { LogOut, Search } from '@lucide/vue';
import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { Lesson } from '@/api/types';
import LessonList from '@/components/LessonList.vue';
import UiButton from '@/components/ui/UiButton.vue';
import { useLogout } from '@/features/auth';
import {
  addDays,
  formatIn,
  formatTime,
  lessonEnd,
  movedFrom,
  pluralize,
  sameDay,
  startOfDay,
  startOfWeek,
  useLessons,
} from '@/features/lessons';

// Раз в минуту: «через 2 ч», подсветка ближайшего и смена дня в полночь.
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
  return `${range} ${start <= now.value ? 'Сейчас идёт занятие.' : `Ближайшее — ${formatIn(now.value, start)}.`}`;
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

const week = computed(() => {
  const from = startOfWeek(now.value);
  const lessons = data.value ?? [];
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    const items = lessons.flatMap((l: Lesson) => {
      const name = shortName(l.student.name);
      const original = movedFrom(l);
      const out = [];
      if (original && sameDay(original, date)) {
        const to = new Date(l.startsAt);
        out.push({
          key: `${l.id}-from`,
          at: original,
          time: formatTime(original),
          name,
          struck: true,
          caption: `перенос на ${fmt(to, { weekday: 'short' })}`,
        });
      }
      if (sameDay(new Date(l.startsAt), date)) {
        const cancelled = l.status === 'cancelled';
        out.push({
          key: l.id,
          at: new Date(l.startsAt),
          time: formatTime(new Date(l.startsAt)),
          name,
          struck: cancelled,
          caption: cancelled ? 'отмена' : '',
        });
      }
      return out;
    });
    return {
      date,
      weekday: fmt(date, { weekday: 'short' }),
      isToday: sameDay(date, now.value),
      isPast: date < startOfDay(now.value),
      items: items.sort((a, b) => a.at.getTime() - b.at.getTime()),
    };
  });
});

const weekLabel = computed(() => {
  const [first, last] = [week.value[0]!.date, week.value[6]!.date];
  return first.getMonth() === last.getMonth()
    ? `${first.getDate()} – ${fmt(last, { day: 'numeric', month: 'long' })}`
    : `${fmt(first, { day: 'numeric', month: 'long' })} – ${fmt(last, { day: 'numeric', month: 'long' })}`;
});

const router = useRouter();
const { mutate: logoutMutate } = useLogout();
const logout = () => logoutMutate(undefined, { onSuccess: () => router.replace('/login') });
</script>
