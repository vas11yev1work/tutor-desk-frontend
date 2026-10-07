<template>
  <main class="grid min-h-screen place-items-center">
    <form class="flex w-72 flex-col gap-3" @submit.prevent="submit">
      <input v-model="login" class="rounded border px-3 py-2" placeholder="Логин" autocomplete="username" required />
      <input
        v-model="password"
        class="rounded border px-3 py-2"
        type="password"
        placeholder="Пароль"
        autocomplete="current-password"
        required
      />
      <button class="rounded bg-stone-900 px-3 py-2 text-white disabled:opacity-50" :disabled="isPending">Войти</button>
      <p v-if="errorText" class="text-sm text-red-600" role="alert">{{ errorText }}</p>
    </form>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ApiError } from '@/api/client';
import { useLogin } from '@/features/auth';
import { safeRedirect } from '@/router';

const login = ref('');
const password = ref('');
const route = useRoute();
const router = useRouter();
const { mutate, isPending, error } = useLogin();

const errorText = computed(() => {
  const e = error.value;
  if (!e) return '';
  if (e instanceof ApiError && e.status === 401) return 'Неверный логин или пароль';
  if (e instanceof ApiError && e.status === 429) return 'Слишком много попыток, попробуйте позже';
  return 'Не удалось войти, попробуйте ещё раз';
});

const submit = () =>
  mutate(
    { login: login.value, password: password.value },
    { onSuccess: () => router.replace(safeRedirect(route.query.redirect)) },
  );
</script>
