<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ThemeToggle from '@/components/ThemeToggle.vue'
import MenuTree from '@/components/MenuTree'
import AvatarCropper from '@/components/AvatarCropper.vue'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  User,
  Avatar,
  ArrowDown,
  SwitchButton,
  Key,
  Fold,
  Expand,
  Upload,
} from '@element-plus/icons-vue'
import { changePasswordApi, uploadAvatarApi } from '@/api/user'

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
      userId: userStore.userInfo!.id as number,
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
  if (command === 'uploadAvatar') {
    openAvatarUpload()
  } else if (command === 'changePwd') {
    openPwdDialog()
  } else if (command === 'logout') {
    handleLogout()
  }
}

/** 图标映射 */
const iconMap: Record<string, any> = {
  DataAnalysis,
  User,
  Avatar,
}

// ===== 头像上传 =====
const avatarDialogVisible = ref(false)

function openAvatarUpload() {
  avatarDialogVisible.value = true
}

function handleAvatarSuccess(_url: string) {
  // store 已自动更新
}
</script>

<template>
  <div class="admin-layout" :class="{ collapsed: isCollapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- Logo 区域 -->
      <div class="logo" @click="toggleSidebar">
        <div class="logo-icon-wrapper">
          <span class="logo-icon">⚡</span>
        </div>
        <transition name="fade">
          <span v-show="!isCollapsed" class="logo-text">OK_攻城狮</span>
        </transition>
      </div>

      <!-- 菜单区域 -->
      <div class="menu-wrapper">
        <el-menu
          :default-active="router.currentRoute.value.path"
          :collapse="isCollapsed"
          :collapse-transition="false"
          background-color="transparent"
          text-color="var(--sidebar-text)"
          active-text-color="var(--sidebar-active-text)"
          router
        >
          <!-- 动态菜单（递归渲染，支持无限层级） -->
          <MenuTree :menus="userStore.userInfo?.menus || []" />
        </el-menu>
      </div>

      <!-- 侧边栏底部折叠按钮 -->
      <div class="sidebar-footer" @click="toggleSidebar">
        <el-icon :class="{ 'rotate-180': isCollapsed }">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
        <transition name="fade">
          <span v-show="!isCollapsed" class="footer-text">收起侧边栏</span>
        </transition>
      </div>
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
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.userName || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-item command="uploadAvatar">
                <el-icon><Upload /></el-icon>
                上传头像
              </el-dropdown-item>
              <el-dropdown-item command="changePwd">
                <el-icon><Key /></el-icon>
                修改密码
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content">
        <router-view />
      </main>
    </div>

    <!-- 头像上传弹窗 -->
    <AvatarCropper v-model="avatarDialogVisible" @success="handleAvatarSuccess" />

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
/* ===== 整体布局 ===== */
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
  position: relative;
}

.collapsed .sidebar {
  width: var(--sidebar-collapsed-width);
}

/* Logo 区域 */
.logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  white-space: nowrap;
  overflow: hidden;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
  transition: padding var(--transition-base);
}

.collapsed .logo {
  padding: 0 0;
  justify-content: center;
}

.logo-icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.logo-icon {
  font-size: 18px;
  line-height: 1;
  filter: brightness(10);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--logo-text);
  letter-spacing: 0.5px;
}

/* 菜单区域 — 可滚动 */
.menu-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.menu-wrapper::-webkit-scrollbar {
  width: 3px;
}

.menu-wrapper::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.sidebar .el-menu {
  border-right: none;
  background: transparent;
}

/* el-menu-item 样式 */
:deep(.el-menu-item) {
  margin: 2px 10px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  height: 42px;
  line-height: 42px;
}

:deep(.el-menu-item:hover) {
  background: var(--sidebar-hover-bg) !important;
}

:deep(.el-menu-item.is-active) {
  background: var(--sidebar-active-bg) !important;
  color: var(--sidebar-active-text) !important;
  font-weight: 600;
  position: relative;
}

:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--primary);
  border-radius: 0 3px 3px 0;
}

:deep(.el-menu-item .el-icon) {
  color: inherit;
  font-size: 18px;
}

/* el-sub-menu 样式 */
:deep(.el-sub-menu__title) {
  margin: 2px 10px;
  border-radius: var(--radius-md);
  height: 42px;
  line-height: 42px;
  transition: all var(--transition-fast);
}

:deep(.el-sub-menu__title:hover) {
  background: var(--sidebar-hover-bg) !important;
}

:deep(.el-sub-menu .el-menu) {
  background: transparent;
}

:deep(.el-sub-menu .el-menu .el-menu-item) {
  padding-left: 52px !important;
  margin: 1px 10px;
  height: 38px;
  line-height: 38px;
  font-size: 13px;
}

/* 折叠状态适配 — 所有菜单项图标居中 */
.collapsed .sidebar :deep(.el-menu-item),
.collapsed .sidebar :deep(.el-sub-menu__title) {
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  margin: 2px auto;
  border-radius: var(--radius-sm);
}

.collapsed .sidebar :deep(.el-menu-item) .el-icon,
.collapsed .sidebar :deep(.el-sub-menu__title) .el-icon {
  margin: 0 !important;
  font-size: 20px;
}

.collapsed .sidebar :deep(.el-menu-item) span,
.collapsed .sidebar :deep(.el-sub-menu__title) span,
.collapsed .sidebar :deep(.el-sub-menu__title .el-icon) ~ span {
  display: none;
}

.collapsed .sidebar :deep(.el-menu-item.is-active::before) {
  display: none;
}

.collapsed .sidebar :deep(.el-sub-menu .el-menu) {
  display: none;
}

/* 侧边栏底部折叠按钮 */
.sidebar-footer {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-top: 1px solid var(--border-color);
  cursor: pointer;
  flex-shrink: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
  transition: all var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
}

.sidebar-footer:hover {
  color: var(--primary);
  background: var(--primary-bg);
}

.collapsed .sidebar-footer {
  padding: 0;
  justify-content: center;
}

.sidebar-footer .el-icon {
  font-size: 16px;
  flex-shrink: 0;
  transition: transform var(--transition-base);
}

.sidebar-footer .rotate-180 {
  transform: rotate(180deg);
}

.footer-text {
  font-size: 13px;
}

/* 文字渐隐动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
