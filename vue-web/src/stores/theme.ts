import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ThemeMode } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref<ThemeMode>('light')

  /** 初始化主题 - 从系统偏好或本地存储读取 */
  function initTheme() {
    const saved = localStorage.getItem('theme_mode') as ThemeMode | null
    if (saved) {
      themeMode.value = saved
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      themeMode.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme(themeMode.value)
  }

  /** 切换主题 */
  function toggleTheme() {
    themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
    applyTheme(themeMode.value)
    localStorage.setItem('theme_mode', themeMode.value)
  }

  /** 设置指定主题 */
  function setTheme(mode: ThemeMode) {
    themeMode.value = mode
    applyTheme(mode)
    localStorage.setItem('theme_mode', mode)
  }

  /** 应用主题到 html 标签 */
  function applyTheme(mode: ThemeMode) {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    themeMode,
    initTheme,
    toggleTheme,
    setTheme,
  }
})
