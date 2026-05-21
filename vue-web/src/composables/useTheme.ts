import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'

export function useTheme() {
  const themeStore = useThemeStore()
  const { themeMode } = storeToRefs(themeStore)

  function toggleTheme() {
    themeStore.toggleTheme()
  }

  function initTheme() {
    themeStore.initTheme()
  }

  return {
    themeMode,
    toggleTheme,
    initTheme,
  }
}
