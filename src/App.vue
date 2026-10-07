<template>
  <!-- Под прозрачным статус-баром iPhone (black-translucent). В браузере env() = 0 и полоски нет. -->
  <div
    class="fixed inset-x-0 top-0 z-50 h-[env(safe-area-inset-top)]"
    :style="{ background: route.meta.statusBar ?? '#f2f3f5' }"
    aria-hidden="true"
  />
  <RouterView />
  <Toaster position="top-right" :mobile-offset="{ top: 'calc(16px + env(safe-area-inset-top))' }" />
</template>

<script setup lang="ts">
import 'vue-sonner/style.css';

import { useRoute } from 'vue-router';
import { Toaster } from 'vue-sonner';

const route = useRoute();
</script>
