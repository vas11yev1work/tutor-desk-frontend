<template>
  <UiDialog v-model:open="open" :title="student ? 'Изменить ученика' : 'Новый ученик'">
    <form :id="formId" class="contents" @submit.prevent="submit">
      <UiTextField v-model="name" label="Имя и фамилия" placeholder="Например, Маша Соколова" required />

      <div class="flex flex-col gap-2">
        <span class="text-[13px] font-semibold text-label">Класс</span>
        <UiChoice v-model="grade" label="Класс" :options="GRADES" class="flex flex-wrap gap-1.5 font-mono" />
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-[13px] font-semibold text-label">Экзамен</span>
        <UiChoice v-model="exam" label="Экзамен" :options="EXAMS" class="grid grid-cols-2 gap-1.5 md:grid-cols-4" />
        <UiHint v-if="exam === 'none'">
          <template #icon><Info :size="16" :stroke-width="2" /></template>
          Без экзамена у ученика будут только занятия и домашки — без пробников и аналитики.
        </UiHint>
      </div>

      <UiTextField v-model="contact" label="Telegram" placeholder="@username" autocapitalize="off" spellcheck="false" />
      <UiTextField
        v-model="notes"
        label="Заметки для себя"
        optional
        multiline
        rows="3"
        placeholder="Что важно помнить про ученика"
      />

      <UiHint v-if="!student">
        <template #icon><Link :size="16" :stroke-width="2" /></template>
        Личная ссылка для ученика появится в карточке сразу после добавления.
      </UiHint>
    </form>

    <template #footer>
      <UiButton variant="ghost" size="lg" class="max-md:hidden" @click="open = false">Отмена</UiButton>
      <UiButton type="submit" :form="formId" size="lg" :loading="isPending">
        {{ student ? 'Сохранить' : 'Добавить ученика' }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { Info, Link } from '@lucide/vue';
import { computed, ref, useId, watch } from 'vue';
import { toast } from 'vue-sonner';

import type { Exam, Student } from '@/api/types';
import UiButton from '@/components/ui/UiButton.vue';
import UiChoice from '@/components/ui/UiChoice.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiHint from '@/components/ui/UiHint.vue';
import UiTextField from '@/components/ui/UiTextField.vue';
import { EXAM_LABEL, type NewStudent, useCreateStudent, useUpdateStudent } from '@/features/students';

const { student = undefined } = defineProps<{
  /** Есть — редактирование, нет — новый ученик. */
  student?: Student;
}>();
const emit = defineEmits<{ saved: [student: Student] }>();
const open = defineModel<boolean>('open', { required: true });

// 'none' — явно выбрано «не школьник» / «без экзамена»; undefined — не выбрано. На бэк оба уходят как null.
const GRADES = [
  ...[5, 6, 7, 8, 9, 10, 11].map(g => ({ value: g as number | 'none', label: String(g) })),
  { value: 'none' as const, label: 'не школьник' },
];
const EXAMS = [
  ...(['oge', 'ege_profile', 'ege_base'] as const).map(e => ({ value: e as Exam | 'none', label: EXAM_LABEL[e] })),
  { value: 'none' as const, label: 'Без экзамена' },
];

const formId = useId();
const name = ref('');
const grade = ref<number | 'none'>();
const exam = ref<Exam | 'none'>();
const contact = ref('');
const notes = ref('');

// При открытии — пустая форма или данные ученика; null в сохранённом = «не школьник» / «без экзамена».
watch(open, v => {
  if (!v) return;
  name.value = student?.name ?? '';
  grade.value = student ? (student.grade ?? 'none') : undefined;
  exam.value = student ? (student.exam ?? 'none') : undefined;
  contact.value = student?.contact ?? '';
  notes.value = student?.notes ?? '';
});

const create = useCreateStudent();
const update = useUpdateStudent(() => student?.id ?? '');
const isPending = computed(() => create.isPending.value || update.isPending.value);
const orNull = <T,>(v: T | 'none' | undefined) => (v === 'none' || v === undefined ? null : v);

const submit = () => {
  const body: NewStudent = {
    name: name.value,
    grade: orNull(grade.value),
    exam: orNull(exam.value),
    contact: contact.value.trim() || null,
    notes: notes.value.trim() || null,
  };
  const options = {
    onSuccess: (saved: Student) => {
      open.value = false;
      emit('saved', saved);
    },
    onError: () =>
      toast.error(
        student ? 'Не удалось сохранить. Попробуйте ещё раз' : 'Не удалось добавить ученика. Попробуйте ещё раз',
      ),
  };
  if (student) update.mutate(body, options);
  else create.mutate(body, options);
};
</script>
