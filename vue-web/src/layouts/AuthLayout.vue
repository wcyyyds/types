<script setup lang="ts">
</script>

<template>
  <div class="auth-layout">
    <div class="auth-container">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1040 30%, #0d0d2b 60%, #0a0a1a 100%);
  position: relative;
  overflow: hidden;
}

.auth-layout::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 60vw;
  height: 60vw;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent 70%);
  pointer-events: none;
}

.auth-layout::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 50vw;
  height: 50vw;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.06), transparent 70%);
  pointer-events: none;
}

.auth-container {
  width: 100%;
  max-width: 440px;
  padding: 20px;
  position: relative;
  z-index: 1;
}
</style>
