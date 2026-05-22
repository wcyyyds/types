import { createRouter, createWebHistory } from 'vue-router'
import { tokenManager } from '@/utils'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { title: '仪表盘', requiresAuth: true },
        },
        {
          path: 'user',
          name: 'user',
          component: () => import('@/views/user/UserManagement.vue'),
          meta: { title: '人员管理', requiresAuth: true },
        },
        {
          path: 'role',
          name: 'role',
          component: () => import('@/views/role/RoleManagement.vue'),
          meta: { title: '角色管理', requiresAuth: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/dashboard',
    },
  ],
})

// 路由守卫 - 未登录跳转登录页
router.beforeEach((to, _from) => {
  const requiresAuth = to.meta.requiresAuth !== false
  const isLoggedIn = tokenManager.has()

  if (requiresAuth && !isLoggedIn) {
    return '/login'
  } else if (to.path === '/login' && isLoggedIn) {
    return '/dashboard'
  }
})

export default router
