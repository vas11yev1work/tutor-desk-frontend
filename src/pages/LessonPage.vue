<template>
  <div class="flex flex-col gap-5.5 md:-mt-1">
    <div class="flex items-center justify-between md:hidden">
      <UiButton variant="ghost" size="icon" aria-label="Назад" @click="back">
        <ChevronLeft :size="20" :stroke-width="2" aria-hidden="true" />
      </UiButton>
      <span class="text-base font-bold">Занятие</span>
      <span class="w-11" />
    </div>

    <nav aria-label="Путь" class="hidden items-center gap-2 text-sm text-muted md:flex">
      <RouterLink to="/schedule" class="font-semibold text-label hover:text-ink">Расписание</RouterLink>
      <ChevronRight :size="14" :stroke-width="2" aria-hidden="true" />
      <span v-if="lesson">{{ lesson.student.name }}, {{ fmt(start!, { day: 'numeric', month: 'long' }) }}</span>
    </nav>

    <p v-if="error" class="text-danger">{{ isNotFound ? 'Занятие не найдено' : 'Не удалось загрузить занятие' }}</p>

    <div
      v-if="lesson && start"
      class="grid grid-cols-[minmax(0,1fr)] items-start gap-5.5 [grid-template-areas:'card'_'hw'_'acts'] min-[1200px]:grid-cols-[minmax(300px,1fr)_minmax(0,1.7fr)] min-[1200px]:[grid-template-areas:'card_hw'_'acts_hw']"
    >
      <!-- От 1200px как в макете: слева карточка и действия, справа домашка (сайдбар съедает 240px).
           Уже — один столбец: карточка, домашка, действия. -->
      <section class="flex flex-col gap-4.5 rounded-[26px] bg-paper p-5.5 text-white [grid-area:card]">
        <div class="flex flex-col gap-1.5">
          <div class="font-mono text-xs tracking-[0.08em] text-accent uppercase">{{ dateLabel }}</div>
          <div
            :class="cancelled && 'line-through decoration-2'"
            class="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.02em] md:text-[44px]"
          >
            {{ formatTime(start) }}<span class="text-white/45"> – {{ formatTime(lessonEnd(lesson)) }}</span>
          </div>
        </div>

        <RouterLink
          :to="`/students/${lesson.student.id}`"
          class="flex items-center gap-3 rounded-[14px] border border-[#48495a] bg-ink p-3 hover:border-white/40"
        >
          <UiAvatar :name="lesson.student.name" :tone="EXAM_TONE[lesson.student.exam ?? 'none']" />
          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <div class="text-[17px] font-bold">{{ lesson.student.name }}</div>
            <div class="text-[13px] text-white/72">{{ studentLine }}</div>
          </div>
          <ChevronRight :size="20" :stroke-width="2" aria-hidden="true" />
        </RouterLink>

        <div class="flex flex-wrap gap-2">
          <UiChip v-if="cancelled" tone="danger">Отменено</UiChip>
          <UiChip v-if="lesson.seriesId" tone="glass">
            <Repeat :size="14" :stroke-width="2" aria-hidden="true" />
            {{ everyLabel }}
          </UiChip>
          <UiChip v-else tone="glass"><Dot :size="14" :stroke-width="4" aria-hidden="true" />Разовое</UiChip>
          <UiChip tone="glass">
            {{ lesson.durationMin }} {{ pluralize(lesson.durationMin, ['минута', 'минуты', 'минут']) }}
          </UiChip>
          <UiChip v-if="movedNote" tone="warn">{{ movedNote }}</UiChip>
        </div>
      </section>

      <div class="flex min-w-0 flex-col gap-5.5 [grid-area:hw]">
        <HomeworkSection :lesson="lesson" />
      </div>

      <!-- Действия -->
      <div class="flex flex-col gap-5.5 [grid-area:acts]">
        <section class="flex flex-col gap-2.5">
          <h2 class="px-1 section-title">Это занятие</h2>
          <div class="flex flex-col overflow-hidden card">
            <UiActionRow
              v-if="!cancelled"
              title="Перенести"
              :hint="
                lesson.seriesId
                  ? `Только ${fmt(start, { day: 'numeric', month: 'long' })}, остальные не изменятся`
                  : 'Выбрать новую дату и время'
              "
              @click="moving = true"
            >
              <template #icon><ArrowRightLeft :size="18" :stroke-width="1.9" /></template>
            </UiActionRow>
            <UiActionRow
              v-if="!cancelled"
              title="Отменить"
              hint="Ученик увидит отмену в кабинете"
              danger
              :disabled="isPending"
              @click="cancel"
            >
              <template #icon><X :size="18" :stroke-width="1.9" /></template>
            </UiActionRow>
            <UiActionRow
              v-else
              title="Вернуть занятие"
              hint="Снова появится в расписании ученика"
              :disabled="isPending"
              @click="restore"
            >
              <template #icon><RotateCcw :size="18" :stroke-width="1.9" /></template>
            </UiActionRow>
            <UiActionRow
              v-if="!lesson.seriesId"
              title="Удалить занятие"
              hint="Пропадёт из расписания у вас и у ученика — без пометки «отменено»"
              danger
              :disabled="deleting"
              @click="confirmingDelete = true"
            >
              <template #icon><Trash2 :size="18" :stroke-width="1.9" /></template>
            </UiActionRow>
          </div>
        </section>

        <section v-if="lesson.seriesId" class="flex flex-col gap-2.5">
          <h2 class="px-1 section-title">Регулярное расписание</h2>
          <div class="flex flex-col overflow-hidden card">
            <UiActionRow title="Изменить с даты" hint="Новый день, время или длительность" @click="editSeries('edit')">
              <template #icon><Calendar :size="18" :stroke-width="1.9" /></template>
            </UiActionRow>
            <UiActionRow
              title="Завершить регулярные"
              hint="Последнее занятие — выберете дату"
              @click="editSeries('end')"
            >
              <template #icon><Square :size="18" :stroke-width="1.9" /></template>
            </UiActionRow>
          </div>
        </section>
      </div>
    </div>

    <template v-if="lesson">
      <MoveLessonDialog v-model:open="moving" :lesson="lesson" />
      <UiConfirmDialog
        v-model:open="confirmingDelete"
        title="Удалить занятие?"
        confirm-label="Удалить"
        :loading="deleting"
        @confirm="remove"
      >
        Занятие пропадёт из расписания у вас и у ученика. Вернуть его не получится.
      </UiConfirmDialog>
      <EditSeriesDialog
        v-if="lesson.seriesId"
        v-model:open="seriesOpen"
        :student="lesson.student"
        :series="lessonSeries"
        :default-date="toIsoDate(new Date(lesson.startsAt))"
        :initial-mode="seriesMode"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Dot,
  Repeat,
  RotateCcw,
  Square,
  Trash2,
  X,
} from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import { ApiError } from '@/api/client';
import EditSeriesDialog from '@/components/EditSeriesDialog.vue';
import HomeworkSection from '@/components/HomeworkSection.vue';
import MoveLessonDialog from '@/components/MoveLessonDialog.vue';
import UiActionRow from '@/components/ui/UiActionRow.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import UiConfirmDialog from '@/components/ui/UiConfirmDialog.vue';
import {
  addDays,
  everyWeekday,
  formatTime,
  lessonEnd,
  movedFrom,
  pluralize,
  sameDay,
  toIsoDate,
  useDeleteLesson,
  useLesson,
  useLessonStatus,
} from '@/features/lessons';
import { EXAM_LABEL, EXAM_TONE, useStudentSeries } from '@/features/students';

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));

const { data: lesson, error } = useLesson(id);
const isNotFound = computed(() => error.value instanceof ApiError && error.value.status === 404);

const start = computed(() => lesson.value && new Date(lesson.value.startsAt));
const cancelled = computed(() => lesson.value?.status === 'cancelled');

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('ru', opts);
const dateLabel = computed(() => {
  if (!start.value) return '';
  const now = new Date();
  const date = fmt(start.value, { weekday: 'long', day: 'numeric', month: 'long' });
  if (sameDay(start.value, now)) return `Сегодня · ${date}`;
  if (sameDay(start.value, addDays(now, 1))) return `Завтра · ${date}`;
  return date;
});

const studentLine = computed(() => {
  const s = lesson.value?.student;
  if (!s) return '';
  return `${s.grade ? `${s.grade} класс` : 'Не школьник'} · ${s.exam ? EXAM_LABEL[s.exam] : 'без экзамена'}`;
});

// Правило хранит день недели исходного времени — для перенесённого берём его, а не новый день.
const everyLabel = computed(
  () => lesson.value && everyWeekday(new Date(lesson.value.originalStartsAt ?? lesson.value.startsAt)),
);

const movedNote = computed(() => {
  const l = lesson.value;
  if (!l?.isModified || !l.originalStartsAt) return '';
  const from = new Date(l.originalStartsAt);
  const day = movedFrom(l) ? `${fmt(from, { weekday: 'short', day: 'numeric', month: 'short' })}, ` : '';
  return `Перенесено с ${day}${formatTime(from)}`;
});

const moving = ref(false);
// Правило этого занятия — для окна «Регулярное расписание».
const { data: studentSeries } = useStudentSeries(() => lesson.value?.student.id ?? '');
const lessonSeries = computed(() => studentSeries.value?.find(s => s.id === lesson.value?.seriesId));
const seriesOpen = ref(false);
const seriesMode = ref<'edit' | 'end'>('edit');
const editSeries = (mode: 'edit' | 'end') => {
  seriesMode.value = mode;
  seriesOpen.value = true;
};

const cancelMutation = useLessonStatus('cancel');
const restoreMutation = useLessonStatus('restore');
const isPending = computed(() => cancelMutation.isPending.value || restoreMutation.isPending.value);

const cancel = () =>
  cancelMutation.mutate(id.value, {
    onSuccess: () => toast.success('Занятие отменено'),
    onError: () => toast.error('Не удалось отменить занятие'),
  });
const restore = () =>
  restoreMutation.mutate(id.value, {
    onSuccess: () => toast.success('Занятие возвращено'),
    onError: () => toast.error('Не удалось вернуть занятие'),
  });

const { mutate: deleteLesson, isPending: deleting } = useDeleteLesson();
const confirmingDelete = ref(false);
const remove = () =>
  deleteLesson(id.value, {
    onSuccess: () => {
      toast.success('Занятие удалено');
      void router.replace('/schedule');
    },
    onError: () => toast.error('Не удалось удалить занятие'),
  });

const back = () => (window.history.state?.back ? router.back() : router.push('/schedule'));
</script>
