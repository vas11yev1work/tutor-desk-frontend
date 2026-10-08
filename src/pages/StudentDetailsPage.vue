<template>
  <div class="flex flex-col gap-5.5 md:-mt-1">
    <nav aria-label="Путь" class="hidden items-center gap-2 text-sm text-muted md:flex">
      <RouterLink to="/students" class="font-semibold text-label hover:text-ink">Ученики</RouterLink>
      <ChevronRight :size="14" :stroke-width="2" aria-hidden="true" />
      <span>{{ student?.name }}</span>
    </nav>

    <p v-if="error" class="text-danger">{{ isNotFound ? 'Ученик не найден' : 'Не удалось загрузить ученика' }}</p>

    <!-- От 1200px — две колонки; уже — профиль над занятиями (сайдбар съедает 240px). -->
    <div v-if="student" class="flex flex-col gap-5.5 min-[1200px]:flex-row min-[1200px]:items-start">
      <!-- Профиль -->
      <section
        class="flex flex-col gap-4.5 bg-paper text-white max-md:-mx-4 max-md:-mt-4 max-md:rounded-b-[30px] max-md:px-4 max-md:pt-3 max-md:pb-5.5 min-[980px]:max-[1200px]:grid min-[980px]:max-[1200px]:grid-cols-2 min-[980px]:max-[1200px]:items-start min-[980px]:max-[1200px]:gap-x-8 min-[980px]:max-[1200px]:gap-y-4.5 min-[980px]:max-[1200px]:[grid-template-areas:'head_link'_'contact_cover'_'theme_cover'_'btns_cover'_'notes_notes'] min-[1200px]:flex-[1_1_320px] md:gap-5 md:rounded-[26px] md:p-6"
      >
        <RouterLink
          to="/students"
          aria-label="Назад к ученикам"
          class="flex size-11 items-center justify-center rounded-[14px] border border-white/22 bg-white/8 hover:bg-white/16 md:hidden"
        >
          <ChevronLeft :size="20" :stroke-width="2" aria-hidden="true" />
        </RouterLink>

        <!-- 980–1199px: две колонки «шапка, контакт, тема, кнопки» | «ссылка, обложка», заметки на всю ширину.
             На остальных ширинах блоки идут столбцом в порядке разметки. -->
        <div class="flex items-center gap-4 min-[980px]:max-[1200px]:[grid-area:head]">
          <UiAvatar :name="student.name" :tone="EXAM_TONE[student.exam ?? 'none']" size="lg" />
          <div class="flex min-w-0 flex-col gap-2">
            <h1 class="font-display text-[23px] leading-[1.15] font-semibold tracking-[-0.02em]">
              {{ student.name }}
            </h1>
            <div class="flex flex-wrap gap-1.5">
              <UiChip tone="glass">{{ student.grade ? `${student.grade} класс` : 'не школьник' }}</UiChip>
              <UiChip v-if="student.exam" :tone="EXAM_TONE[student.exam]">{{ EXAM_LABEL[student.exam] }}</UiChip>
            </div>
          </div>
        </div>

        <div v-if="tg" class="flex flex-col gap-1 min-[980px]:max-[1200px]:[grid-area:contact]">
          <span :class="CAPTION">Telegram</span>
          <a :href="tg.url" target="_blank" rel="noopener" class="self-start text-[15px] text-accent hover:underline">
            {{ tg.label }}
          </a>
        </div>

        <div class="flex flex-col gap-2 min-[980px]:max-[1200px]:[grid-area:link]">
          <span :class="CAPTION">Личная ссылка ученика</span>
          <div class="flex h-13 items-center gap-2.5 rounded-[14px] border border-ink-line bg-ink pr-1.25 pl-4">
            <span class="min-w-0 flex-1 truncate font-mono text-[13px]">{{ linkLabel }}</span>
            <button
              type="button"
              aria-label="Скопировать ссылку"
              class="flex size-10 flex-none cursor-pointer items-center justify-center rounded-[10px] bg-accent text-ink"
              @click="copyLink"
            >
              <Copy :size="18" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            :disabled="regenerating"
            class="flex min-h-9 cursor-pointer items-center gap-1.5 self-start px-0.5 text-[13.5px] font-medium text-white/72 hover:text-white disabled:opacity-60"
            @click="confirmingRegenerate = true"
          >
            Перевыпустить — старая перестанет работать
          </button>
        </div>

        <div
          class="flex flex-col gap-2 min-[980px]:max-[1200px]:[grid-area:cover]"
          @dragover.prevent="draggingCover = true"
          @dragleave="draggingCover = false"
          @drop.prevent="onCoverDrop"
        >
          <span :class="CAPTION">Обложка кабинета</span>
          <input ref="coverPicker" type="file" :accept="COVER_ACCEPT" class="hidden" @change="onCoverPick" />
          <div
            v-if="coverUrl"
            :class="draggingCover ? 'border-white/60' : 'border-ink-line'"
            class="relative h-28 overflow-hidden rounded-2xl border bg-cover bg-center"
            :style="{ backgroundImage: `url(${coverUrl})` }"
          >
            <div class="absolute right-2 bottom-2 flex gap-1.5">
              <button
                type="button"
                :disabled="savingCover"
                :class="COVER_BUTTON"
                class="bg-white px-3"
                @click="coverPicker?.click()"
              >
                <Upload :size="16" :stroke-width="2" aria-hidden="true" />{{ savingCover ? 'Загружаем…' : 'Заменить' }}
              </button>
              <button
                type="button"
                aria-label="Убрать обложку"
                :disabled="savingCover"
                :class="COVER_BUTTON"
                class="w-9 bg-danger-soft text-danger"
                @click="setCover(null)"
              >
                <X :size="16" :stroke-width="2.2" aria-hidden="true" />
              </button>
            </div>
          </div>
          <template v-else>
            <div
              :class="draggingCover ? 'border-white/60' : 'border-ink-line'"
              class="flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-paper"
            >
              <button
                type="button"
                :disabled="savingCover"
                :class="COVER_BUTTON"
                class="bg-accent px-3"
                @click="coverPicker?.click()"
              >
                <Upload :size="16" :stroke-width="2" aria-hidden="true" />
                {{ savingCover ? 'Загружаем…' : 'Загрузить картинку' }}
              </button>
              <span class="text-[12.5px] text-white/60">или перетащите файл сюда</span>
            </div>
            <ul
              class="mt-0.5 flex list-disc flex-col gap-1 pl-4.5 text-[13px] leading-[1.45] text-white/72 marker:text-accent"
            >
              <li>Это фон шапки в кабинете ученика. Пока обложки нет — там фон в клетку.</li>
              <li>Горизонтальная картинка, лучше от 1600×600 px.</li>
              <li>JPG, PNG или WebP, до {{ MAX_COVER_MB }} МБ.</li>
              <li>
                Главное держите по центру: на телефоне края обрежутся, а внизу слева встанет «Привет,
                {{ student.name.split(' ')[0] }}».
              </li>
            </ul>
          </template>
        </div>

        <div class="flex flex-col gap-2 min-[980px]:max-[1200px]:[grid-area:theme]">
          <span :class="CAPTION">Тема кабинета</span>
          <ThemePicker
            :model-value="studentTheme"
            variant="field"
            label="Тема кабинета ученика"
            @update:model-value="setStudentTheme"
          />
        </div>

        <div class="-mt-2 flex gap-2 min-[980px]:max-[1200px]:mt-0 min-[980px]:max-[1200px]:[grid-area:btns]">
          <UiButton variant="light" size="sm" class="flex-1" @click="editing = true">
            <Pencil :size="16" :stroke-width="2" aria-hidden="true" />Изменить
          </UiButton>
          <UiButton variant="danger" size="sm" @click="confirmingDelete = true">
            <Trash2 :size="16" :stroke-width="2" aria-hidden="true" />Удалить
          </UiButton>
        </div>

        <div v-if="student.notes" class="flex flex-col gap-2 min-[980px]:max-[1200px]:[grid-area:notes]">
          <span :class="CAPTION">Заметки для себя</span>
          <p
            class="rounded-[14px] border border-white/22 bg-ink px-4 py-3.5 text-[15px] leading-[1.55] whitespace-pre-line text-white/90"
          >
            {{ student.notes }}
          </p>
        </div>
      </section>

      <!-- Занятия -->
      <div class="flex min-w-0 flex-col gap-5.5 min-[1200px]:flex-[2_1_520px]">
        <!-- Последний оценённый пробник — ведёт в аналитику -->
        <RouterLink
          v-if="lastScored"
          :to="`/students/${id}/analytics`"
          class="flex flex-wrap items-center gap-3.5 rounded-[20px] bg-accent px-4 py-3.5 text-ink hover:brightness-97 md:gap-5 md:rounded-3xl md:px-6 md:py-5"
        >
          <div class="flex flex-auto flex-col gap-2">
            <div class="font-display text-[40px] leading-none font-bold tracking-[-0.02em] md:text-[56px]">
              {{ lastScored.total }}<span v-if="examMax" class="text-[0.45em] opacity-55"> / {{ examMax }}</span>
            </div>
            <div class="font-mono text-[13px] font-semibold">
              Пробник {{ lastScored.number
              }}<template v-if="delta !== null"> · {{ delta > 0 ? `+${delta}` : delta }} к прошлому</template>
            </div>
          </div>
          <span class="flex items-center gap-1 text-sm font-bold">
            Аналитика <ChevronRight :size="18" :stroke-width="2" aria-hidden="true" />
          </span>
        </RouterLink>

        <section v-if="series?.length" class="flex flex-col gap-2.5">
          <h2 class="px-1 section-title">Регулярные занятия</h2>
          <div v-for="s in series" :key="s.id" class="flex items-center gap-3 card px-4 py-3.5">
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <div class="text-[15px] font-semibold">{{ weekdayLong(s.weekday) }}</div>
              <div class="text-[13px] text-muted">{{ seriesCaption(s) }}</div>
            </div>
            <UiButton variant="ghost" size="xs" @click="editingSeries = s">Изменить</UiButton>
          </div>
        </section>

        <section class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between px-1">
            <h2 class="section-title">Ближайшие занятия</h2>
            <button
              type="button"
              class="flex min-h-8 cursor-pointer items-center text-sm font-semibold text-link hover:text-link-hover"
              @click="addingLesson = true"
            >
              + Добавить
            </button>
          </div>
          <div class="flex flex-col overflow-hidden card">
            <RouterLink
              v-for="(l, i) in upcoming"
              :key="l.id"
              :to="`/lessons/${l.id}`"
              :class="i > 0 && 'border-t border-line-soft'"
              class="flex items-center gap-3.5 px-3.5 py-3 hover:bg-hover md:px-4.5"
            >
              <div class="w-12.5 flex-none">
                <div class="font-mono text-sm font-semibold">
                  {{ dayLabel(new Date(l.startsAt)) }}
                </div>
                <div :class="l.status === 'cancelled' && 'line-through'" class="font-mono text-[13px] text-muted">
                  {{ formatTime(new Date(l.startsAt)) }}
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div :class="l.status === 'cancelled' && 'text-muted line-through'" class="text-[15px] font-semibold">
                  {{ dayTitle(new Date(l.startsAt)) }}
                </div>
                <template v-if="l.status !== 'cancelled'">
                  <div class="truncate text-[13px] text-muted">{{ homeworkNote(l) }}</div>
                  <div v-if="movedNote(l)" class="truncate text-[13px] text-muted">{{ movedNote(l) }}</div>
                </template>
              </div>
              <!-- Все статусы сразу: перенос и домашка независимы; у отменённого — только «Отменено» -->
              <div class="flex flex-none flex-wrap justify-end gap-1.5">
                <UiChip v-if="l.status === 'cancelled'" tone="danger">Отменено</UiChip>
                <template v-else>
                  <UiChip v-if="l.isModified" tone="warn">Перенос</UiChip>
                  <UiChip v-if="l.assignments.length"
                    >Домашка<Check :size="13" :stroke-width="3" aria-hidden="true"
                  /></UiChip>
                  <UiChip v-else tone="danger">Нет домашки</UiChip>
                </template>
              </div>
            </RouterLink>
            <p v-if="lessons && !upcoming.length" class="px-4.5 py-6 text-center text-[15px] text-muted">
              Ближайших занятий нет
            </p>
          </div>
        </section>

        <!-- Пробники: строка ведёт на оценку; неоценённые выделены, как в макете -->
        <section v-if="mocks?.length || student.exam" class="flex flex-col gap-2.5">
          <h2 class="px-1 section-title">Пробники</h2>
          <div class="flex flex-col overflow-hidden card">
            <RouterLink
              v-for="(m, i) in [...(mocks ?? [])].reverse()"
              :key="m.id"
              :to="`/students/${id}/mocks/${m.id}`"
              :class="[i > 0 && 'border-t border-line-soft', m.total === null ? 'bg-[#fff5f2]' : 'hover:bg-hover']"
              class="flex items-center gap-3.5 px-3.5 py-3 hover:brightness-98 md:px-4.5"
            >
              <div
                :class="m.total === null ? 'bg-danger-soft text-danger' : 'bg-chip text-ink'"
                class="flex size-11 flex-none items-center justify-center rounded-[14px] font-display text-base"
              >
                {{ m.number }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-[15px] font-semibold">
                  Пробник {{ m.number }}<template v-if="student.exam"> · {{ EXAM_LABEL[student.exam] }}</template>
                </div>
                <div class="truncate text-[13px] text-muted">{{ shortDate(m.lessonStartsAt) }} · {{ m.fileName }}</div>
              </div>
              <!-- Оценённый — первичный балл, нет — «Оценить» (вся строка — ссылка на оценку) -->
              <span v-if="m.total !== null" class="font-display text-[22px] font-semibold tracking-[-0.02em]">
                {{ m.total
                }}<span v-if="examMax" class="text-[13px] font-medium tracking-normal text-muted">
                  / {{ examMax }}</span
                >
              </span>
              <span
                v-else
                class="inline-flex min-h-9.5 items-center rounded-xl bg-ink px-3 text-[13.5px] font-semibold text-white"
              >
                Оценить
              </span>
            </RouterLink>
            <p v-if="mocks && !mocks.length" class="px-4.5 py-6 text-center text-[15px] text-muted">
              Пробников пока нет — их выдают на странице занятия
            </p>
          </div>
        </section>
      </div>
    </div>

    <StudentFormDialog v-if="student" v-model:open="editing" :student="student" />
    <UiConfirmDialog
      v-model:open="confirmingRegenerate"
      title="Перевыпустить ссылку?"
      confirm-label="Перевыпустить"
      :loading="regenerating"
      @confirm="regenerateLink"
    >
      Старая ссылка сразу перестанет работать — новую нужно будет отправить ученику.
    </UiConfirmDialog>
    <UiConfirmDialog
      v-if="student"
      v-model:open="confirmingDelete"
      title="Удалить ученика?"
      confirm-label="Удалить"
      :loading="deleting"
      @confirm="remove"
    >
      {{ student.name }} пропадёт навсегда вместе со всеми занятиями. Вернуть не получится.
    </UiConfirmDialog>
    <NewLessonDialog v-model:open="addingLesson" :default-student-id="id" />
    <EditSeriesDialog
      v-if="student"
      :open="!!editingSeries"
      :student="student"
      :series="editingSeries ?? undefined"
      @update:open="v => !v && (editingSeries = null)"
    />
  </div>
</template>

<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, Copy, Pencil, Trash2, Upload, X } from '@lucide/vue';
import { computed, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import { ApiError } from '@/api/client';
import type { Lesson, Series } from '@/api/types';
import EditSeriesDialog from '@/components/EditSeriesDialog.vue';
import NewLessonDialog from '@/components/NewLessonDialog.vue';
import StudentFormDialog from '@/components/StudentFormDialog.vue';
import ThemePicker from '@/components/ThemePicker.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import UiConfirmDialog from '@/components/ui/UiConfirmDialog.vue';
import { useExamMaxScores, useStudentMocks } from '@/features/assignments';
import { addDays, formatTime, lessonEnd, sameDay, startOfDay } from '@/features/lessons';
import {
  checkCover,
  COVER_ACCEPT,
  EXAM_LABEL,
  EXAM_TONE,
  MAX_COVER_MB,
  portalUrl,
  seriesCaption,
  studentCoverUrl,
  telegram,
  useDeleteStudent,
  useRegenerateToken,
  useSetCover,
  useStudent,
  useStudentLessons,
  useStudentSeries,
  useUpdateStudent,
  weekdayLong,
} from '@/features/students';
import { rememberTheme } from '@/features/theme';

const CAPTION = 'text-xs font-semibold tracking-[0.06em] text-white/60 uppercase';

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));

const { data: student, error } = useStudent(id);
const isNotFound = computed(() => error.value instanceof ApiError && error.value.status === 404);
const tg = computed(() => telegram(student.value?.contact ?? null));
const editing = ref(false);
const addingLesson = ref(false);
/** Правило, открытое в окне «Регулярное расписание». */
const editingSeries = ref<Series | null>(null);

// Ссылка
const linkLabel = computed(() => student.value && portalUrl(student.value.accessToken).replace(/^https?:\/\//, ''));
const copyLink = async () => {
  if (!student.value) return;
  try {
    await navigator.clipboard.writeText(portalUrl(student.value.accessToken));
    toast.success('Ссылка скопирована');
  } catch {
    toast.error('Не удалось скопировать ссылку');
  }
};

const { mutate: regenerate, isPending: regenerating } = useRegenerateToken(id);
const confirmingRegenerate = ref(false);
const regenerateLink = () =>
  regenerate(undefined, {
    onSuccess: () => {
      confirmingRegenerate.value = false;
      toast.success('Новая ссылка готова');
    },
    onError: () => toast.error('Не удалось перевыпустить ссылку'),
  });

// Тема кабинета ученика: выбранная видна сразу, пока идёт сохранение
const { mutate: updateStudent, variables: themeVars, isPending: savingTheme } = useUpdateStudent(id);
const studentTheme = computed(
  () => (savingTheme.value ? themeVars.value?.theme : undefined) ?? student.value?.theme ?? 'lime',
);
// Портал ученика, открытый в этом браузере, тоже сразу в новой теме
const setStudentTheme = (theme: string) =>
  updateStudent(
    { theme },
    {
      onSuccess: s => rememberTheme(s.theme, s.accessToken),
      onError: () => toast.error('Не удалось сменить тему. Попробуйте ещё раз'),
    },
  );

// Обложка портала: выбор файла или перетаскивание; бэкенд ещё раз проверит тип по сигнатуре.
const COVER_BUTTON =
  'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] text-[13.5px] font-semibold text-ink disabled:opacity-60';
const coverPicker = useTemplateRef('coverPicker');
const draggingCover = ref(false);
const coverUrl = computed(() => student.value && studentCoverUrl(student.value));
const { mutate: saveCover, isPending: savingCover } = useSetCover(id);
const setCover = (file: File | null) => {
  const problem = file && checkCover(file);
  if (problem) return void toast.error(problem);
  saveCover(file, {
    onError: e =>
      toast.error(
        e instanceof ApiError && e.status < 500 ? e.message : 'Не удалось сохранить обложку. Попробуйте ещё раз',
      ),
  });
};
const onCoverPick = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) setCover(file);
};
const onCoverDrop = (e: DragEvent) => {
  draggingCover.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) setCover(file);
};

const { mutate: deleteStudent, isPending: deleting } = useDeleteStudent(id);
const confirmingDelete = ref(false);
const remove = () =>
  deleteStudent(undefined, {
    onSuccess: () => {
      toast.success('Ученик удалён');
      void router.replace('/students');
    },
    onError: () => toast.error('Не удалось удалить ученика'),
  });

// Ближайшие 3 занятия, которые ещё не закончились.
const now = new Date();
const { data: lessons } = useStudentLessons(id, { from: startOfDay(now), to: addDays(now, 28) });
const upcoming = computed(() => (lessons.value ?? []).filter(l => lessonEnd(l) > now).slice(0, 3));

const { data: series } = useStudentSeries(id);

const { data: mocks } = useStudentMocks(id);
const { data: exams } = useExamMaxScores();
/** Максимальный первичный балл экзамена ученика — «16 / 32». */
const examMax = computed(() => {
  const max = student.value?.exam && exams.value?.[student.value.exam];
  return max ? max.reduce((a, b) => a + b, 0) : null;
});
const scored = computed(() => (mocks.value ?? []).filter(m => m.total !== null));
const lastScored = computed(() => scored.value.at(-1));
const delta = computed(() => {
  const [prev, last] = scored.value.slice(-2);
  return prev && last ? last.total! - prev.total! : null;
});
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' }).replace('.', '');

const weekday = (d: Date, style: 'short' | 'long') => d.toLocaleDateString('ru', { weekday: style });
const dayLabel = (d: Date) => `${weekday(d, 'short')} ${d.getDate()}`;
const dayTitle = (d: Date) => {
  if (sameDay(d, now)) return 'Сегодня';
  if (sameDay(d, addDays(now, 1))) return 'Завтра';
  const w = weekday(d, 'long');
  return w[0]!.toUpperCase() + w.slice(1);
};
/** «Логарифмы.pdf», «Логарифмы.pdf и ещё 1» или «Домашки пока нет». */
const homeworkNote = (l: Lesson) => {
  const [first, ...rest] = l.assignments;
  if (!first) return 'Домашки пока нет';
  return rest.length ? `${first.fileName} и ещё ${rest.length}` : first.fileName;
};

const movedNote = (l: Lesson) => {
  if (!l.isModified || !l.originalStartsAt) return '';
  const from = new Date(l.originalStartsAt);
  return `Перенесено с ${sameDay(from, new Date(l.startsAt)) ? formatTime(from) : dayLabel(from)}`;
};
</script>
