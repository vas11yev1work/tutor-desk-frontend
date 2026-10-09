<template>
  <div class="flex flex-col gap-6 pb-36 md:-mt-1 md:gap-5.5 md:pb-0">
    <!-- Мобила: назад, название, PDF -->
    <div class="flex items-center gap-3 md:hidden">
      <UiButton variant="ghost" size="icon" aria-label="Назад" :to="`/students/${id}`">
        <ChevronLeft :size="20" :stroke-width="2" aria-hidden="true" />
      </UiButton>
      <div class="min-w-0 flex-1">
        <div class="text-[17px] font-bold">{{ title }}</div>
        <div class="truncate text-[13px] text-muted">{{ student?.name }}</div>
      </div>
      <UiButton
        v-if="mock"
        variant="ghost"
        size="icon"
        aria-label="Открыть PDF пробника"
        :href="assignmentFileUrl(mock.id)"
        target="_blank"
        rel="noopener"
      >
        <FileText :size="20" :stroke-width="1.8" aria-hidden="true" />
      </UiButton>
    </div>

    <nav aria-label="Путь" class="hidden flex-wrap items-center gap-2 text-sm text-muted md:flex">
      <RouterLink to="/students" class="font-semibold text-label hover:text-ink">Ученики</RouterLink>
      <ChevronRight :size="14" :stroke-width="2" aria-hidden="true" />
      <RouterLink :to="`/students/${id}`" class="font-semibold text-label hover:text-ink">{{
        student?.name
      }}</RouterLink>
      <ChevronRight :size="14" :stroke-width="2" aria-hidden="true" />
      <span>Пробник {{ mock?.number }}</span>
    </nav>

    <p v-if="notFound" class="text-danger">Пробник не найден</p>
    <p v-else-if="student && !student.exam" class="text-danger">
      У ученика не выбран экзамен — баллы не к чему считать
    </p>

    <template v-if="mock && max">
      <header class="hidden flex-col gap-1.5 md:flex">
        <h1 class="font-display text-[clamp(26px,3vw,34px)] font-semibold tracking-[-0.02em]">
          {{ title }}
        </h1>
        <p class="text-[15px] text-muted">
          К занятию {{ dayMonth(mock.lessonStartsAt) }} · {{ max.length }}
          {{ pluralize(max.length, ['задание', 'задания', 'заданий']) }}
        </p>
      </header>

      <div class="flex flex-wrap items-start gap-5.5">
        <div class="flex min-w-0 flex-[2_1_520px] flex-col gap-5.5">
          <!-- Часть 1: по баллу, нажатие — верно ↔ пропуск (0) -->
          <section class="flex flex-col gap-3.5 card p-3.5 md:p-5">
            <div class="flex items-baseline justify-between gap-3">
              <h2 class="section-title">
                {{ parts.part2.length ? 'Часть 1 · задания' : 'Задания' }} {{ formatTaskRange(parts.part1) }}
              </h2>
              <span class="font-mono text-sm font-semibold">{{ sumOf(parts.part1) }} / {{ maxOf(parts.part1) }}</span>
            </div>
            <div class="grid grid-cols-4 gap-2 md:grid-cols-[repeat(auto-fill,minmax(84px,1fr))] md:gap-2.5">
              <button
                v-for="i in parts.part1"
                :key="i"
                type="button"
                :aria-label="`Задание ${i + 1}: ${values[i] === 1 ? 'верно' : 'пропуск'}`"
                :aria-pressed="values[i] === 1"
                :class="
                  values[i] === 1
                    ? 'border-ink bg-ink text-white'
                    : 'border-dashed border-line-strong bg-white text-ink'
                "
                class="relative flex h-17 cursor-pointer items-center justify-center rounded-2xl border-[1.5px] md:h-19"
                @click="toggle(i)"
              >
                <span class="absolute top-2 left-2.5 font-mono text-xs font-semibold">{{ i + 1 }}</span>
                <Check v-if="values[i] === 1" :size="26" :stroke-width="2.6" class="text-accent" aria-hidden="true" />
                <span v-else class="text-[13px] text-muted">—</span>
              </button>
            </div>
            <p class="text-[13px] text-muted">Нажатие отмечает задание верным или снимает отметку</p>
          </section>

          <!-- Часть 2: развёрнутые ответы, 0…max -->
          <section v-if="parts.part2.length" class="flex flex-col gap-1.5 card p-3.5 md:p-5">
            <div class="flex items-baseline justify-between gap-3 pb-1.5">
              <h2 class="section-title">Часть 2 · задания {{ formatTaskRange(parts.part2) }}</h2>
              <span class="font-mono text-sm font-semibold">{{ sumOf(parts.part2) }} / {{ maxOf(parts.part2) }}</span>
            </div>
            <div
              v-for="i in parts.part2"
              :key="i"
              class="flex items-center justify-between gap-3.5 border-t border-line-soft py-2.5"
            >
              <div class="flex w-11 flex-none flex-col">
                <span class="font-display text-lg font-semibold tracking-[-0.02em]">{{ i + 1 }}</span>
                <span class="font-mono text-[11px] text-muted">макс {{ max[i] }}</span>
              </div>
              <div
                role="radiogroup"
                :aria-label="`Задание ${i + 1}, баллы`"
                class="flex flex-1 gap-1.5 md:w-72.5 md:flex-none"
              >
                <button
                  v-for="k in max[i]! + 1"
                  :key="k"
                  type="button"
                  role="radio"
                  :aria-checked="values[i] === k - 1"
                  :class="pointClass(i, k - 1)"
                  class="h-11 min-w-0 flex-1 cursor-pointer rounded-xl border-[1.5px] font-mono text-[15px] font-semibold"
                  @click="values[i] = values[i] === k - 1 ? null : k - 1"
                >
                  {{ k - 1 }}
                </button>
                <!-- Выравнивание: у всех строк ширина кнопок как у самой «длинной» -->
                <span :style="{ flex: `${widestPart2 - max[i]!} 1 0` }" />
              </div>
            </div>
          </section>

          <section class="flex flex-col gap-2.5 md:hidden">
            <span class="px-1 section-title">Комментарий для себя</span>
            <UiTextField v-model="comment" label="Комментарий для себя" hide-label multiline rows="3" />
          </section>
        </div>

        <!-- Десктоп: итог и сохранение -->
        <aside class="hidden min-w-0 flex-[1_1_300px] flex-col gap-5 rounded-[26px] bg-paper p-6 text-white md:flex">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold tracking-[0.06em] text-accent uppercase">Первичный балл</span>
            <span class="font-display text-7xl leading-none font-bold tracking-[-0.02em]">
              {{ primary }}<span class="text-[28px] text-white/45"> / {{ maxOf(allIndices) }}</span>
            </span>
          </div>
          <div v-if="parts.part2.length" class="grid grid-cols-2 gap-2.5">
            <div v-for="(part, n) in [parts.part1, parts.part2]" :key="n" class="flex flex-col gap-0.5">
              <span class="text-xs text-white/65">Часть {{ n + 1 }}</span>
              <span class="font-mono text-lg font-semibold">
                {{ sumOf(part) }}<span class="text-white/45">/{{ maxOf(part) }}</span>
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-[13px] text-white/75">
              <span>Внесено заданий</span><span class="font-mono">{{ filled }} / {{ max.length }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-white/14">
              <div class="h-full rounded-full bg-accent" :style="{ width: `${(filled / max.length) * 100}%` }" />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold tracking-[0.06em] text-white/65 uppercase">Комментарий для себя</span>
            <UiTextField v-model="comment" label="Комментарий для себя" hide-label multiline dark rows="3" />
          </div>
          <UiButton variant="accent" :disabled="!complete" :loading="isPending" class="min-h-12" @click="save">
            Сохранить баллы
          </UiButton>
          <UiButton variant="glass" size="sm" :href="assignmentFileUrl(mock.id)" target="_blank" rel="noopener">
            <FileText :size="18" :stroke-width="1.8" aria-hidden="true" />Открыть PDF пробника
          </UiButton>
        </aside>
      </div>

      <!-- Мобила: балл и сохранение внизу -->
      <div
        class="fixed inset-x-0 bottom-0 z-10 flex items-center gap-3.5 rounded-t-[26px] bg-paper px-4 pt-4 pb-7 text-white md:hidden"
      >
        <div class="flex flex-1 flex-col gap-0.5">
          <span class="text-[11px] font-semibold tracking-[0.06em] text-accent uppercase">Первичный балл</span>
          <span class="font-display text-[28px] leading-none font-bold tracking-[-0.02em]">
            {{ primary }}<span class="text-base text-white/45"> / {{ maxOf(allIndices) }}</span>
          </span>
        </div>
        <UiButton variant="accent" size="lg" :disabled="!complete" :loading="isPending" @click="save"
          >Сохранить</UiButton
        >
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, FileText } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import UiButton from '@/components/ui/UiButton.vue';
import UiTextField from '@/components/ui/UiTextField.vue';
import {
  assignmentFileUrl,
  formatTaskRange,
  splitParts,
  useExamMaxScores,
  useScoreMock,
  useStudentMocks,
} from '@/features/assignments';
import { pluralize } from '@/features/lessons';
import { EXAM_LABEL, useStudent } from '@/features/students';

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));
const mockId = computed(() => String(route.params.mockId));

const { data: student } = useStudent(id);
const { data: mocks } = useStudentMocks(id);
const { data: exams } = useExamMaxScores();

const mock = computed(() => mocks.value?.find(m => m.id === mockId.value));
const notFound = computed(() => !!mocks.value && !mock.value);
const max = computed(() => (student.value?.exam ? exams.value?.[student.value.exam] : undefined));
const examLabel = computed(() => (student.value?.exam ? EXAM_LABEL[student.value.exam] : ''));
// «Пробник 4 · ОГЭ»
const title = computed(() => [`Пробник ${mock.value?.number ?? ''}`, examLabel.value].filter(Boolean).join(' · '));
const parts = computed(() => splitParts(max.value ?? []));
const allIndices = computed(() => (max.value ?? []).map((_, i) => i));
const widestPart2 = computed(() => Math.max(0, ...parts.value.part2.map(i => max.value![i]!)));

/** null — задание ещё не внесено (только часть 2; в части 1 пропуск — это 0). */
const values = ref<(number | null)[]>([]);
const comment = ref('');

// Заполняем один раз на пробник: и при открытии, и при переходе на другой пробник.
let filledFor = '';
watch(
  [mock, max],
  ([m, mx]) => {
    if (!m || !mx || filledFor === m.id) return;
    filledFor = m.id;
    // Часть 1 (макс 1) по умолчанию — пропуски, часть 2 — не внесена
    values.value = m.scores ? [...m.scores] : mx.map(x => (x === 1 ? 0 : null));
    comment.value = m.comment ?? '';
  },
  { immediate: true },
);

const sumOf = (indices: number[]) => indices.reduce((s, i) => s + (values.value[i] ?? 0), 0);
const maxOf = (indices: number[]) => indices.reduce((s, i) => s + (max.value?.[i] ?? 0), 0);
const primary = computed(() => sumOf(allIndices.value));
const filled = computed(() => values.value.filter(v => v !== null).length);
const complete = computed(() => !!max.value && filled.value === max.value.length);

const toggle = (i: number) => {
  values.value[i] = values.value[i] === 1 ? 0 : 1;
};

const pointClass = (i: number, k: number) => {
  if (values.value[i] !== k) return 'border-line bg-white text-ink';
  if (k === max.value![i]) return 'border-ink bg-ink text-accent';
  if (k === 0) return 'border-[#ffc9b9] bg-danger-soft text-[#7a1f06]';
  return 'border-[#7f87c7] bg-[#c9cef0] text-ink';
};

const dayMonth = (iso: string) => new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'long' });

const { mutate, isPending } = useScoreMock();
const save = () => {
  if (!mock.value || !complete.value) return;
  mutate(
    { id: mock.value.id, scores: values.value as number[], comment: comment.value.trim() || null },
    {
      onSuccess: () => {
        toast.success('Баллы сохранены');
        void router.push(`/students/${id.value}`);
      },
      onError: () => toast.error('Не удалось сохранить баллы. Попробуйте ещё раз'),
    },
  );
};
</script>
