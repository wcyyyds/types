<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  User,
  ArrowDown,
  SwitchButton,
  Key,
} from '@element-plus/icons-vue'
import { changePasswordApi } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const isCollapsed = ref(false)

// ===== 密码修改弹窗 =====
const pwdDialogVisible = ref(false)
const pwdFormRef = ref()
const pwdLoading = ref(false)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwdRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

function openPwdDialog() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdDialogVisible.value = true
}

async function handleChangePassword() {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate()

  pwdLoading.value = true
  try {
    await changePasswordApi({
      userId: userStore.userInfo!.id,
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    })
    ElMessage.success('密码修改成功，请重新登录')
    pwdDialogVisible.value = false
    // 修改密码后强制登出，让用户用新密码重新登录
    await userStore.logout()
    router.push('/login')
  } catch {
    // 错误已在拦截器中处理
  } finally {
    pwdLoading.value = false
  }
}

// ===== 侧边栏 =====
function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

function handleDropdownCommand(command: string) {
  if (command === 'changePwd') {
    openPwdDialog()
  } else if (command === 'logout') {
    handleLogout()
  }
}
</script>

<template>
  <div class="admin-layout" :class="{ collapsed: isCollapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">⚡</span>
        <span v-show="!isCollapsed" class="logo-text">Admin</span>
      </div>

      <el-menu
        :default-active="router.currentRoute.value.path"
        :collapse="isCollapsed"
        background-color="transparent"
        text-color="var(--sidebar-text)"
        active-text-color="var(--sidebar-active-text)"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <template #title>人员管理</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 主区域 -->
    <div class="main-area">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapsed ? 'Expand' : 'Fold'"
            text
            @click="toggleSidebar"
          />
        </div>

        <div class="header-right">
          <ThemeToggle />

          <el-dropdown trigger="click" @command="handleDropdownCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ userStore.userInfo?.userName || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changePwd">
                  <el-icon><Key /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content">
        <router-view />
      </main>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="修改密码"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-width="90px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-color);
}

/* ===== 侧边栏 ===== */
.sidebar {
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  transition: width var(--transition-slow);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  z-index: 10;
}

.collapsed .sidebar {
  width: var(--sidebar-collapsed-width);
}

.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--logo-text);
  white-space: nowrap;
  overflow: hidden;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.logo-icon {
  font-size: 26px;
  flex-shrink: 0;
  line-height: 1;
}

.logo-text {
  transition: opacity var(--transition-base), width var(--transition-base);
  overflow: hidden;
}

.collapsed .logo-text {
  opacity: 0;
  width: 0;
}

.sidebar .el-menu {
  border-right: none;
  flex: 1;
  padding: 8px 0;
}

/* Element Plus 菜单暗色适配 */
:deep(.el-menu-item) {
  margin: 2px 8px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

:deep(.el-menu-item:hover) {
  background: var(--sidebar-hover-bg) !important;
}

:deep(.el-menu-item.is-active) {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
}

:deep(.el-menu-item .el-icon) {
  color: inherit;
}

/* 折叠时菜单适配 */
.collapsed :deep(.el-menu-item) {
  margin: 2px 12px;
  border-radius: var(--radius-sm);
  justify-content: center;
}

/* ===== 主区域 ===== */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ===== 顶部导航 ===== */
.header {
  height: var(--header-height);
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 5;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.user-info:hover {
  background: var(--primary-bg);
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

/* ===== 内容区域 ===== */
.content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background: var(--bg-color);
}
</style>
