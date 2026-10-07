import './style.css';

import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';

import { queryClient } from '@/api/queryClient';
import { router } from '@/router';

import App from './App.vue';

createApp(App).use(VueQueryPlugin, { queryClient }).use(router).mount('#app');
