<script setup lang="ts">
import StudioHeader from './training/StudioHeader.vue'
import './training/studio.css'
</script>

<template>
  <StudioHeader />
  <main class="studio-main">
    <RouterView />
  </main>
  <footer class="studio-footer">
    <span>IELTS STUDIO · 私人学习空间</span><span>练习 → 复盘 → 重练 → 间隔复习</span>
  </footer>
</template>
