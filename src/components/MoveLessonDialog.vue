<template>
  <UiDialog v-model:open="open" title="Перенести занятие">
    <form :id="formId" class="contents" @submit.prevent="submit">
      <LessonStudentCard :student="lesson.student">
        <span class="font-mono line-through">{{ currentLabel }}</span>
        <template v-if="lesson.seriesId" #aside>
          <UiChip>{{ everyWeekday(new Date(lesson.originalStartsAt ?? lesson.startsAt)).toLowerCase() }}</UiChip>
        </template>
      </LessonStudentCard>

      <div class="grid gap-4 sm:grid-cols-2">
        <UiTextField v-model="date" label="Новая дата" type="date" required>
          <template #icon><Calendar :size="18" :stroke-width="1.8" /></template>
        </UiTextField>
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
        {{ hint }}
      </UiHint>
    </form>

    <template #footer>
      <UiButton variant="ghost" size="lg" class="max-md:hidden" @click="open = false">Отмена</UiButton>
      <UiButton type="submit" :form="formId" size="lg" :loading="isPending">Перенести</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { Calendar, Clock, Info } from '@lucide/vue';
import { computed, ref, useId, watch } from 'vue';
import { toast } from 'vue-sonner';

import type { Lesson } from '@/api/types';
import LessonStudentCard from '@/components/LessonStudentCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import UiChoice from '@/components/ui/UiChoice.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiHint from '@/components/ui/UiHint.vue';
import UiTextField from '@/components/ui/UiTextField.vue';
import {
  DURATIONS,
  everyWeekday,
  formatTime,
  fromIsoDateTime,
  lessonEnd,
  toIsoDate,
  useMoveLesson,
} from '@/features/lessons';

const { lesson } = defineProps<{ lesson: Lesson }>();
const open = defineModel<boolean>('open', { required: true });

const formId = useId();
const date = ref('');
const time = ref('');
const durationMin = ref(60);

watch(open, v => {
  if (!v) return;
  const start = new Date(lesson.startsAt);
  date.value = toIsoDate(start);
  time.value = formatTime(start);
  durationMin.value = lesson.durationMin;
});

const short = (d: Date) => `${d.toLocaleDateString('ru', { weekday: 'short' })} ${d.getDate()}.${d.getMonth() + 1}`;
const currentLabel = computed(() => {
  const start = new Date(lesson.startsAt);
  return `${start.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'long' })} · ${formatTime(start)}–${formatTime(lessonEnd(lesson))}`;
});

const hint = computed(() => {
  const from = new Date(lesson.startsAt);
  const target = date.value && time.value ? fromIsoDateTime(date.value, time.value) : null;
  const rest = lesson.seriesId
    ? `Переносится только это занятие — остальные ${ON_PLURAL[(from.getDay() + 6) % 7]} останутся как есть.`
    : 'Переносится только это занятие.';
  if (!target) return rest;
  return `${rest} Ученик увидит в кабинете: «Перенесено с${[2, 3].includes(from.getDay()) ? 'о' : ''} ${short(from)} на ${short(target)}, ${time.value}».`;
});
// «остальные среды останутся как есть»
const ON_PLURAL = ['понедельники', 'вторники', 'среды', 'четверги', 'пятницы', 'субботы', 'воскресенья'];

const { mutate, isPending } = useMoveLesson();
const submit = () =>
  mutate(
    { id: lesson.id, startsAt: fromIsoDateTime(date.value, time.value), durationMin: durationMin.value },
    {
      onSuccess: () => {
        open.value = false;
        toast.success('Занятие перенесено');
      },
      onError: () => toast.error('Не удалось перенести занятие. Попробуйте ещё раз'),
    },
  );
</script>
