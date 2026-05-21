<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { themeMode, toggleTheme } = useTheme()

const tooltipContent = computed(() =>
  themeMode.value === 'light' ? '切换到暗色模式' : '切换到亮色模式'
)
</script>

<template>
  <el-tooltip :content="tooltipContent" placement="bottom">
    <button
      class="theme-toggle"
      :class="{ 'is-dark': themeMode === 'dark' }"
      @click="toggleTheme"
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
