<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
const { themeMode } = storeToRefs(themeStore)

const tooltipContent = computed(() =>
  themeMode.value === 'light' ? '切换到暗色模式' : '切换到亮色模式'
)

function handleToggle(e: MouseEvent) {
  const isDark = themeMode.value === 'dark'
  const nextMode = isDark ? 'light' : 'dark'

  // 创建遮罩元素
  const mask = document.createElement('div')
  mask.className = 'theme-transition-mask'

  // 计算点击位置到四个角的最远距离作为圆形半径
  const { clientX, clientY } = e
  const maxRadius = Math.hypot(
    Math.max(clientX, window.innerWidth - clientX),
    Math.max(clientY, window.innerHeight - clientY),
  )

  // 遮罩起始在点击位置，结束扩散到全屏
  mask.style.setProperty('--start-x', `${clientX}px`)
  mask.style.setProperty('--start-y', `${clientY}px`)
  mask.style.setProperty('--end-r', `${maxRadius}px`)

  // 遮罩颜色 — 半透明，让底层元素渐变可见
  mask.style.setProperty('--mask-bg', nextMode === 'dark' ? 'rgba(15, 15, 19, 0.62)' : 'rgba(240, 242, 245, 0.62)')

  document.body.appendChild(mask)

  // 触发动画
  requestAnimationFrame(() => {
    mask.classList.add('animate')
  })

  // 动画过半时切换主题
  const duration = 500
  const midPoint = duration * 0.45
  setTimeout(() => {
    themeStore.setTheme(nextMode as 'light' | 'dark')
  }, midPoint)

  // 动画结束后移除遮罩
  setTimeout(() => {
    mask.remove()
  }, duration + 50)
}
</script>

<template>
  <el-tooltip :content="tooltipContent" placement="bottom">
    <button
      class="theme-toggle"
      :class="{ 'is-dark': themeMode === 'dark' }"
      @click="handleToggle"
      :aria-label="tooltipContent"
    >
      <!-- 太阳图标 -->
      <span class="icon-sun">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
      <!-- 月亮图标 -->
      <span class="icon-moon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  </el-tooltip>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-color-container);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all var(--transition-base);
  color: var(--text-color-secondary);
}

.theme-toggle:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-bg);
  transform: rotate(15deg);
}

.theme-toggle svg {
  width: 18px;
  height: 18px;
}

.icon-sun,
.icon-moon {
  position: absolute;
  transition: all var(--transition-slow);
}

.icon-sun {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.icon-moon {
  opacity: 0;
  transform: rotate(90deg) scale(0);
}

.is-dark .icon-sun {
  opacity: 0;
  transform: rotate(-90deg) scale(0);
}

.is-dark .icon-moon {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}
</style>

<style>
/* 全局遮罩动画 — 非 scoped 以覆盖全屏 */
.theme-transition-mask {
  position: fixed;
  inset: 0;
  z-index: 99999;
  pointer-events: none;
  background: var(--mask-bg);

  --start-r: 0px;
  clip-path: circle(var(--start-r) at var(--start-x) var(--start-y));
  transition: none;
}

.theme-transition-mask.animate {
  --start-r: var(--end-r);
  transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  clip-path: circle(var(--end-r) at var(--start-x) var(--start-y));
}
</style>
