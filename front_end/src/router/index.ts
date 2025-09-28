import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/checkin',
    children: [
      {
        path: 'checkin',
        name: 'CheckIn',
        component: () => import('@/views/CheckIn.vue'),
        meta: { title: '自助登记' }
      },
      {
        path: 'checkout',
        name: 'CheckOut',
        component: () => import('@/views/CheckOut.vue'),
        meta: { title: '自助退房' }
      },
      {
        path: 'room-status',
        name: 'RoomStatus',
        component: () => import('@/views/RoomStatus.vue'),
        meta: { title: '房间状态' }
      },
      {
        path: 'booking-query',
        name: 'BookingQuery',
        component: () => import('@/views/BookingQuery.vue'),
        meta: { title: '预订查询' }
      },
      {
        path: 'smart-lock',
        name: 'SmartLock',
        component: () => import('@/views/SmartLock.vue'),
        meta: { title: '智能锁管理' }
      },
      {
        path: 'booking-management',
        name: 'BookingManagement',
        component: () => import('@/views/BookingManagement.vue'),
        meta: { title: '预订管理' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '数据统计' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智能酒店管理系统`
  }
  next()
})

export default router 
 