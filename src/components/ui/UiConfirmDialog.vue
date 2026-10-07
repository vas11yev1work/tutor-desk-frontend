<template>
  <UiDialog v-model:open="open" :title="title">
    <p class="text-[15px] leading-normal text-label"><slot /></p>
    <template #footer>
      <UiButton variant="ghost" size="lg" class="max-md:hidden" @click="open = false">Отмена</UiButton>
      <UiButton variant="danger" size="lg" :loading="loading" @click="emit('confirm')">{{ confirmLabel }}</UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import UiButton from './UiButton.vue';
import UiDialog from './UiDialog.vue';

/** Подтверждение опасного действия. Закрывает родитель — после успеха запроса. */
defineProps<{ title: string; confirmLabel: string; loading?: boolean }>();
const emit = defineEmits<{ confirm: [] }>();
const open = defineModel<boolean>('open', { required: true });
</script>
