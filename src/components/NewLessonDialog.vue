<template>
  <UiDialog v-model:open="open" title="Новое занятие">
    <form :id="formId" class="contents" @submit.prevent="submit">
      <div class="grid items-end gap-4 sm:grid-cols-2">
        <UiSelect
          v-model="studentId"
          label="Ученик"
          placeholder="Выберите ученика"
          :options="(students ?? []).map(s => ({ value: s.id, label: s.name }))"
          required
        >
          <template v-if="student" #icon>
            <UiAvatar :name="student.name" :tone="EXAM_TONE[student.exam ?? 'none']" size="sm" />
          </template>
        </UiSelect>
        <UiChoice v-model="kind" label="Тип занятия" :options="KINDS" segmented />
      </div>

      <div v-if="kind === 'regular'" class="flex flex-col gap-2">
        <span class="text-[13px] font-semibold text-label">День недели</span>
        <UiChoice v-model="weekday" label="День недели" :options="WEEKDAYS" class="grid grid-cols-7 gap-1.5" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <UiTextField v-if="kind === 'once'" v-model="date" label="Дата" type="date" required :min="today" />
        <UiTextField v-model="time" label="Время" type="time" required :invalid="!!clash">
          <template #icon><Clock :size="18" :stroke-width="1.8" /></template>
        </UiTextField>
        <UiTextField v-if="kind === 'regular'" v-model="startsOn" label="Начиная с" type="date" required :min="today" />
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

      <UiAlert v-if="clash">
        <b>Пересекается с другим занятием:</b> {{ clash }}. Можно сохранить так или выбрать другое время.
      </UiAlert>
    </form>

    <template #footer>
      <UiButton variant="ghost" size="lg" class="max-md:hidden" @click="open = false">Отмена</UiButton>
      <UiButton type="submit" :form="formId" size="lg" :loading="isPending">
        {{ kind === 'regular' ? 'Добавить регулярное занятие' : 'Добавить занятие' }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { Clock } from '@lucide/vue';
import { computed, ref, useId, watch } from 'vue';
import { toast } from 'vue-sonner';

import UiAlert from '@/components/ui/UiAlert.vue';
import UiAvatar from '@/components/ui/UiAvatar.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChoice from '@/components/ui/UiChoice.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTextField from '@/components/ui/UiTextField.vue';
import {
  addDays,
  DURATIONS,
  findOverlap,
  formatTime,
  fromIsoDateTime,
  isoWeekday,
  lessonEnd,
  toIsoDate,
  useCreateLesson,
  useCreateSeries,
  useLessons,
} from '@/features/lessons';
import { EXAM_TONE, useStudents } from '@/features/students';

const { defaultStudentId = '' } = defineProps<{
  /** Ученик по умолчанию — когда открываем из карточки ученика. */
  defaultStudentId?: string;
}>();
const open = defineModel<boolean>('open', { required: true });

const KINDS = [
  { value: 'regular' as const, label: 'Регулярное' },
  { value: 'once' as const, label: 'Разовое' },
];
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((label, i) => ({ value: i + 1, label }));
// «по субботам 12:30–13:30»
const ON_WEEKDAYS = ['понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам', 'воскресеньям'];

const formId = useId();
const { data: students } = useStudents();
const studentId = ref('');
const kind = ref<'regular' | 'once'>('regular');
const weekday = ref(1);
const time = ref('');
const startsOn = ref('');
const date = ref('');
const durationMin = ref(60);
const today = toIsoDate(new Date());

const student = computed(() => students.value?.find(s => s.id === studentId.value));

watch(open, v => {
  if (!v) return;
  const today = new Date();
  studentId.value = defaultStudentId;
  kind.value = 'regular';
  weekday.value = isoWeekday(today);
  time.value = '';
  startsOn.value = date.value = toIsoDate(today);
  durationMin.value = 60;
});

// Слоты, которые займёт занятие: разовое — один, регулярное — ближайшие 4 недели с даты начала.
const slots = computed(() => {
  if (!time.value || !(kind.value === 'once' ? date.value : startsOn.value)) return [];
  if (kind.value === 'once') {
    const start = fromIsoDateTime(date.value, time.value);
    return [{ start, end: new Date(start.getTime() + durationMin.value * 60_000) }];
  }
  const from = fromIsoDateTime(startsOn.value, time.value);
  const first = addDays(from, (weekday.value - isoWeekday(from) + 7) % 7);
  return Array.from({ length: 4 }, (_, i) => {
    const start = addDays(first, i * 7);
    start.setHours(from.getHours(), from.getMinutes());
    return { start, end: new Date(start.getTime() + durationMin.value * 60_000) };
  });
});

const range = computed(() => {
  const first = slots.value[0]?.start ?? new Date();
  const last = slots.value.at(-1)?.start ?? first;
  return { from: fromIsoDateTime(toIsoDate(first)), to: addDays(fromIsoDateTime(toIsoDate(last)), 1) };
});
const { data: lessons } = useLessons(range);

const clash = computed(() => {
  if (!open.value || !slots.value.length) return '';
  const hit = findOverlap(lessons.value ?? [], slots.value);
  if (!hit) return '';
  const start = new Date(hit.startsAt);
  const time = `${formatTime(start)}–${formatTime(lessonEnd(hit))}`;
  const when =
    kind.value === 'regular' && hit.seriesId
      ? `по ${ON_WEEKDAYS[isoWeekday(start) - 1]} ${time}`
      : `${start.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
  return `${hit.student.name}, ${when}`;
});

const createSeries = useCreateSeries();
const createLesson = useCreateLesson();
const isPending = computed(() => createSeries.isPending.value || createLesson.isPending.value);

const submit = () => {
  const options = {
    onSuccess: () => (open.value = false),
    onError: () => toast.error('Не удалось добавить занятие. Попробуйте ещё раз'),
  };
  if (kind.value === 'regular')
    createSeries.mutate(
      {
        studentId: studentId.value,
        weekday: weekday.value,
        startTime: time.value,
        durationMin: durationMin.value,
        startsOn: startsOn.value,
      },
      options,
    );
  else
    createLesson.mutate(
      {
        studentId: studentId.value,
        startsAt: fromIsoDateTime(date.value, time.value),
        durationMin: durationMin.value,
      },
      options,
    );
};
</script>
