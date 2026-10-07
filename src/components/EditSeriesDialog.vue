<template>
  <UiDialog v-model:open="open" title="Регулярное расписание">
    <form :id="formId" class="contents" @submit.prevent="submit">
      <LessonStudentCard :student="lesson.student">
        {{ series ? `Сейчас: ${currentLabel}` : 'Правило уже завершено' }}
      </LessonStudentCard>

      <template v-if="series">
        <UiChoice v-model="mode" label="Что сделать" :options="MODES" segmented />

        <template v-if="mode === 'edit'">
          <UiTextField v-model="fromDate" label="С какого занятия" type="date" :min="today" required>
            <template #icon><Calendar :size="18" :stroke-width="1.8" /></template>
          </UiTextField>

          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-semibold text-label">Дни недели</span>
            <UiChoice v-model="days" label="Дни недели" :options="WEEKDAYS" multiple class="grid grid-cols-7 gap-1.5" />
          </div>

          <div class="sm:max-w-55">
            <UiTextField v-model="time" label="Время" type="time" required>
              <template #icon><Clock :size="18" :stroke-width="1.8" /></template>
            </UiTextField>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-semibold text-label">Длительность</span>
            <UiChoice
              v-model="durationMin"
              label="Длительность"
              :options="DURATIONS"
              class="grid grid-cols-4 gap-1.5 font-mono"
            />
          </div>

          <UiHint>
            <template #icon><Info :size="16" :stroke-width="2" /></template>
            Занятия до {{ dayMonth(fromDate) }} останутся как есть. С {{ dayMonth(fromDate) }} — {{ newRule }}. Ученик
            сразу увидит новое расписание в кабинете.
          </UiHint>
        </template>

        <template v-else>
          <UiTextField v-model="lastDate" label="Последнее занятие" type="date" :min="today" required>
            <template #icon><Calendar :size="18" :stroke-width="1.8" /></template>
          </UiTextField>
          <UiAlert>
            После {{ dayMonth(lastDate) }} занятия по {{ ON_WEEKDAYS[series.weekday - 1] }} пропадут из расписания — у
            вас и у ученика. Прошедшие занятия останутся.
          </UiAlert>
        </template>
      </template>
    </form>

    <template #footer>
      <UiButton variant="ghost" size="lg" class="max-md:hidden" @click="open = false">Отмена</UiButton>
      <UiButton
        v-if="series"
        type="submit"
        :form="formId"
        size="lg"
        :variant="mode === 'edit' ? 'ink' : 'danger'"
        :disabled="mode === 'edit' && !days.length"
        :loading="isPending"
      >
        {{ mode === 'edit' ? `Сохранить с ${dayMonth(fromDate)}` : `Завершить после ${dayMonth(lastDate)}` }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { Calendar, Clock, Info } from '@lucide/vue';
import { computed, ref, useId, watch } from 'vue';
import { toast } from 'vue-sonner';

import type { Lesson } from '@/api/types';
import LessonStudentCard from '@/components/LessonStudentCard.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChoice from '@/components/ui/UiChoice.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiHint from '@/components/ui/UiHint.vue';
import UiTextField from '@/components/ui/UiTextField.vue';
import {
  addDays,
  DURATIONS,
  everyIsoWeekday,
  fromIsoDateTime,
  toIsoDate,
  useChangeSeries,
  useCreateSeries,
  useEndSeries,
} from '@/features/lessons';
import { useStudentSeries } from '@/features/students';

const { lesson, initialMode = 'edit' } = defineProps<{ lesson: Lesson; initialMode?: 'edit' | 'end' }>();
const open = defineModel<boolean>('open', { required: true });

const MODES = [
  { value: 'edit' as const, label: 'Изменить с даты' },
  { value: 'end' as const, label: 'Завершить' },
];
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((label, i) => ({ value: i + 1, label }));
// «по средам и пятницам»
const ON_WEEKDAYS = ['понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам', 'воскресеньям'];

const { data: allSeries } = useStudentSeries(() => lesson.student.id);
const series = computed(() => allSeries.value?.find(s => s.id === lesson.seriesId));

const formId = useId();
const today = toIsoDate(new Date());
const mode = ref<'edit' | 'end'>('edit');
const fromDate = ref('');
const lastDate = ref('');
const days = ref<number[]>([]);
const time = ref('');
const durationMin = ref(60);

// И при открытии, и когда правила догрузились после открытия.
watch([open, series], ([v], [wasOpen]) => {
  if (!v || (wasOpen && days.value.length)) return;
  const lessonDate = toIsoDate(new Date(lesson.startsAt));
  mode.value = initialMode;
  fromDate.value = lastDate.value = lessonDate < today ? today : lessonDate;
  days.value = series.value ? [series.value.weekday] : [];
  time.value = series.value?.startTime ?? '';
  durationMin.value = series.value?.durationMin ?? lesson.durationMin;
});

const dayMonth = (iso: string) =>
  iso ? fromIsoDateTime(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long' }) : '…';

const currentLabel = computed(() => {
  const s = series.value;
  if (!s) return '';
  return `${everyIsoWeekday(s.weekday).toLowerCase()} в ${s.startTime} · ${s.durationMin} мин · с ${dayMonth(s.startsOn)}`;
});

const newRule = computed(() => {
  if (!days.value.length) return 'выберите хотя бы один день';
  const list = [...days.value].sort().map(d => ON_WEEKDAYS[d - 1]);
  return `по ${list.join(' и ')} в ${time.value || '…'}, ${durationMin.value} мин`;
});

const change = useChangeSeries();
const create = useCreateSeries();
const end = useEndSeries();
const isPending = computed(() => change.isPending.value || create.isPending.value || end.isPending.value);

// Правило на бэке — один день недели. Первый день меняем у текущего правила, на остальные заводим новые с той же даты.
const saveEdit = async (current: NonNullable<typeof series.value>) => {
  const sorted = [...days.value].sort();
  const primary = sorted.includes(current.weekday) ? current.weekday : sorted[0]!;
  const rule = { startTime: time.value, durationMin: durationMin.value };
  await change.mutateAsync({
    id: current.id,
    fromDate: fromDate.value,
    weekday: primary,
    timezone: current.timezone,
    ...rule,
  });
  for (const weekday of sorted.filter(d => d !== primary))
    await create.mutateAsync({ studentId: current.studentId, weekday, startsOn: fromDate.value, ...rule });
};

const submit = async () => {
  const current = series.value;
  if (!current) return;
  try {
    if (mode.value === 'edit') await saveEdit(current);
    else await end.mutateAsync({ id: current.id, fromDate: toIsoDate(addDays(fromIsoDateTime(lastDate.value), 1)) });
    open.value = false;
    toast.success(mode.value === 'edit' ? 'Расписание изменено' : 'Регулярные занятия завершены');
  } catch {
    toast.error('Не удалось сохранить расписание. Проверьте его и попробуйте ещё раз');
  }
};
</script>
