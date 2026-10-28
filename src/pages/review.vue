<script setup lang="ts">
import { computed, ref } from 'vue'
import { attempts } from '../training/storage'
import { dueAttempts, wordCount } from '../training/model'
import { prompts, skillLabels } from '../training/content'

const filter = ref('due')
const due = computed(() => dueAttempts(attempts.value))
const shown = computed(() => filter.value === 'due' ? due.value : filter.value === 'draft' ? attempts.value.filter(a => a.status === 'draft') : attempts.value)
function title(id: string) {
  return prompts.find(p => p.id === id)?.title || id
}
function date(value: string) {
  return new Date(value).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="studio-page">
    <div class="page-eyebrow">
      EVIDENCE OF YOUR PROGRESS <span>03 / 复盘记录</span>
    </div><h1 class="page-title">
      留下证据，看到变化。
    </h1><p class="page-intro">
      先回忆上次的问题，再打开记录检验。单次做对不等于长期掌握。
    </p>
    <div class="studio-tabs" role="group" aria-label="记录筛选">
      <button :class="{ selected: filter === 'due' }" @click="filter = 'due'">
        待复盘 · {{ due.length }}
      </button><button :class="{ selected: filter === 'all' }" @click="filter = 'all'">
        全部记录 · {{ attempts.length }}
      </button><button :class="{ selected: filter === 'draft' }" @click="filter = 'draft'">
        草稿
      </button>
    </div>
    <div v-if="!shown.length" class="empty-state">
      <span class="section-kicker">A FRESH START</span><h2>{{ filter === 'due' ? '当前没有待复盘任务' : '这里会留下你的真实练习' }}</h2><p>提交一次练习，记录一个改进点。<br>复习到期后，任务会出现在这里。</p><RouterLink to="/train" class="btn btn-primary">
        开始练习 ↗
      </RouterLink>
    </div>
    <article v-for="a in shown" :key="a.id" class="panel review-card">
      <div>
        <div class="between">
          <span :class="`skill-badge ${a.skill}`">{{ skillLabels[a.skill] }}</span><span class="muted">{{ date(a.createdAt) }}</span>
        </div><h2>{{ title(a.promptId) }}</h2><p class="muted">
          {{ a.status === 'draft' ? '草稿' : a.status === 'review' ? '待复盘' : '已复盘' }} · {{ Math.floor(a.elapsed / 60) }} 分 {{ a.elapsed % 60 }} 秒<span v-if="a.text"> · {{ wordCount(a.text) }} 词</span><span v-if="a.hasAudio"> · 有录音</span><span v-if="a.parentId"> · 同题重练</span>
        </p><p v-if="a.focus">
          <strong>改进点：</strong>{{ a.focus }}
        </p><p v-if="a.reflection" class="muted">
          {{ a.reflection }}
        </p><p v-if="a.reviewAt && a.status === 'complete'" class="status-line">
          下次检验 {{ date(a.reviewAt) }} · 已安排 {{ a.reviews }} 次复习
        </p>
      </div><div>
        <RouterLink :to="`/train?id=${a.id}`" class="btn btn-secondary">
          {{ a.status === 'draft' ? '继续作答' : '查看与重练' }} →
        </RouterLink>
      </div>
    </article>
    <div class="studio-note">
      练习记录帮助你观察变化，不自动换算雅思成绩。口语和写作建议定期结合真人反馈；阅读短篇成绩不能代替整套测试。
    </div>
  </div>
</template>
