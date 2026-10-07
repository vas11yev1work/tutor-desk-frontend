<template>
  <section class="flex flex-col gap-2.5">
    <div class="flex items-baseline justify-between gap-3 px-1">
      <h2 class="section-title">Домашка к занятию</h2>
      <span class="text-[13px] text-muted">Ученик видит её сразу</span>
    </div>

    <input ref="picker" type="file" accept="application/pdf,.pdf" multiple class="hidden" @change="onPick" />

    <!-- Файлы занятия -->
    <div v-if="files.length" class="flex flex-col overflow-hidden card">
      <div
        v-for="(f, i) in files"
        :key="f.id"
        :class="i > 0 && 'border-t border-line-soft'"
        class="flex items-center gap-3 px-3.5 py-3 md:gap-3.5 md:px-4 md:py-3.5"
      >
        <div
          v-if="f.kind === 'mock'"
          class="flex h-13.5 w-11 flex-none items-center justify-center rounded-[10px] bg-accent font-display text-sm font-bold text-ink"
        >
          П{{ f.number }}
        </div>
        <div
          v-else
          class="flex h-13.5 w-11 flex-none items-end justify-center rounded-[10px] bg-ink pb-1.75 text-accent"
        >
          <span class="font-mono text-[10px] font-semibold">PDF</span>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-0.75">
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <!-- На мобиле «Открыть» скрыта — файл открывается по названию. -->
            <a
              :href="assignmentFileUrl(f.id)"
              target="_blank"
              rel="noopener"
              class="max-w-full min-w-0 truncate text-[15px] font-semibold hover:underline"
            >
              {{ f.kind === 'mock' ? `Пробник ${f.number}` : f.fileName }}
            </a>
            <UiChip v-if="f.kind === 'mock'" class="h-5.5 text-[11.5px]">пробник</UiChip>
          </div>
          <span class="truncate text-[13px] text-muted">{{ f.meta }}</span>
        </div>

        <UiButton
          variant="ghost"
          size="xs"
          :href="assignmentFileUrl(f.id)"
          target="_blank"
          rel="noopener"
          class="max-md:hidden"
        >
          Открыть
        </UiButton>
        <button
          type="button"
          :aria-label="`Убрать ${f.kind === 'mock' ? `пробник ${f.number}` : f.fileName}`"
          :disabled="removing === f.id"
          class="flex size-10 flex-none cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-danger hover:bg-[#fff5f2] disabled:opacity-60"
          @click="remove(f.id)"
        >
          <X :size="18" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Зона загрузки: под списком всегда, пустая — крупнее -->
    <div
      :class="[dragging ? 'border-ink' : 'border-[#c9ccd8]', !files.length && 'min-h-75']"
      class="flex flex-col items-center justify-center gap-3.5 rounded-[22px] border-2 border-dashed bg-white bg-[linear-gradient(#f1f2f5_1px,transparent_1px),linear-gradient(90deg,#f1f2f5_1px,transparent_1px)] bg-size-[22px_22px] p-5.5 text-center"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <div v-if="!files.length" class="flex flex-col items-center gap-1.5">
        <div class="mb-2 flex size-15 -rotate-4 items-center justify-center rounded-[18px] bg-ink text-accent">
          <Upload :size="28" :stroke-width="1.9" aria-hidden="true" />
        </div>
        <div class="font-display text-xl font-semibold tracking-[-0.02em]">Перетащите PDF сюда</div>
        <div class="text-[14.5px] text-muted">Можно несколько файлов. Или выдайте пробник как домашку.</div>
      </div>
      <span v-else class="text-sm text-muted">Перетащите сюда ещё PDF</span>

      <div class="flex flex-wrap justify-center gap-2">
        <UiButton size="sm" :loading="uploading && pickKind === 'homework'" @click="pick('homework')">
          <Upload :size="18" :stroke-width="2" aria-hidden="true" />Добавить PDF
        </UiButton>
        <UiButton variant="ghost" size="sm" :loading="uploading && pickKind === 'mock'" @click="pick('mock')">
          <Pencil :size="18" :stroke-width="2" aria-hidden="true" />Выдать пробник
        </UiButton>
      </div>
    </div>

    <p class="px-1 text-[13px] leading-[1.45] text-muted">
      Пробник, выданный как домашка, появится и в пробниках ученика — баллы внесёте после проверки.
    </p>
  </section>
</template>

<script setup lang="ts">
import { Pencil, Upload, X } from '@lucide/vue';
import { computed, ref, useTemplateRef } from 'vue';
import { toast } from 'vue-sonner';

import { ApiError } from '@/api/client';
import type { Assignment, Lesson } from '@/api/types';
import UiButton from '@/components/ui/UiButton.vue';
import UiChip from '@/components/ui/UiChip.vue';
import {
  assignmentFileUrl,
  checkPdf,
  formatFileSize,
  useDeleteAssignment,
  useStudentMocks,
  useUploadToLesson,
} from '@/features/assignments';
import { EXAM_LABEL } from '@/features/students';

const { lesson } = defineProps<{ lesson: Lesson }>();

const { data: mocks } = useStudentMocks(() => lesson.student.id);
const files = computed(() =>
  lesson.assignments.map(a => {
    const number = mocks.value?.find(m => m.id === a.id)?.number;
    const exam = lesson.student.exam && EXAM_LABEL[lesson.student.exam];
    return {
      ...a,
      number,
      meta:
        a.kind === 'mock'
          ? [exam, a.fileName, formatFileSize(a.size)].filter(Boolean).join(' · ')
          : formatFileSize(a.size),
    };
  }),
);

const picker = useTemplateRef('picker');
const dragging = ref(false);
/** Каким видом загрузить выбранные в диалоге файлы. Перетаскивание — всегда домашка. */
const pickKind = ref<Assignment['kind']>('homework');
const removing = ref<string | null>(null);

const { mutateAsync: uploadAsync, isPending: uploading } = useUploadToLesson();
const { mutateAsync: deleteAsync } = useDeleteAssignment();

// Несколько файлов — по очереди: ошибка одного не мешает остальным.
const uploadAll = async (list: File[], kind: Assignment['kind']) => {
  let done = 0;
  for (const file of list) {
    const problem = checkPdf(file);
    if (problem) {
      toast.error(`${file.name}: ${problem}`);
      continue;
    }
    try {
      await uploadAsync({ lessonId: lesson.id, file, kind });
      done++;
    } catch (e) {
      toast.error(`${file.name}: ${e instanceof ApiError && e.status < 500 ? e.message : 'не удалось загрузить'}`);
    }
  }
  if (done)
    toast.success(kind === 'mock' ? 'Пробник выдан' : done > 1 ? `Добавлено файлов: ${done}` : 'Домашка добавлена');
};

const pick = (kind: Assignment['kind']) => {
  pickKind.value = kind;
  picker.value?.click();
};
const onPick = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const list = [...(input.files ?? [])];
  input.value = '';
  if (list.length) void uploadAll(list, pickKind.value);
};
const onDrop = (e: DragEvent) => {
  dragging.value = false;
  pickKind.value = 'homework';
  const list = [...(e.dataTransfer?.files ?? [])];
  if (list.length) void uploadAll(list, 'homework');
};

const remove = async (id: string) => {
  removing.value = id;
  try {
    await deleteAsync(id);
  } catch {
    toast.error('Не удалось убрать файл');
  } finally {
    removing.value = null;
  }
};
</script>
