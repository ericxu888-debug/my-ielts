<script setup lang="ts">
import { computed } from 'vue'
import { attempts } from './storage'
import { dueAttempts } from './model'
import { prompts, skillLabels } from './content'

const due = computed(() => dueAttempts(attempts.value))
const drafts = computed(() => attempts.value.filter(a => a.status === 'draft'))
const recent = computed(() => attempts.value.filter(a => a.status !== 'draft' && Date.now() - Date.parse(a.createdAt) < 7 * 86400000))
const practiceMinutes = computed(() => Math.round(recent.value.reduce((sum, a) => sum + a.elapsed, 0) / 60))
const recommendations = computed(() => (['speaking', 'writing', 'reading'] as const).map((skill) => {
  const candidates = prompts.filter(p => p.skill === skill)
  return candidates.find(p => !attempts.value.some(a => a.promptId === p.id && a.status !== 'draft')) || candidates[0]
}))
function title(id: string) {
  return prompts.find(p => p.id === id)?.title || '自选练习'
}
</script>

<template>
  <div class="studio-page">
    <div class="page-eyebrow">
      YOUR PERSONAL LEARNING SPACE <span>01 / 今日计划</span>
    </div>
    <section class="studio-hero">
      <div>
        <div class="hero-kicker">
          <span class="tiny-dot" /> 从 6.5 出发，向 7.0 前进
        </div><h1>练习有方向，<br>进步有<span>证据。</span></h1><p>把一次练习变成真正的掌握。先独立作答，再找到问题，<br class="desktop-only">带着一个明确目标，练第二遍。</p><RouterLink class="btn btn-primary" :to="due.length ? '/review' : '/train?skill=speaking'">
          {{ due.length ? '先完成待复盘练习' : '开始今天的口语练习' }} <span>↗</span>
        </RouterLink>
      </div>
      <div class="goal-card">
        <div class="goal-card-top">
          MY NEXT MILESTONE <span>↗</span>
        </div><div class="goal-number">
          7<span>.0</span>
        </div><p>Academic UKVI · 目标总分</p><div class="goal-divider" /><div class="goal-detail">
          <span>近期目标</span><b>11 月 · 首次检验</b>
        </div><div class="goal-detail">
          <span>长期目标</span><b>更准确，也更自然地表达</b>
        </div><small>当前总分 6.5 / 口语 6.0 · 自述基线<br>其余单项待诊断，不推算未测成绩</small>
      </div>
    </section>
    <section class="stats-strip" aria-label="真实学习记录">
      <div><strong>{{ recent.length }}<small> 次</small></strong><span>近 7 天提交练习</span></div><div><strong>{{ practiceMinutes }}<small> 分钟</small></strong><span>近 7 天有效计时</span></div><div><strong>{{ due.length }}<small> 项</small></strong><span>现在需要复盘</span></div><div><strong>{{ drafts.length }}<small> 份</small></strong><span>未完成草稿</span></div>
    </section>
    <section v-if="due.length || drafts.length" class="resume-panel">
      <div><span class="section-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>{{ due.length ? '先处理反馈，再开新题' : '接着上次的思路' }}</h2><p>{{ due.length ? '重练前，先尝试不看旧答案，回忆上次的改进目标。' : '答案已经保存在当前设备，连接服务后可同步。' }}</p></div><RouterLink class="btn btn-secondary" :to="due.length ? '/review' : `/train?id=${drafts[0].id}`">
        {{ due.length ? `复盘 ${due.length} 项` : `继续 ${title(drafts[0].promptId)}` }} →
      </RouterLink>
    </section>
    <div class="section-heading">
      <div><span class="section-kicker">DELIBERATE PRACTICE</span><h2>今天，认真练好这一点</h2></div><span class="muted">先保证质量，再增加题量</span>
    </div>
    <section class="practice-grid">
      <RouterLink v-for="(p, i) in recommendations" :key="p.id" class="practice-card" :to="`/train?prompt=${p.id}`">
        <div class="practice-card-top">
          <span :class="`skill-badge ${p.skill}`">{{ skillLabels[p.skill] }}</span><span class="practice-number">0{{ i + 1 }}</span>
        </div><h3>{{ p.title }}</h3><p>{{ p.section }} · {{ p.minutes }} 分钟</p><div class="practice-description">
          {{ p.skill === 'speaking' ? '录下回答，回放找出一个问题，再说一次。' : p.skill === 'writing' ? '独立完成初稿，用修改证明你理解了反馈。' : '先判断，再用原文证据解释自己的选择。' }}
        </div><div class="practice-card-bottom">
          <span>{{ p.skill === 'reading' ? '原创短篇 · 非完整模考' : '原创训练题' }}</span><b>开始练习 ↗</b>
        </div>
      </RouterLink>
    </section>
    <section class="method-panel">
      <div><span class="section-kicker">HOW PROGRESS HAPPENS</span><h2>练完不是终点，<br>能再次做对才是。</h2><p>不以打卡天数替代能力变化。留下作答、证据和修改，让复盘有迹可循。</p></div><ol><li><b>01</b><div><strong>先提取，再看答案</strong><p>独立回忆与作答，暴露真实薄弱点。</p></div></li><li><b>02</b><div><strong>一次聚焦一个改进点</strong><p>用具体原句或原文证据解释问题。</p></div></li><li><b>03</b><div><strong>隔一段时间，重新检验</strong><p>按掌握情况安排 1、2、3 天起的复习；这是一项可调整的学习策略。</p></div></li></ol>
    </section>
  </div>
</template>
