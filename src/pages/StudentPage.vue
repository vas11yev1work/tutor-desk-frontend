<template>
  <main class="p-6">
    <p v-if="isPending">Загрузка…</p>
    <p v-else-if="error">{{ isNotFound ? 'Ссылка недействительна' : 'Не удалось загрузить данные' }}</p>
    <h1 v-else-if="data" class="text-2xl font-semibold">{{ data.name }}</h1>
  </main>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { api, ApiError } from '@/api/client';
import type { StudentPublic } from '@/api/types';

const route = useRoute();
const token = computed(() => String(route.params.token));

const { data, error, isPending } = useQuery({
  queryKey: ['portal', token],
  queryFn: () => api.get<StudentPublic>(`/api/s/${encodeURIComponent(token.value)}`),
});

const isNotFound = computed(() => error.value instanceof ApiError && error.value.status === 404);
</script>
