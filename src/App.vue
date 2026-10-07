<template>
  <RouterView />
  <Toaster position="top-right" />
</template>

<script setup lang="ts">
import 'vue-sonner/style.css';

import { Toaster } from 'vue-sonner';
</script>
