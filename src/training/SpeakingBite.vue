<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { dailyBiteIndex, speakingBites } from './speaking-bites'
import { allSpeakingBites, dailyLessonMessage, generatedLessons } from './lessons'

const selectedId = ref('')
const bite = computed(() => allSpeakingBites.value.find(b => b.id === selectedId.value) || generatedLessons.value[0] || speakingBites[dailyBiteIndex()])
const index = computed(() => allSpeakingBites.value.findIndex(b => b.id === bite.value.id))
const practising = ref(false)
const reviewed = ref(false)
const remaining = ref(30)
const voiceError = ref('')
const supportsVoice = typeof window !== 'undefined' && 'speechSynthesis' in window
let endsAt = 0
const ticker = setInterval(() => {
  if (!practising.value)
    return
  remaining.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
  if (!remaining.value)
    finish()
}, 200)
function next() {
  if (supportsVoice)
    speechSynthesis.cancel()
  practising.value = false
  voiceError.value = ''
  reviewed.value = false
  remaining.value = 30
  selectedId.value = allSpeakingBites.value[(index.value + 1) % allSpeakingBites.value.length].id
}
function start() {
  selectedId.value = bite.value.id
  if (supportsVoice)
    speechSynthesis.cancel()
  reviewed.value = false
  practising.value = true
  remaining.value = 30
  endsAt = Date.now() + 30000
}
function finish() {
  practising.value = false
  reviewed.value = true
}
function listen() {
  if (!supportsVoice)
    return
  speechSynthesis.cancel()
  voiceError.value = ''
  const utterance = new SpeechSynthesisUtterance(bite.value.after.replace(/\//g, ','))
  const voices = speechSynthesis.getVoices()
  const voice = voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en'))
  if (voice)
    utterance.voice = voice
  utterance.lang = voice?.lang || 'en-GB'
  utterance.rate = 0.9
  utterance.onerror = (event) => {
    if (event.error !== 'canceled' && event.error !== 'interrupted')
      voiceError.value = '这台设备暂时无法播放示范朗读。可以先自己朗读例句，再进入录音练习。'
  }
  speechSynthesis.speak(utterance)
}
onBeforeUnmount(() => {
  clearInterval(ticker)
  if (supportsVoice)
    speechSynthesis.cancel()
})
</script>

<template>
  <section class="bite-panel" aria-label="口语小课堂">
    <div class="between">
      <span class="section-kicker">持续新增 · 口语小课堂</span><span class="muted">{{ index + 1 }} / {{ allSpeakingBites.length }}</span>
    </div>
    <p class="status-line">
      {{ bite.source === 'ai' ? `${bite.day} 新增 · AI 生成，练习参考` : '预置基础课' }}<br>{{ dailyLessonMessage }}
    </p>
    <span class="skill-badge speaking">{{ bite.category }}</span><h2>{{ bite.title }}</h2><p class="bite-point">
      {{ bite.point }}
    </p>
    <template v-if="!practising">
      <div class="bite-example">
        <span>先看这句</span><p lang="en">
          {{ bite.before }}
        </p><span>试着这样展开或修正</span><p class="bite-after" lang="en">
          {{ bite.after }}
        </p>
      </div><p class="muted">
        {{ bite.explanation }}
      </p>
    </template>
    <div v-else class="bite-challenge" role="status">
      <b>{{ remaining }} 秒</b><p>例句已遮住。用自己的经历回答，不照背示例。</p>
    </div>
    <div class="bite-drill">
      <b>轮到你说</b><p>{{ bite.drill }}</p>
    </div>
    <ul v-if="reviewed" class="bite-check" aria-label="口语自查">
      <li v-for="check in bite.check" :key="check">
        □ {{ check }}
      </li>
    </ul>
    <div class="toolbar">
      <button v-if="!practising" class="btn btn-primary" @click="start">
        遮住例句 · 练 30 秒
      </button><button v-else class="btn btn-primary" @click="finish">
        说完了 · 查看自查
      </button><button class="btn btn-secondary" :disabled="!supportsVoice || practising" @click="listen">
        听例句
      </button><button class="bite-next" @click="next">
        换一条 →
      </button>
    </div>
    <p class="status-line">
      <span v-if="voiceError" role="status">{{ voiceError }}<br></span>
      短练习只计时，不录音；朗读仅供参考。{{ practising ? '完成后再对照检查。' : '听懂不等于会用，换个情境再说一次。' }}
    </p>
    <div class="bite-links">
      <RouterLink :to="`/train?prompt=${bite.promptId}`">
        进入相关录音练习 ↗
      </RouterLink><RouterLink to="/speaking-notes">
        全部口语知识 →
      </RouterLink>
    </div>
  </section>
</template>
