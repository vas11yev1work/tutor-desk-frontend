<template>
  <main class="flex flex-col items-start gap-4 p-6">
    <h1 class="text-2xl font-semibold">Кабинет</h1>
    <UiButton :loading="isPending" @click="logout">Выйти</UiButton>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

import UiButton from '@/components/ui/UiButton.vue';
import { useLogout } from '@/features/auth';

const router = useRouter();
const { mutate, isPending } = useLogout();

const logout = () => mutate(undefined, { onSuccess: () => router.replace('/login') });
</script>
