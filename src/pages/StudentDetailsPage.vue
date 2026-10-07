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
        class="flex flex-col gap-4.5 bg-paper text-white max-md:-mx-4 max-md:-mt-4 max-md:rounded-b-[30px] max-md:px-4 max-md:pt-3 max-md:pb-5.5 min-[980px]:max-[1200px]:grid min-[980px]:max-[1200px]:grid-cols-2 min-[980px]:max-[1200px]:items-start min-[980px]:max-[1200px]:gap-x-8 min-[980px]:max-[1200px]:gap-y-4.5 min-[1200px]:flex-[1_1_320px] md:gap-5 md:rounded-[26px] md:p-6"
      >
        <RouterLink
          to="/students"
          aria-label="Назад к ученикам"
          class="flex size-11 items-center justify-center rounded-[14px] border border-white/22 bg-white/8 hover:bg-white/16 md:hidden"
        >
          <ChevronLeft :size="20" :stroke-width="2" aria-hidden="true" />
        </RouterLink>

        <!-- 980–1199px: две колонки «шапка + контакт» | «ссылка + кнопки», заметки под ними на всю ширину.
             На остальных ширинах обёртки — contents, блоки идут столбцом. -->
        <div
          class="contents min-[980px]:max-[1200px]:flex min-[980px]:max-[1200px]:flex-col min-[980px]:max-[1200px]:gap-4.5"
        >
          <div class="flex items-center gap-4">
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

          <div v-if="tg" class="flex flex-col gap-1">
            <span :class="CAPTION">Telegram</span>
            <a :href="tg.url" target="_blank" rel="noopener" class="self-start text-[15px] text-accent hover:underline">
              {{ tg.label }}
            </a>
          </div>
        </div>

        <div
          class="contents min-[980px]:max-[1200px]:flex min-[980px]:max-[1200px]:flex-col min-[980px]:max-[1200px]:gap-4.5"
        >
          <div class="flex flex-col gap-2">
            <span :class="CAPTION">Личная ссылка ученика</span>
            <div class="flex h-13 items-center gap-2.5 rounded-[14px] border border-[#48495a] bg-ink pr-1.25 pl-4">
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
              @click="regenerateLink"
            >
              Перевыпустить — старая перестанет работать
            </button>
          </div>

          <div class="-mt-2 flex gap-2 min-[980px]:max-[1200px]:mt-0">
            <UiButton variant="light" size="sm" class="flex-1" @click="editing = true">
              <Pencil :size="16" :stroke-width="2" aria-hidden="true" />Изменить
            </UiButton>
            <UiButton variant="danger" size="sm" :loading="deleting" @click="remove">
              <Trash2 :size="16" :stroke-width="2" aria-hidden="true" />Удалить
            </UiButton>
          </div>
        </div>

        <div v-if="student.notes" class="flex flex-col gap-2 min-[980px]:max-[1200px]:col-span-2">
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
        <section v-if="seriesGroups.length" class="flex flex-col gap-2.5">
          <h2 class="px-1 section-title">Регулярные занятия</h2>
          <div v-for="g in seriesGroups" :key="g.key" class="flex flex-col gap-1.5 card px-4 py-3.5">
            <div class="flex gap-1.5">
              <UiChip v-for="d in g.days" :key="d" tone="ink" class="font-mono">{{ d }}</UiChip>
            </div>
            <div class="text-[13px] text-muted">{{ g.caption }}</div>
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
            <div
              v-for="(l, i) in upcoming"
              :key="l.id"
              :class="i > 0 && 'border-t border-line-soft'"
              class="flex items-center gap-3.5 px-3.5 py-3 md:px-4.5"
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
                <div v-if="movedNote(l)" class="text-[13px] text-muted">{{ movedNote(l) }}</div>
              </div>
              <UiChip v-if="l.status === 'cancelled'" tone="danger">Отменено</UiChip>
              <UiChip v-else-if="l.isModified" tone="warn">Перенос</UiChip>
            </div>
            <p v-if="lessons && !upcoming.length" class="px-4.5 py-6 text-center text-[15px] text-muted">
              Ближайших занятий нет
            </p>
          </div>
        </section>
      </div>
    </div>

    <StudentFormDialog v-if="student" v-model:open="editing" :student="student" />
    <NewLessonDialog v-model:open="addingLesson" :default-student-id="id" />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Copy, Pencil, Trash2 } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import { ApiError } from '@/api/client';
import type { Lesson } from '@/api/types';
import NewLessonDialog from '@/components/NewLessonDialog.vue';
import StudentFormDialog from '@/components/StudentFormDialog.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import { addDays, formatTime, lessonEnd, sameDay, startOfDay } from '@/features/lessons';
import {
  EXAM_LABEL,
  EXAM_TONE,
  groupSeries,
  portalUrl,
  telegram,
  useDeleteStudent,
  useRegenerateToken,
  useStudent,
  useStudentLessons,
  useStudentSeries,
} from '@/features/students';

const CAPTION = 'text-xs font-semibold tracking-[0.06em] text-white/60 uppercase';

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));

const { data: student, error } = useStudent(id);
const isNotFound = computed(() => error.value instanceof ApiError && error.value.status === 404);
const tg = computed(() => telegram(student.value?.contact ?? null));
const editing = ref(false);
const addingLesson = ref(false);

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
const regenerateLink = () => {
  if (!confirm('Перевыпустить ссылку? Старая перестанет работать.')) return;
  regenerate(undefined, {
    onSuccess: () => toast.success('Новая ссылка готова'),
    onError: () => toast.error('Не удалось перевыпустить ссылку'),
  });
};

const { mutate: deleteStudent, isPending: deleting } = useDeleteStudent(id);
const remove = () => {
  if (!student.value || !confirm(`Удалить ученика «${student.value.name}» навсегда? Все его занятия тоже удалятся.`))
    return;
  deleteStudent(undefined, {
    onSuccess: () => {
      toast.success('Ученик удалён');
      void router.replace('/students');
    },
    onError: () => toast.error('Не удалось удалить ученика'),
  });
};

// Ближайшие 3 занятия, которые ещё не закончились.
const now = new Date();
const { data: lessons } = useStudentLessons(id, { from: startOfDay(now), to: addDays(now, 28) });
const upcoming = computed(() => (lessons.value ?? []).filter(l => lessonEnd(l) > now).slice(0, 3));

const { data: series } = useStudentSeries(id);
const seriesGroups = computed(() => groupSeries(series.value ?? []));

const weekday = (d: Date, style: 'short' | 'long') => d.toLocaleDateString('ru', { weekday: style });
const dayLabel = (d: Date) => `${weekday(d, 'short')} ${d.getDate()}`;
const dayTitle = (d: Date) => {
  if (sameDay(d, now)) return 'Сегодня';
  if (sameDay(d, addDays(now, 1))) return 'Завтра';
  const w = weekday(d, 'long');
  return w[0]!.toUpperCase() + w.slice(1);
};
const movedNote = (l: Lesson) => {
  if (!l.isModified || !l.originalStartsAt) return '';
  const from = new Date(l.originalStartsAt);
  return `Перенесено с ${sameDay(from, new Date(l.startsAt)) ? formatTime(from) : dayLabel(from)}`;
};
</script>
