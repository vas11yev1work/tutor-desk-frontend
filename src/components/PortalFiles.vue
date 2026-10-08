<template>
  <!-- Файлы занятия в кабинете ученика: в лаймовой карточке (на белой плашке) и в раскрытой строке занятия.
       Фон и отступы задаёт родитель; разделитель полупрозрачный — виден и на белом, и на сером. -->
  <div class="flex flex-col">
    <div class="pt-2 pb-1 text-[13px] font-semibold text-muted">Домашка · {{ files.length }}</div>
    <div
      v-for="(f, i) in files"
      :key="f.id"
      :class="i > 0 && 'border-t border-ink/8'"
      class="flex items-center gap-3 py-2.5"
    >
      <div
        :class="f.number ? 'items-center font-display text-[13px] font-bold' : 'items-end pb-1.5'"
        class="flex h-12 w-10 flex-none justify-center rounded-[9px] bg-ink text-accent"
      >
        <span v-if="f.number">П{{ f.number }}</span>
        <span v-else class="font-mono text-[9.5px] font-semibold">PDF</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-[15px] font-semibold">{{ f.number ? `Пробник ${f.number}` : f.fileName }}</div>
        <div class="text-[13px] text-muted">{{ f.number ? 'Пробник' : 'PDF' }}</div>
      </div>
      <UiButton :href="f.url" target="_blank" rel="noopener" size="sm">Открыть</UiButton>
      <UiButton
        :href="f.url"
        :download="f.fileName"
        :aria-label="`Скачать ${f.fileName}`"
        variant="soft"
        size="icon"
        class="max-md:hidden"
      >
        <Download :size="18" :stroke-width="1.9" aria-hidden="true" />
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download } from '@lucide/vue';

import UiButton from '@/components/ui/UiButton.vue';

/** number — у пробника: «П5 / Пробник 5»; у домашки нет. */
defineProps<{ files: { id: string; fileName: string; url: string; number?: number }[] }>();
</script>
