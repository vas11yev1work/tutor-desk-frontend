<template>
  <div class="flex min-h-screen">
    <aside class="sticky top-0 hidden h-screen w-60 flex-none flex-col gap-7 bg-paper px-4 py-6 text-white md:flex">
      <UiLogo compact class="px-1.5" />
      <nav aria-label="Разделы" class="flex flex-col gap-1">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :class="isActive(item.to) ? 'bg-accent text-ink' : 'text-white/75 hover:bg-white/8 hover:text-white'"
          class="flex min-h-11.5 items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-semibold transition-colors"
        >
          <component :is="item.icon" :size="20" :stroke-width="1.8" aria-hidden="true" />
          {{ item.label }}
          <span
            v-if="item.to === '/students' && students"
            :class="!isActive(item.to) && 'text-white/55'"
            class="ml-auto font-mono text-xs"
          >
            {{ students.length }}
          </span>
        </RouterLink>
      </nav>
      <div class="mt-auto flex flex-col gap-2">
        <ThemePicker />
        <button
          type="button"
          class="flex min-h-11.5 cursor-pointer items-center gap-3 rounded-[14px] px-3.5 text-[15px] font-semibold text-white/75 transition-colors hover:bg-white/8 hover:text-white"
          @click="logout"
        >
          <LogOut :size="20" :stroke-width="1.8" aria-hidden="true" />
          Выйти
        </button>
      </div>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col px-4 pt-4 pb-28 md:px-[clamp(20px,3vw,40px)] md:pt-8 md:pb-12">
      <RouterView />
    </main>

    <nav
      aria-label="Разделы"
      class="fixed inset-x-0 bottom-0 z-10 flex h-21 justify-around border-t border-line-card bg-white/95 px-3 pt-2 pb-6.5 backdrop-blur-lg md:hidden"
    >
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        :class="isActive(item.to) ? 'text-ink' : 'text-muted hover:text-ink'"
        class="group flex h-12.5 min-w-21 flex-col items-center justify-center gap-0.75 text-[11px] font-semibold"
      >
        <span
          :class="{ 'bg-accent': isActive(item.to) }"
          class="flex h-7 w-11 items-center justify-center rounded-full"
        >
          <component :is="item.icon" :size="22" :stroke-width="1.8" aria-hidden="true" />
        </span>
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { Calendar, House, LogOut, Users } from '@lucide/vue';
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ThemePicker from '@/components/ThemePicker.vue';
import UiLogo from '@/components/ui/UiLogo.vue';
import { useLogout } from '@/features/auth';
import { useStudents } from '@/features/students';
import { applyTheme, useSettings } from '@/features/theme';

const nav = [
  { to: '/', label: 'Сегодня', icon: House },
  { to: '/schedule', label: 'Расписание', icon: Calendar },
  { to: '/students', label: 'Ученики', icon: Users },
];

// Тема из localStorage уже стоит (index.html), бэкенд — источник правды, если её сменили на другом устройстве.
const { data: settings } = useSettings();
watch(settings, s => s && applyTheme(s.theme), { immediate: true });

const route = useRoute();
const { data: students } = useStudents();
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));

const router = useRouter();
const { mutate } = useLogout();
const logout = () => mutate(undefined, { onSuccess: () => router.replace('/login') });
</script>
