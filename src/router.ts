import { createRouter, createWebHistory } from 'vue-router';

import { setUnauthorizedHandler } from '@/api/client';
import { queryClient } from '@/api/queryClient';
import { meQuery } from '@/features/auth';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    /** Цвет статус-бара (theme-color), если вверху страницы тёмная плашка. По умолчанию — фон страницы. */
    statusBar?: string;
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/pages/LoginPage.vue'), meta: { statusBar: '#14162b' } },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', component: () => import('@/pages/HomePage.vue'), meta: { statusBar: '#14162b' } },
        { path: 'schedule', component: () => import('@/pages/SchedulePage.vue') },
        { path: 'students', component: () => import('@/pages/StudentsPage.vue') },
        {
          path: 'students/:id',
          component: () => import('@/pages/StudentDetailsPage.vue'),
          meta: { statusBar: '#14162b' },
        },
        { path: 'students/:id/mocks/:mockId', component: () => import('@/pages/MockScorePage.vue') },
        { path: 'students/:id/analytics', component: () => import('@/pages/AnalyticsPage.vue') },
        { path: 'lessons/:id', component: () => import('@/pages/LessonPage.vue') },
      ],
    },
    { path: '/s/:token', component: () => import('@/pages/StudentPage.vue') },
  ],
});

/** Только внутренние пути — без open redirect на //evil.com. */
export const safeRedirect = (value: unknown) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';

// Статус-бар в цвет верха страницы: тёмный над тёмной плашкой (Сегодня, вход, карточка ученика), иначе серый фон. Тема устройства не влияет.
const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
router.afterEach(to => themeColor?.setAttribute('content', to.meta.statusBar ?? '#f2f3f5'));

router.beforeEach(async to => {
  if (!to.meta.requiresAuth && to.path !== '/login') return;
  const me = await queryClient.fetchQuery(meQuery);
  if (to.meta.requiresAuth && !me) return { path: '/login', query: { redirect: to.fullPath } };
  if (to.path === '/login' && me) return safeRedirect(to.query.redirect);
});

setUnauthorizedHandler(() => {
  queryClient.setQueryData(meQuery.queryKey, null);
  const current = router.currentRoute.value;
  if (current.path !== '/login') void router.push({ path: '/login', query: { redirect: current.fullPath } });
});
