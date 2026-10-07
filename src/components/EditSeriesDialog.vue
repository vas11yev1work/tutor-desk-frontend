<template>
  <UiDialog v-model:open="open" title="Регулярное расписание">
    <form :id="formId" class="contents" @submit.prevent="submit">
      <LessonStudentCard :student="student">
        {{ series ? `Сейчас: ${currentLabel}` : 'Правило уже завершено' }}
      </LessonStudentCard>

      <template v-if="series">
        <UiChoice v-model="mode" label="Что сделать" :options="MODES" segmented />

        <template v-if="mode === 'edit'">
          <UiTextField v-model="fromDate" label="С какого занятия" type="date" :min="today" required>
            <template #icon><Calendar :size="18" :stroke-width="1.8" /></template>
          </UiTextField>

          <div class="flex flex-col gap-2">
            <span class="text-[13px] font-semibold text-label">День недели</span>
            <UiChoice v-model="weekday" label="День недели" :options="WEEKDAYS" class="grid grid-cols-7 gap-1.5" />
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

import type { Lesson, Series } from '@/api/types';
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
  useEndSeries,
} from '@/features/lessons';

const {
  student,
  series = undefined,
  defaultDate = undefined,
  initialMode = 'edit',
} = defineProps<{
  student: Lesson['student'];
  /** Нет — правило уже завершено (или ещё грузится). */
  series?: Series;
  /** С какой даты по умолчанию — например, дата открытого занятия. Иначе сегодня. */
  defaultDate?: string;
  initialMode?: 'edit' | 'end';
}>();
const open = defineModel<boolean>('open', { required: true });

const MODES = [
  { value: 'edit' as const, label: 'Изменить с даты' },
  { value: 'end' as const, label: 'Завершить' },
];
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((label, i) => ({ value: i + 1, label }));
// «по средам»
const ON_WEEKDAYS = ['понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам', 'воскресеньям'];

const formId = useId();
const today = toIsoDate(new Date());
const mode = ref<'edit' | 'end'>('edit');
const fromDate = ref('');
const lastDate = ref('');
const weekday = ref(1);
const time = ref('');
const durationMin = ref(60);

// И при открытии, и когда правило догрузилось после открытия.
watch([open, () => series?.id], ([v]) => {
  if (!v || !series) return;
  mode.value = initialMode;
  fromDate.value = lastDate.value = defaultDate && defaultDate > today ? defaultDate : today;
  weekday.value = series.weekday;
  time.value = series.startTime;
  durationMin.value = series.durationMin;
});

const dayMonth = (iso: string) =>
  iso ? fromIsoDateTime(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long' }) : '…';

const currentLabel = computed(() =>
  series
    ? `${everyIsoWeekday(series.weekday).toLowerCase()} в ${series.startTime} · ${series.durationMin} мин · с ${dayMonth(series.startsOn)}`
    : '',
);
const newRule = computed(() => `по ${ON_WEEKDAYS[weekday.value - 1]} в ${time.value || '…'}, ${durationMin.value} мин`);

const change = useChangeSeries();
const end = useEndSeries();
const isPending = computed(() => change.isPending.value || end.isPending.value);

const submit = async () => {
  if (!series) return;
  try {
    if (mode.value === 'edit')
      await change.mutateAsync({
        id: series.id,
        fromDate: fromDate.value,
        weekday: weekday.value,
        startTime: time.value,
        durationMin: durationMin.value,
        timezone: series.timezone,
      });
    else await end.mutateAsync({ id: series.id, fromDate: toIsoDate(addDays(fromIsoDateTime(lastDate.value), 1)) });
    open.value = false;
    toast.success(mode.value === 'edit' ? 'Расписание изменено' : 'Регулярные занятия завершены');
  } catch {
    toast.error('Не удалось сохранить расписание. Попробуйте ещё раз');
  }
};
</script>
