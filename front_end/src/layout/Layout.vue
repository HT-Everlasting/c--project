<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px" class="sidebar">
        <div class="logo">
          <el-icon><OfficeBuilding /></el-icon>
          <span>智能酒店管理</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          router
        >
          <el-menu-item index="/checkin">
            <el-icon><Memo /></el-icon>
            <span>自助登记</span>
          </el-menu-item>
          <el-menu-item index="/room-status">
            <el-icon><House /></el-icon>
            <span>房间状态</span>
          </el-menu-item>
           <el-menu-item index="/booking-management">
            <el-icon><Tickets /></el-icon>
            <span>预订管理</span>
          </el-menu-item>
          <el-menu-item index="/checkout">
            <el-icon><ShoppingCart /></el-icon>
            <span>自助退房</span>
          </el-menu-item>
           <el-menu-item index="/booking-query">
            <el-icon><Search /></el-icon>
            <span>预订查询</span>
          </el-menu-item>
          <el-menu-item index="/smart-lock">
            <el-icon><Lock /></el-icon>
            <span>智能锁管理</span>
          </el-menu-item>
          <el-menu-item index="/statistics">
            <el-icon><PieChart /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  OfficeBuilding,
  Memo,
  House,
  Tickets,
  ShoppingCart,
  Search,
  Lock,
  PieChart
} from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.common-layout, .el-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: #bfcbd9;
  border-right: none;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  background-color: #2b2f3a;
}

.logo .el-icon {
  margin-right: 8px;
  font-size: 1.5rem;
}

.el-menu-vertical {
  height: calc(100vh - 60px);
  border-right: none;
  background-color: #304156;
}

.el-menu-item {
  color: #bfcbd9;
}

.el-menu-item:hover {
  background-color: #263445 !important;
}

.el-menu-item.is-active {
  color: #409eff !important;
  background-color: #263445 !important;
}

.el-menu-item i {
  color: #bfcbd9;
}

.el-menu-item.is-active i {
  color: #409eff;
}

.main-content {
  padding: 20px;
  background-color: #f0f2f5;
}
</style> 