<script setup lang="ts">
import { computed, ref } from 'vue'
import { allSpeakingBites, dailyLessonMessage } from '../training/lessons'

const category = ref('全部')
const search = ref('')
const categories = ['全部', '展开回答', '自然表达', '语法修正', '发音意识']
const shown = computed(() => allSpeakingBites.value.filter(b => (category.value === '全部' || b.category === category.value) && `${b.title} ${b.point} ${b.before} ${b.after}`.toLowerCase().includes(search.value.trim().toLowerCase())))
</script>

<template>
  <div class="studio-page">
    <div class="page-eyebrow">
      SMALL LESSONS, REAL PRACTICE <span>口语小课堂</span>
    </div><h1 class="page-title">
      每天学一点，说出来才算会。
    </h1><p class="page-intro">
      从你能马上使用的小知识开始：看懂区别，用自己的经历说一遍，再换题检验。不要求背诵例句。
    </p><label for="knowledge-search" class="field-label">找一个想解决的小问题</label><input id="knowledge-search" v-model="search" class="studio-input" placeholder="搜索：过去时、展开、important、spend…" type="search"><div class="studio-tabs" style="margin-top:20px" role="group" aria-label="口语知识分类">
      <button v-for="item in categories" :key="item" :class="{ selected: category === item }" @click="category = item">
        {{ item }}
      </button>
    </div>
    <p class="studio-note">
      {{ dailyLessonMessage }} · 当前共 {{ allSpeakingBites.length }} 条。新增内容按日期归档，不替换历史内容。
    </p>
    <p v-if="!shown.length" class="studio-note">
      暂时没有匹配的小知识，试试换个关键词。
    </p>
    <div class="knowledge-grid">
      <article v-for="bite in shown" :key="bite.id" class="knowledge-card panel">
        <p v-if="bite.source === 'ai'" class="status-line">
          {{ bite.day }} 新增 · AI 生成，练习参考
        </p>
        <span class="skill-badge speaking">{{ bite.category }}</span><h2>{{ bite.title }}</h2><p>{{ bite.point }}</p><details>
          <summary>看例句，试着说一次</summary><div class="bite-example">
            <span>先看这句</span><p lang="en">
              {{ bite.before }}
            </p><span>试着这样展开或修正</span><p class="bite-after" lang="en">
              {{ bite.after }}
            </p>
          </div><p class="muted">
            {{ bite.explanation }}
          </p><div class="bite-drill">
            <b>短练习</b><p>{{ bite.drill }}</p>
          </div><ul class="bite-check">
            <li v-for="check in bite.check" :key="check">
              □ {{ check }}
            </li>
          </ul><RouterLink class="btn btn-secondary" :to="`/train?prompt=${bite.promptId}`">
            带着这点，去录音练习 ↗
          </RouterLink>
        </details>
      </article>
    </div><div class="studio-note">
      例句是原创学习示例，不是必须照背的答案。重音与停顿内容只提供练习方向；你的发音、节奏和清晰度需要通过原始录音及可靠反馈检验。
    </div>
  </div>
</template>
