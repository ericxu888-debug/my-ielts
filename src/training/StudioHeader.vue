<script setup lang="ts">
import { ref } from 'vue'
import { connected, storageError, syncMessage } from './storage'
import { startSync } from './session'

startSync()
const resources = ref(false)
</script>

<template>
  <header class="studio-header">
    <div class="studio-nav">
      <RouterLink to="/" class="studio-brand" aria-label="IELTS Studio 首页">
        <span class="brand-symbol">i.</span><span>IELTS <b>STUDIO</b><small>你的私人英语训练台</small></span>
      </RouterLink>
      <nav aria-label="主导航">
        <RouterLink to="/" exact-active-class="nav-current">
          今日计划
        </RouterLink><RouterLink to="/train" active-class="nav-current">
          开始练习
        </RouterLink><RouterLink to="/review" active-class="nav-current">
          复盘记录
        </RouterLink><RouterLink to="/settings" active-class="nav-current">
          同步与设置
        </RouterLink>
      </nav>
      <button class="studio-resource" :aria-expanded="resources" @click="resources = !resources">
        资料库 ↗
      </button>
    </div>
    <div v-if="resources" class="resource-links">
      <RouterLink v-for="item in [['词汇', '/vocabulary'], ['语法', '/grammar'], ['听力', '/listening'], ['阅读资料', '/reading'], ['写作资料', '/writing']]" :key="item[1]" :to="item[1]" @click="resources = false">
        {{ item[0] }}
      </RouterLink>
    </div>
    <div class="studio-connection">
      <span class="connection-dot" :class="[{ online: connected }]" /><RouterLink to="/settings">
        {{ syncMessage }}
      </RouterLink><span class="connection-goal">ACADEMIC · UKVI / 目标 7.0</span>
    </div>
    <div v-if="storageError" role="alert" class="studio-alert">
      {{ storageError }}
    </div>
  </header>
</template>
