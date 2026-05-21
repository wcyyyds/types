<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useUserStore } from '@/stores/user'

const { initTheme } = useTheme()
const userStore = useUserStore()

onMounted(() => {
  initTheme()
  userStore.restoreUser()
})
</script>

<template>
  <router-view />
</template>
