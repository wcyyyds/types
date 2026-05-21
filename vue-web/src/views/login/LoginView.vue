<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { LoginParams } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

const loginFormRef = ref()

// --- 登录数据 ---
const loginForm = reactive<LoginParams>({
  userName: '',
  passWord: '',
})

const loginRules = {
  userName: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
  ],
  passWord: [
    { required: true, message: '安全密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
}

async function submitLogin() {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
  } catch {
    ElMessage.error('表单输入不合规，请检查红字提示')
    return
  }

  loading.value = true
  try {
    await userStore.login({ userName: loginForm.userName, passWord: loginForm.passWord })
    ElMessage.success('身份验证通过，正在进入 Aether 控制台...')
    router.push('/dashboard')
  } catch {
    // ElMessage.error('登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">

    <!-- 背景艺术装饰元素 -->
    <div
      class="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-100/50 blur-[120px] pointer-events-none">
    </div>
    <div
      class="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-300/20 blur-[120px] pointer-events-none">
    </div>

    <div
      class="w-full max-w-7xl h-full md:h-[750px] bg-[#111827]/70 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex relative backdrop-blur-xl">

      <!-- ===== 左侧：宣传及品牌展示区 ===== -->
      <div
        class="hidden md:flex md:w-1/2 flex justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-12 flex-col justify-between relative overflow-hidden border-r border-white/5">

        <!-- 科技感背景动画 -->
        <div class="absolute inset-0 pointer-events-none">
          <!-- 网格线 -->
          <div
            class="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
          </div>
          <!-- 旋转电路环 -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-indigo-500/10 rounded-full animate-[spin_20s_linear_infinite]">
            <div
              class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400/60 rounded-full shadow-[0_0_6px_2px_rgba(99,102,241,0.4)]">
            </div>
          </div>
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-purple-500/10 rounded-full animate-[spin_35s_linear_infinite_reverse]">
            <div
              class="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 bg-purple-400/60 rounded-full shadow-[0_0_8px_3px_rgba(168,85,247,0.4)]">
            </div>
          </div>
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] border border-pink-500/10 rounded-full animate-[spin_50s_linear_infinite]">
            <div
              class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-pink-400/60 rounded-full shadow-[0_0_6px_2px_rgba(236,72,153,0.4)]">
            </div>
          </div>
          <!-- 浮动光晕 -->
          <div class="absolute top-[15%] left-[20%] w-48 h-48 bg-indigo-500/8 rounded-full blur-[80px] animate-pulse">
          </div>
          <div
            class="absolute bottom-[20%] right-[15%] w-36 h-36 bg-purple-500/8 rounded-full blur-[80px] animate-pulse [animation-delay:2s]">
          </div>
          <!-- 飘浮粒子 -->
          <div
            class="absolute top-[20%] left-[30%] w-1 h-1 bg-indigo-300/40 rounded-full animate-[float_6s_ease-in-out_infinite]">
          </div>
          <div
            class="absolute top-[40%] left-[60%] w-0.5 h-0.5 bg-purple-300/40 rounded-full animate-[float_8s_ease-in-out_infinite_1s]">
          </div>
          <div
            class="absolute top-[60%] left-[25%] w-1 h-1 bg-pink-300/30 rounded-full animate-[float_7s_ease-in-out_infinite_0.5s]">
          </div>
          <div
            class="absolute top-[75%] left-[55%] w-0.5 h-0.5 bg-indigo-300/30 rounded-full animate-[float_9s_ease-in-out_infinite_2s]">
          </div>
          <div
            class="absolute top-[30%] left-[75%] w-1 h-1 bg-purple-300/30 rounded-full animate-[float_6.5s_ease-in-out_infinite_1.5s]">
          </div>
          <!-- 角落科技装饰 -->
          <div
            class="absolute top-8 left-8 w-12 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent">
          </div>
          <div
            class="absolute top-8 left-8 w-[1px] h-12 bg-gradient-to-b from-transparent via-indigo-400/50 to-transparent">
          </div>
          <div
            class="absolute bottom-8 right-8 w-16 h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent">
          </div>
          <div
            class="absolute bottom-8 right-8 w-[1px] h-16 bg-gradient-to-b from-transparent via-purple-400/50 to-transparent">
          </div>
        </div>

        <div class="z-10 my-auto pr-8 justify-center flex relative top-[-200px]">
          <h1 class="text-4xl lg:text-5xl font-bold text-white leading-tight mt-6">
            用人工智能<br>
            <span
              class="bg-gradient-to-r from-primary-light via-purple-400 to-pink-400 bg-clip-text text-transparent">重塑未来开发流</span>
          </h1>
        </div>
      </div>

      <!-- ===== 右侧：表单操作区 ===== -->
      <div class="w-full md:w-1/2 lg:p-14 flex flex-col justify-center relative" style="padding: 100px;">

        <!-- 表单头部 -->
        <div class="mb-8 relative top-[-20px]">
          <h2 class="text-2xl font-bold text-white mb-2">欢迎回来</h2>
          <p class="text-sm text-gray-400">请输入您的凭证以访问工作台</p>
        </div>

        <!-- 登录/注册表单切换 -->
        <transition name="fade-slide" mode="out-in">
          <!-- 登录表单 -->
          <div key="login">
            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top" status-icon>
              <el-form-item label="账号" prop="userName">
                <el-input
                  v-model="loginForm.userName"
                  name="userName"
                  autocomplete="off"
                  placeholder="请输入您的账号"
                  clearable
                >
                  <template #prefix><span class="text-gray-400">✉</span></template>
                </el-input>
              </el-form-item>
              <el-form-item label="安全密码" prop="passWord">
                <el-input
                  v-model="loginForm.passWord"
                  name="passWord"
                  autocomplete="new-password"
                  type="password"
                  placeholder="请输入您的密码"
                  show-password
                >
                  <template #prefix><span class="text-gray-400">🔒</span></template>
                </el-input>
              </el-form-item>

              <button type="button" @click="submitLogin" :disabled="loading" class="submit-btn">
                <span v-if="loading"
                  class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                <span>{{ loading ? '身份验证中...' : '登录系统' }}</span>
              </button>
            </el-form>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1040 30%, #0d0d2b 60%, #0a0a1a 100%);
}

/* ===== 背景动态粒子装饰 ===== */
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20% 30%, rgba(99, 102, 241, 0.3), transparent),
    radial-gradient(2px 2px at 40% 70%, rgba(139, 92, 246, 0.25), transparent),
    radial-gradient(2px 2px at 60% 20%, rgba(99, 102, 241, 0.2), transparent),
    radial-gradient(2px 2px at 80% 60%, rgba(168, 85, 247, 0.2), transparent),
    radial-gradient(1px 1px at 10% 80%, rgba(255, 255, 255, 0.15), transparent),
    radial-gradient(1px 1px at 70% 90%, rgba(255, 255, 255, 0.1), transparent),
    radial-gradient(1px 1px at 90% 10%, rgba(255, 255, 255, 0.12), transparent),
    radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.08), transparent);
  background-size: 200px 200px;
  animation: twinkle 8s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes twinkle {
  0% {
    opacity: 0.6;
  }

  100% {
    opacity: 1;
  }
}

/* ===== 粒子浮动动画 ===== */
@keyframes float {

  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.4;
  }

  50% {
    transform: translateY(-20px) scale(1.5);
    opacity: 0.8;
  }
}

/* ===== 表单切换动画 ===== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ===== 提交按钮 ===== */
.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%);
  color: white;
  font-weight: 600;
  padding: 14px 20px;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--primary-dark) 0%, #6d28d9 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.submit-btn:hover::before {
  opacity: 1;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn>* {
  position: relative;
  z-index: 1;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* ===== 社交登录按钮 ===== */
.social-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  cursor: pointer;
}

.social-btn:hover {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
  transform: translateY(-2px);
}

/* ===== 验证码按钮 ===== */
.code-btn {
  padding: 0 16px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.code-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.2);
  border-color: var(--primary);
}

.code-btn.is-countdown {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #6b7280;
  cursor: not-allowed;
}

/* ===== Element Plus 暗色主题覆盖 ===== */
:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__label) {
  color: #d1d5db !important;
  font-weight: 500;
  font-size: 13px;
  padding-bottom: 6px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: var(--radius-sm) !important;
  box-shadow: none !important;
  padding: 4px 12px !important;
  transition: all 0.25s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(99, 102, 241, 0.4) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(99, 102, 241, 0.6) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
}

:deep(.el-input__inner) {
  color: #e5e7eb !important;
  caret-color: #818cf8;
  font-size: 14px;
  height: 40px;
}

:deep(.el-input__inner::placeholder) {
  color: #6b7280 !important;
}

:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #f87171 !important;
  background: rgba(248, 113, 113, 0.05) !important;
}

:deep(.el-form-item__error) {
  color: #f87171 !important;
  font-size: 12px;
  padding-top: 4px;
}

/* Checkbox */
:deep(.el-checkbox) {
  height: auto;
}

:deep(.el-checkbox__label) {
  color: #9ca3af !important;
  font-size: 13px;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #6366f1 !important;
  border-color: #6366f1 !important;
}

:deep(.el-checkbox__inner) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-page {
    background: linear-gradient(135deg, #0f0c29 0%, #1a1040 50%, #0a0a1a 100%);
    padding: 16px;
    align-items: flex-start;
    padding-top: 40px;
  }
}
</style>
