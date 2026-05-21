<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  User,
  View,
  ShoppingCart,
  Money,
  UserFilled,
} from '@element-plus/icons-vue'

const userStore = useUserStore()

const stats = ref([
  { title: '用户总数', value: '1,286', icon: User, color: '#409eff' },
  { title: '今日访问', value: '368', icon: View, color: '#67c23a' },
  { title: '订单数量', value: '89', icon: ShoppingCart, color: '#e6a23c' },
  { title: '收入金额', value: '¥12,680', icon: Money, color: '#f56c6c' },
])

const recentActivities = ref([
  { user: '管理员', action: '登录了系统', time: '2 分钟前' },
  { user: '张三', action: '创建了新订单', time: '15 分钟前' },
  { user: '李四', action: '更新了个人信息', time: '1 小时前' },
  { user: '王五', action: '导出了数据报表', time: '2 小时前' },
  { user: '管理员', action: '修改了系统配置', time: '3 小时前' },
])
</script>

<template>
  <div class="dashboard">
    <!-- 欢迎语 -->
    <div class="welcome-card">
      <div class="welcome-text">
        <h2>欢迎回来，{{ userStore.userInfo?.nickname || '用户' }}！</h2>
        <p>这是您的管理仪表盘，您可以在这里查看系统概况。</p>
      </div>
      <div class="welcome-emoji">👋</div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col v-for="stat in stats" :key="stat.title" :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-title">{{ stat.title }}</p>
              <p class="stat-value">{{ stat.value }}</p>
            </div>
            <div class="stat-icon" :style="{ background: stat.color + '15', color: stat.color }">
              <el-icon :size="28">
                <component :is="stat.icon" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-card shadow="hover" class="activity-card">
      <template #header>
        <span class="card-title">最近活动</span>
      </template>

      <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
        <el-avatar :size="36" icon="UserFilled" />
        <div class="activity-info">
          <p>
            <strong>{{ activity.user }}</strong>
            {{ activity.action }}
          </p>
          <span class="activity-time">{{ activity.time }}</span>
        </div>
        <el-tag v-if="index === 0" size="small" type="danger">最新</el-tag>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* ===== 欢迎卡片 ===== */
.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%);
  border-radius: var(--radius-lg);
  padding: 28px 36px;
  margin-bottom: 28px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  pointer-events: none;
}

.welcome-card::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50%;
  pointer-events: none;
}

.welcome-text {
  position: relative;
  z-index: 1;
}

.welcome-text h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
}

.welcome-text p {
  font-size: 14px;
  opacity: 0.85;
}

.welcome-emoji {
  font-size: 52px;
  line-height: 1;
  position: relative;
  z-index: 1;
  animation: bounce-soft 3s ease-in-out infinite;
}

@keyframes bounce-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* ===== 统计卡片 ===== */
.stats-row {
  margin-bottom: 28px;
}

.stat-card {
  margin-bottom: 20px;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--border-color) !important;
  transition: all var(--transition-base) !important;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md) !important;
  border-color: var(--primary) !important;
}

:deep(.stat-card .el-card__body) {
  padding: 20px 24px;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-color);
  letter-spacing: -0.5px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(-5deg);
}

/* ===== 活动卡片 ===== */
.card-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color);
}

.activity-card {
  margin-bottom: 24px;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--border-color) !important;
}

:deep(.activity-card .el-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.activity-card .el-card__body) {
  padding: 8px 24px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color-light);
  transition: background var(--transition-fast);
  border-radius: var(--radius-sm);
  margin: 0 -8px;
  padding: 14px 8px;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: var(--bg-color-muted);
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-info p {
  font-size: 14px;
  margin-bottom: 2px;
  color: var(--text-color);
}

.activity-info strong {
  font-weight: 600;
}

.activity-time {
  font-size: 12px;
  color: var(--text-color-tertiary);
}
</style>
