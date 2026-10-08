<template>
  <!-- Неверный и перевыпущенный токен бэк не различает — оба 404 -->
  <main v-if="isNotFound" class="flex min-h-screen items-center justify-center px-5 py-10">
    <div class="flex max-w-130 flex-col items-center gap-5 text-center">
      <div class="flex size-19 -rotate-6 items-center justify-center rounded-3xl bg-ink text-accent">
        <Unlink :size="36" :stroke-width="2" aria-hidden="true" />
      </div>
      <h1 class="font-display text-[clamp(26px,3vw,34px)] leading-[1.15] font-semibold tracking-[-0.02em]">
        Эта ссылка больше не работает
      </h1>
      <p class="text-[17px] leading-[1.55] text-label">
        Скорее всего, репетитор выдал вам новую. Попросите её в мессенджере — расписание и домашки откроются по новой
        ссылке.
      </p>
    </div>
  </main>

  <p v-else-if="error" class="p-6 text-danger">Не удалось загрузить данные</p>

  <div v-else-if="student">
    <header class="bg-paper pt-6 pb-23 text-white md:pt-7 md:pb-27.5">
      <div :class="WRAP" class="flex flex-col gap-6.5">
        <UiLogo compact class="max-md:hidden" />
        <div class="flex flex-col gap-2">
          <div v-if="caption" class="font-mono text-xs tracking-[0.08em] text-accent uppercase">{{ caption }}</div>
          <h1 class="font-display text-[clamp(30px,3.4vw,44px)] font-semibold tracking-[-0.02em]">
            Привет, {{ student.name.split(' ')[0] }}
          </h1>
        </div>
      </div>
    </header>

    <main :class="WRAP" class="-mt-18 flex flex-col gap-6.5 pb-10 md:-mt-20 md:gap-8 md:pb-14">
      <div class="grid items-start gap-6.5 md:gap-5.5 lg:grid-cols-2">
        <!-- Ближайшее занятие и его домашка -->
        <section
          v-if="next"
          class="flex flex-col gap-4 rounded-[26px] bg-accent p-5 shadow-[0_16px_40px_-18px_rgb(20_22_43/0.45)] md:gap-5 md:rounded-[28px] md:p-6.5"
        >
          <div class="flex flex-col gap-1.5">
            <span class="font-mono text-xs font-semibold tracking-[0.06em] uppercase">Следующее занятие</span>
            <div class="font-display text-[28px] leading-[1.1] font-bold tracking-[-0.02em] md:text-4xl">
              {{ dayTitle(new Date(next.startsAt)) }}, {{ formatTime(new Date(next.startsAt)) }}
            </div>
            <span class="text-[15px]">{{ longDate(new Date(next.startsAt)) }} · {{ next.durationMin }} минут</span>
          </div>
          <PortalFiles
            v-if="next.assignments.length"
            :files="files(next)"
            class="rounded-[20px] bg-white px-3.5 py-1.5"
          />
          <p v-else class="rounded-[20px] bg-white px-3.5 py-4.5 text-[15px] text-muted">Домашка появится позже</p>
        </section>

        <!-- Остальные занятия -->
        <!-- Остальные занятия; строка с файлами раскрывается -->
        <section v-if="upcoming.length" class="flex flex-col overflow-hidden card lg:mt-1">
          <div
            v-for="(l, i) in upcoming"
            :key="l.id"
            :class="[i > 0 && 'border-t border-line-soft', l.status === 'cancelled' && 'bg-hover']"
          >
            <component
              :is="hasFiles(l) ? 'button' : 'div'"
              :type="hasFiles(l) ? 'button' : undefined"
              :aria-expanded="hasFiles(l) ? openId === l.id : undefined"
              :class="hasFiles(l) && 'cursor-pointer hover:bg-hover'"
              class="flex w-full items-center gap-3.5 py-3 pr-3 pl-4 text-left md:px-4.5 md:py-3.5"
              @click="hasFiles(l) && (openId = openId === l.id ? null : l.id)"
            >
              <div :class="l.status === 'cancelled' && 'line-through'" class="w-14 flex-none font-mono">
                <div :class="l.status === 'cancelled' && 'text-subtle'" class="text-sm font-semibold">
                  {{ dayLabel(new Date(l.startsAt)) }}
                </div>
                <div class="text-[13px] text-muted">{{ formatTime(new Date(l.startsAt)) }}</div>
              </div>
              <div class="min-w-0 flex-1">
                <div :class="l.status === 'cancelled' && 'text-muted'" class="text-[15px] font-semibold">
                  {{ dayTitle(new Date(l.startsAt)) }}
                </div>
                <div class="truncate text-[13px] text-muted">{{ lessonNote(l) }}</div>
              </div>
              <UiChip v-if="l.status === 'cancelled'" tone="danger">Отменено</UiChip>
              <UiChip v-else-if="isMoved(l)" tone="warn">Новое время</UiChip>
              <ChevronDown
                v-if="hasFiles(l)"
                :size="20"
                :stroke-width="2"
                :class="openId === l.id && 'rotate-180'"
                class="flex-none text-muted transition-transform"
                aria-hidden="true"
              />
            </component>
            <PortalFiles v-if="openId === l.id" :files="files(l)" class="bg-surface py-1 pr-3 pl-4 md:px-4.5" />
          </div>
        </section>

        <!-- Пусто: на месте лаймовой карточки, той же формы — страница не «проваливается» -->
        <section
          v-if="lessons && !next && !upcoming.length"
          class="flex flex-col items-start gap-5 rounded-[26px] bg-white p-5 shadow-[0_16px_40px_-18px_rgb(20_22_43/0.45)] md:flex-row md:items-center md:gap-6 md:rounded-[28px] md:p-6.5 lg:col-span-2"
        >
          <div class="flex size-16 flex-none -rotate-6 items-center justify-center rounded-[20px] bg-ink text-accent">
            <CalendarClock :size="30" :stroke-width="2" aria-hidden="true" />
          </div>
          <div class="flex flex-col gap-1.5">
            <h2 class="font-display text-[22px] leading-[1.15] font-semibold tracking-[-0.02em] md:text-[26px]">
              Занятий пока нет
            </h2>
            <p class="max-w-120 text-[15px] leading-normal text-label">
              Когда репетитор назначит занятие, оно появится здесь вместе с домашкой.
            </p>
          </div>
        </section>
      </div>

      <!-- Пробники: как прошлые домашки, плюс итоговый балл после проверки -->
      <section v-if="mocks?.length" class="flex flex-col gap-3">
        <h2 class="px-1 section-title">Пробники</h2>
        <div class="flex flex-col overflow-hidden card">
          <div
            v-for="(m, i) in [...mocks].reverse()"
            :key="m.id"
            :class="i > 0 && 'border-t border-line-soft'"
            class="flex items-center gap-3.5 py-3 pr-3 pl-4 md:px-4.5 md:py-3.5"
          >
            <div class="w-14 flex-none font-mono text-[13px] font-semibold text-muted">
              {{ shortDate(new Date(m.lessonStartsAt)) }}
            </div>
            <div class="min-w-0 flex-1 truncate text-[15px] font-semibold">Пробник {{ m.number }}</div>
            <span v-if="m.total !== null" class="font-display text-[22px] font-semibold tracking-[-0.02em]">
              {{ m.total
              }}<span v-if="student.examMax" class="text-[13px] font-medium tracking-normal text-muted">
                / {{ student.examMax }}</span
              >
            </span>
            <UiChip v-else-if="new Date(m.lessonStartsAt) < now">Проверяется</UiChip>
            <UiButton
              :href="fileUrl(m.id)"
              target="_blank"
              rel="noopener"
              variant="ghost"
              size="sm"
              class="max-md:hidden"
            >
              Открыть
            </UiButton>
            <UiButton
              :href="fileUrl(m.id)"
              :download="m.fileName"
              :aria-label="`Скачать ${m.fileName}`"
              variant="ghost"
              size="icon"
            >
              <Download :size="18" :stroke-width="1.9" aria-hidden="true" />
            </UiButton>
          </div>
        </div>
      </section>

      <section v-if="past.length" class="flex flex-col gap-3">
        <h2 class="px-1 section-title">Прошлые домашки</h2>
        <div class="flex flex-col overflow-hidden card">
          <div
            v-for="(a, i) in past"
            :key="a.id"
            :class="i > 0 && 'border-t border-line-soft'"
            class="flex items-center gap-3.5 py-3 pr-3 pl-4 md:px-4.5 md:py-3.5"
          >
            <div class="w-14 flex-none font-mono text-[13px] font-semibold text-muted">
              {{ shortDate(new Date(a.startsAt)) }}
            </div>
            <div class="min-w-0 flex-1 truncate text-[15px] font-semibold">{{ fileTitle(a) }}</div>
            <UiButton
              :href="fileUrl(a.id)"
              target="_blank"
              rel="noopener"
              variant="ghost"
              size="sm"
              class="max-md:hidden"
            >
              Открыть
            </UiButton>
            <UiButton
              :href="fileUrl(a.id)"
              :download="a.fileName"
              :aria-label="`Скачать ${a.fileName}`"
              variant="ghost"
              size="icon"
            >
              <Download :size="18" :stroke-width="1.9" aria-hidden="true" />
            </UiButton>
          </div>
        </div>
      </section>

      <p class="text-center text-sm text-muted">Решения присылайте в мессенджер, как обычно.</p>
    </main>
  </div>

  <p v-else class="p-6 text-muted">Загрузка…</p>
</template>

<script setup lang="ts">
import { CalendarClock, ChevronDown, Download, Unlink } from '@lucide/vue';
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { api, ApiError, BASE_URL } from '@/api/client';
import type { PortalLesson, PortalMock, StudentPublic } from '@/api/types';
import PortalFiles from '@/components/PortalFiles.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import UiLogo from '@/components/ui/UiLogo.vue';
import { addDays, formatTime, sameDay, startOfDay } from '@/features/lessons';
import { isMoved, splitPortalLessons } from '@/features/portal';
import { EXAM_LABEL } from '@/features/students';

const WRAP = 'mx-auto w-full max-w-270 px-[clamp(16px,4vw,40px)]';

const route = useRoute();
const token = computed(() => String(route.params.token));
const base = computed(() => `/api/s/${encodeURIComponent(token.value)}`);

const { data: student, error } = useQuery({
  queryKey: ['portal', token],
  queryFn: () => api.get<StudentPublic>(base.value),
});
const isNotFound = computed(() => error.value instanceof ApiError && error.value.status === 404);
const caption = computed(() => {
  const s = student.value;
  return s?.exam ? EXAM_LABEL[s.exam] : s?.grade ? `${s.grade} класс` : '';
});

// ponytail: прошлые домашки — за 2 месяца, расписание — на 4 недели вперёд; дальше — пагинация, если понадобится.
const now = new Date();
const range = new URLSearchParams({
  from: addDays(startOfDay(now), -60).toISOString(),
  to: addDays(now, 28).toISOString(),
});
const { data: lessons } = useQuery({
  queryKey: ['portal', token, 'lessons'],
  queryFn: () => api.get<PortalLesson[]>(`${base.value}/lessons?${range}`),
});
const split = computed(() => splitPortalLessons(lessons.value ?? [], now));
const next = computed(() => split.value.next);
const upcoming = computed(() => split.value.upcoming.slice(0, 4));
const past = computed(() => split.value.past);

const { data: mocks } = useQuery({
  queryKey: ['portal', token, 'mocks'],
  queryFn: () => api.get<PortalMock[]>(`${base.value}/mocks`),
});
const mockNumber = (id: string) => mocks.value?.find(m => m.id === id)?.number;
const fileTitle = (a: PortalLesson['assignments'][number]) =>
  a.kind === 'mock' && mockNumber(a.id) ? `Пробник ${mockNumber(a.id)}` : a.fileName;
const fileUrl = (id: string) => `${BASE_URL}${base.value}/files/${id}`;
const files = (l: PortalLesson) =>
  l.assignments.map(a => ({
    id: a.id,
    fileName: a.fileName,
    url: fileUrl(a.id),
    number: a.kind === 'mock' ? mockNumber(a.id) : undefined,
  }));
/** Раскрывается только занятие, которое состоится и к которому уже есть файлы. */
const hasFiles = (l: PortalLesson) => l.status === 'scheduled' && l.assignments.length > 0;
/** Раскрытая строка в списке занятий. */
const openId = ref<string | null>(null);

const weekday = (d: Date, style: 'short' | 'long') => d.toLocaleDateString('ru', { weekday: style });
const capitalize = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const dayLabel = (d: Date) => `${weekday(d, 'short')} ${d.getDate()}`;
const dayTitle = (d: Date) => {
  if (sameDay(d, now)) return 'Сегодня';
  if (sameDay(d, addDays(now, 1))) return 'Завтра';
  return capitalize(weekday(d, 'long'));
};
/** «Среда, 7 октября». */
const longDate = (d: Date) =>
  capitalize(d.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' }));
const shortDate = (d: Date) => d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }).replace('.', '');

const lessonNote = (l: PortalLesson) => {
  if (l.status === 'cancelled') return 'Занятия не будет';
  if (isMoved(l)) {
    const from = new Date(l.originalStartsAt!);
    return `Перенесено с ${sameDay(from, new Date(l.startsAt)) ? formatTime(from) : dayLabel(from)}`;
  }
  const [first, ...rest] = l.assignments;
  if (!first) return 'Домашка появится позже';
  return rest.length ? `${fileTitle(first)} и ещё ${rest.length}` : fileTitle(first);
};
</script>
