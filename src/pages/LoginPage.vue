<template>
  <main class="flex min-h-screen flex-col bg-white md:flex-row">
    <section
      class="relative flex flex-auto flex-col justify-center gap-5.5 overflow-hidden bg-paper px-7 pt-10 pb-16 text-white md:basis-[55%] md:justify-between md:gap-10 md:p-[clamp(32px,6vw,80px)]"
    >
      <UiLogo />

      <div class="flex max-w-140 flex-col gap-5">
        <h1
          class="font-display text-[34px] leading-[1.05] font-semibold tracking-[-0.02em] md:text-[clamp(36px,4.4vw,60px)]"
        >
          Ученики, занятия
          <span class="inline-block rotate-[-1.5deg] rounded-[14px] bg-accent px-3.5 text-ink">и пробники</span>
          — на одном листе
        </h1>
        <p class="max-w-110 text-base leading-normal text-white/75 md:text-lg">
          Расписание на неделю, домашки к занятиям и баллы по каждому заданию.
        </p>
      </div>

      <div aria-hidden="true" class="hidden flex-wrap gap-8 font-mono text-sm text-white/35 md:flex">
        <span>f(x) = ax² + bx + c</span><span>log₂ 32 = 5</span><span>sin² α + cos² α = 1</span>
      </div>
    </section>

    <section
      class="relative -mt-7.5 flex items-center justify-center rounded-t-[30px] bg-white px-6 pt-7 pb-10 md:mt-0 md:basis-[45%] md:rounded-none md:px-[clamp(20px,5vw,72px)] md:py-12"
    >
      <form class="flex w-full max-w-100 flex-col gap-5" @submit.prevent="submit">
        <div class="flex flex-col gap-1.5">
          <h2 class="text-2xl font-bold">Вход для репетитора</h2>
          <p class="text-[15px] text-muted">Логин и пароль, которые вы задали при настройке.</p>
        </div>

        <UiTextField
          v-model="login"
          filled
          label="Логин"
          autocomplete="username"
          autocapitalize="off"
          spellcheck="false"
          required
          :invalid="!!error"
        />
        <UiTextField
          v-model="password"
          filled
          label="Пароль"
          type="password"
          autocomplete="current-password"
          required
          :invalid="!!error"
        />

        <UiButton type="submit" size="lg" class="mt-1" :loading="isPending">
          {{ isPending ? 'Входим…' : 'Войти' }}
        </UiButton>

        <p class="border-t border-line-soft pt-4.5 text-sm leading-normal text-muted">
          Ученики входят по личной ссылке — пароль им не нужен.
        </p>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

import { ApiError } from '@/api/client';
import UiButton from '@/components/ui/UiButton.vue';
import UiLogo from '@/components/ui/UiLogo.vue';
import UiTextField from '@/components/ui/UiTextField.vue';
import { useLogin } from '@/features/auth';
import { safeRedirect } from '@/router';

const login = ref('');
const password = ref('');
const route = useRoute();
const router = useRouter();
const { mutate, isPending, error } = useLogin();

const errorText = (e: Error) => {
  if (e instanceof ApiError && e.status === 401) return 'Неверный логин или пароль';
  if (e instanceof ApiError && e.status === 429) return 'Слишком много попыток. Подождите минуту и попробуйте снова';
  return 'Не удалось войти. Проверьте соединение и попробуйте снова';
};

const submit = () =>
  mutate(
    { login: login.value, password: password.value },
    {
      onSuccess: () => router.replace(safeRedirect(route.query.redirect)),
      onError: e => toast.error(errorText(e)),
    },
  );
</script>
