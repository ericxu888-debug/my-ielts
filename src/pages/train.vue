<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { focusOptions, prompts, skillLabels } from '../training/content'
import type { Skill } from '../training/content'
import { createAttempt, normaliseAnswer, scheduleReview, wordCount } from '../training/model'
import type { Attempt } from '../training/model'
import { api, attempts, checkConnection, connected, downloadBlob, getAudio, putAudio, saveAttempt, sync } from '../training/storage'

const route = useRoute()
const router = useRouter()
const current = ref<Attempt>()
const prompt = computed(() => prompts.find(p => p.id === current.value?.promptId) || prompts[0])
const selectedSkill = computed(() => prompt.value.skill)
const available = computed(() => prompts.filter(p => p.skill === selectedSkill.value))
const submitted = computed(() => current.value?.status !== 'draft')
const parent = computed(() => attempts.value.find(a => a.id === current.value?.parentId))
const running = ref(false)
const error = ref('')
const notice = ref('')
const busy = ref('')
const aiReady = ref(false)
const recording = ref(false)
const processingAudio = ref(false)
const audioUrl = ref('')
let recorder: MediaRecorder | undefined
let stream: MediaStream | undefined
let startedAt = 0
let baseElapsed = 0
let recordingStartedAt = 0
let audioLoad = 0
let lastTick = 0
function persist() {
  if (current.value) {
    const stored = attempts.value.find(a => a.id === current.value!.id)
    if (stored?.updatedAt === current.value.updatedAt)
      current.value.revision = stored.revision
    saveAttempt(current.value)
  }
}
function answerEdited() {
  if (current.value)
    current.value.feedback = undefined
  persist()
}
function protectRecording(event: BeforeUnloadEvent) {
  if (recording.value || processingAudio.value || busy.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
window.addEventListener('beforeunload', protectRecording)
function stopTimer() {
  if (!running.value)
    return
  if (running.value && current.value)
    current.value.elapsed = baseElapsed + Math.floor((Date.now() - startedAt) / 1000)
  running.value = false
  persist()
}
function toggleTimer() {
  if (running.value) {
    stopTimer()
  }
  else {
    baseElapsed = current.value?.elapsed || 0
    startedAt = Date.now()
    running.value = true
  }
}
const ticker = setInterval(() => {
  if (running.value && current.value) {
    current.value.elapsed = baseElapsed + Math.floor((Date.now() - startedAt) / 1000)
    if (++lastTick % 10 === 0)
      persist()
  }
  if (recording.value && Date.now() - recordingStartedAt >= 10 * 60000) {
    stopRecording()
    notice.value = '已达到 10 分钟录音上限，录音正在保存。'
  }
}, 1000)
function acknowledgeSync(event: Event) {
  const { id, revision } = (event as CustomEvent).detail
  if (current.value && current.value.id === id)
    current.value.revision = revision
}
function preserveConflict(event: Event) {
  const { id, copy } = (event as CustomEvent).detail
  if (!current.value || current.value.id !== id)
    return
  const elapsed = running.value ? baseElapsed + Math.floor((Date.now() - startedAt) / 1000) : copy.elapsed
  running.value = false
  current.value = JSON.parse(JSON.stringify(copy))
  if (current.value) {
    current.value.elapsed = elapsed
    persist()
  }
  router.replace({ path: '/train', query: { id: copy.id } })
}
window.addEventListener('ielts-record-synced', acknowledgeSync)
window.addEventListener('ielts-record-conflict', preserveConflict)
const timerLabel = computed(() => {
  const elapsed = current.value?.elapsed || 0
  const seconds = Math.abs(prompt.value.minutes * 60 - elapsed)
  return `${elapsed > prompt.value.minutes * 60 ? '+' : ''}${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
const correctCount = computed(() => prompt.value.questions?.filter(q => normaliseAnswer(current.value?.answers[q.id] || '') === normaliseAnswer(q.answer)).length || 0)
async function loadAudio(a: Attempt) {
  const generation = ++audioLoad
  if (audioUrl.value)
    URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
  if (!a.hasAudio)
    return
  try {
    let blob = await getAudio(a.id)
    if (!blob && a.audioKey && connected.value) {
      blob = await (await api(`/audio/${a.audioKey}`)).blob()
      await putAudio(a.id, blob)
    }
    if (generation === audioLoad && blob)
      audioUrl.value = URL.createObjectURL(blob)
    else if (!blob && generation === audioLoad)
      notice.value = '当前设备没有这份录音，请连接同步服务后重新打开练习。'
  }
  catch {
    if (generation === audioLoad)
      error.value = '录音暂时无法读取，文字记录仍然保留。'
  }
}
watch(() => route.query, async (query) => {
  if (recording.value || processingAudio.value)
    return
  if (current.value)
    stopTimer()
  error.value = ''
  notice.value = ''
  let a = attempts.value.find(a => a.id === query.id)
  if (!a) {
    const p = prompts.find(p => p.id === query.prompt) || prompts.find(p => p.skill === query.skill) || prompts[0]
    a = attempts.value.find(a => a.promptId === p.id && a.status === 'draft') || createAttempt(p.id, p.skill)
    if (!saveAttempt(a)) {
      current.value = JSON.parse(JSON.stringify(a))
      error.value = '本机存储不可用。请先修复存储权限，不要关闭尚未备份的作答。'
      return
    }
    await router.replace({ path: '/train', query: { id: a.id } })
    return
  }
  current.value = JSON.parse(JSON.stringify(a))
  await loadAudio(current.value!)
}, { immediate: true })
checkConnection().then((status) => {
  aiReady.value = status.ai
})
watch(connected, async (value) => {
  if (value) {
    aiReady.value = (await checkConnection()).ai
    if (current.value?.hasAudio && !audioUrl.value)
      await loadAudio(current.value)
  }
  else {
    aiReady.value = false
  }
})
function selectSkill(skill: Skill) {
  if (!recording.value && !processingAudio.value)
    router.push({ path: '/train', query: { skill } })
}
function selectPrompt(event: Event) {
  router.push({ path: '/train', query: { prompt: (event.target as HTMLSelectElement).value } })
}
function submit() {
  if (!current.value || recording.value || processingAudio.value)
    return
  if (selectedSkill.value === 'reading' && prompt.value.questions?.some(q => !current.value!.answers[q.id]?.trim())) {
    error.value = '请先回答所有题目，再查看答案与解析。'
    return
  }
  if (selectedSkill.value !== 'reading' && !current.value.text.trim() && !current.value.hasAudio) {
    error.value = '请先完成作答：输入答案或录制一段口语。'
    return
  }
  stopTimer()
  current.value.status = 'review'
  current.value.reviewAt = new Date().toISOString()
  persist()
  sync()
  error.value = ''
  notice.value = '已提交。现在用具体证据复盘，然后选择一个改进点。'
}
function finish(result: 'again' | 'hard' | 'good') {
  if (current.value?.status === 'complete')
    return
  if (!current.value?.focus || !current.value.reflection.trim()) {
    error.value = '先选择一个改进点，并写下具体问题或下次行动，再安排复习。'
    return
  }
  current.value = scheduleReview(current.value, result)
  persist()
  sync()
  error.value = ''
  notice.value = `复盘已保存，${current.value.interval} 天后再次检验。你也可以现在重练。`
}
function retry() {
  if (!current.value)
    return
  const a = createAttempt(prompt.value.id, prompt.value.skill, current.value.id)
  a.focus = current.value.focus
  a.interval = current.value.interval
  a.reviews = current.value.reviews
  saveAttempt(a)
  router.push({ path: '/train', query: { id: a.id } })
}
async function startRecording() {
  error.value = ''
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    error.value = '此浏览器无法录音。请用 HTTPS 网站上的新版 Safari 或 Chrome，或输入练习转写。'
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type))
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    const chunks: Blob[] = []
    let bytes = 0
    recorder.ondataavailable = (e) => {
      if (e.data.size) {
        chunks.push(e.data)
        bytes += e.data.size
      }
      if (bytes > 24 * 1024 * 1024 && recorder?.state === 'recording')
        stopRecording()
    }
    recorder.onerror = () => {
      error.value = '录音中断，请检查已保存的音频。'
      stopRecording()
    }
    recorder.onstop = async () => {
      const attemptId = current.value!.id
      const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' })
      stream?.getTracks().forEach(track => track.stop())
      recording.value = false
      processingAudio.value = true
      try {
        if (!blob.size)
          throw new Error('录音为空，请重试。')
        await putAudio(attemptId, blob)
        if (current.value?.id === attemptId) {
          current.value.hasAudio = true
          current.value.audioMime = blob.type
          current.value.audioKey = undefined
          persist()
          await loadAudio(current.value)
          notice.value = '录音已保存到本机。连接服务后会自动上传。'
          sync()
        }
      }
      catch (e) {
        error.value = `录音未保存：${(e as Error).message}。已尝试下载录音，请检查下载文件。`
        downloadBlob(blob, 'ielts-recording-backup.webm')
      }
      finally {
        processingAudio.value = false
      }
    }
    recorder.start(1000)
    recording.value = true
    recordingStartedAt = Date.now()
    if (!running.value)
      toggleTimer()
  }
  catch {
    stream?.getTracks().forEach(track => track.stop())
    error.value = '无法使用麦克风，请检查浏览器权限。你也可以先输入口语转写进行练习。'
  }
}
function stopRecording() {
  if (recorder?.state === 'recording') {
    processingAudio.value = true
    recorder.stop()
    stopTimer()
  }
}
async function downloadRecording() {
  if (!current.value)
    return
  const blob = await getAudio(current.value.id)
  if (blob)
    downloadBlob(blob, `ielts-${current.value.id}.${blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'}`)
}
async function runAI(kind: 'feedback' | 'transcribe') {
  if (!current.value || busy.value)
    return
  error.value = ''
  busy.value = kind
  const id = current.value.id
  try {
    if (kind === 'transcribe') {
      const blob = await getAudio(id)
      if (!blob)
        throw new Error('请先保存或同步录音。')
      const result = await (await api('/transcribe', { method: 'POST', body: blob })).json()
      if (current.value?.id === id) {
        current.value.text = result.text
        persist()
      }
    }
    else {
      if (current.value.text.trim().length < 20)
        throw new Error('请先输入或转写至少 20 个字符的回答。')
      const feedback = await (await api('/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: selectedSkill.value, prompt: `${prompt.value.instruction}\n${JSON.stringify(prompt.value.cues || prompt.value.table || [])}`, text: current.value.text }) })).json()
      if (current.value?.id === id) {
        current.value.feedback = feedback
        persist()
      }
    }
    sync()
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    busy.value = ''
  }
}
onBeforeRouteLeave(() => {
  if (recording.value || processingAudio.value || busy.value) {
    error.value = '请先停止录音并等待保存或分析完成，再离开练习。'
    return false
  }
  stopTimer()
})
onBeforeRouteUpdate(() => {
  if (recording.value || processingAudio.value || busy.value) {
    error.value = '请先完成录音保存或分析，再切换练习。'
    return false
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', protectRecording)
  window.removeEventListener('ielts-record-synced', acknowledgeSync)
  window.removeEventListener('ielts-record-conflict', preserveConflict)
  clearInterval(ticker)
  stopTimer()
  stream?.getTracks().forEach(t => t.stop())
  if (audioUrl.value)
    URL.revokeObjectURL(audioUrl.value)
})
</script>

<template>
  <div class="studio-page">
    <div class="page-eyebrow">
      PRACTICE WITH INTENTION <span>02 / 练习工作台</span>
    </div>
    <h1 class="page-title">
      把一个薄弱点，练扎实。
    </h1><p class="page-intro">
      先独立作答，再看反馈。每次只选一个最值得改进的问题。
    </p>
    <div class="studio-tabs" role="group" aria-label="练习科目">
      <button v-for="(label, skill) in skillLabels" :key="skill" :class="{ selected: selectedSkill === skill }" :disabled="recording || processingAudio || !!busy" @click="selectSkill(skill)">
        {{ label }}
      </button>
    </div>
    <div v-if="error" role="alert" class="studio-alert">
      {{ error }}
    </div><div v-if="notice" role="status" class="studio-success">
      {{ notice }}
    </div>
    <div v-if="current" class="workspace">
      <section class="panel">
        <label for="prompt-choice" class="field-label">选择训练题</label><select id="prompt-choice" class="studio-input" :value="prompt.id" :disabled="recording || processingAudio || !!busy" @change="selectPrompt">
          <option v-for="p in available" :key="p.id" :value="p.id">
            {{ p.section }} · {{ p.title }}
          </option>
        </select>
        <div class="workspace-heading">
          <div><span :class="`skill-badge ${selectedSkill}`" style="margin-top:20px">{{ prompt.section }}</span><h2>{{ prompt.title }}</h2></div>
        </div>
        <div class="instruction">
          {{ prompt.instruction }}
        </div>
        <ul v-if="prompt.cues" class="cue-list">
          <li v-for="cue in prompt.cues" :key="cue">
            {{ cue }}
          </li>
        </ul>
        <table v-if="prompt.table" class="data-table">
          <caption class="muted">
            Public library use by age group
          </caption><tbody>
            <tr v-for="(row, i) in prompt.table" :key="i">
              <td v-for="(cell, j) in row" :key="j">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="prompt.passage" class="reading-passage" style="margin-top:24px">
          <p v-for="paragraph in prompt.passage" :key="paragraph">
            {{ paragraph }}
          </p>
        </div>
        <div class="studio-note">
          {{ selectedSkill === 'reading' ? '这是一篇原创短篇训练，不能换算雅思阅读分数，也不替代完整模考。' : selectedSkill === 'speaking' ? 'Part 2 包含 1 分钟准备与最多 2 分钟回答。录音只在点击后开始，最长 10 分钟。' : '先明确立场和段落作用，再写正文。Task 1 注意概述，Task 2 注意论证。' }}
        </div>
        <div v-if="parent" class="studio-note">
          本次是同题重练。上次改进点：<strong>{{ parent.focus || '尚未记录' }}</strong>。先不看旧答案，试着完成新的作答。
        </div>
      </section>
      <div>
        <section class="panel">
          <div class="timer-row">
            <div><span class="section-kicker">{{ submitted ? '本次用时' : '练习计时' }}</span><span class="timer" :class="[{ overtime: current.elapsed > prompt.minutes * 60 }]">{{ submitted ? `${Math.floor(current.elapsed / 60)} 分 ${current.elapsed % 60} 秒` : timerLabel }}</span></div><button v-if="!submitted" class="btn btn-subtle" :disabled="recording || processingAudio" @click="toggleTimer">
              {{ running ? '暂停计时' : current.elapsed ? '继续计时' : '开始计时' }}
            </button>
          </div>
          <p v-if="selectedSkill === 'speaking' && prompt.section === 'Part 2' && !submitted" class="status-line">
            {{ current.elapsed < 60 ? '准备阶段：记关键词，不写完整稿。准备完成后开始录音。' : '回答阶段：自然展开，尽量持续表达。' }}
          </p>
          <template v-if="selectedSkill === 'speaking'">
            <div v-if="!submitted" class="recording-strip">
              <button v-if="!recording" class="btn btn-primary" :disabled="processingAudio || !!busy || !!current.hasAudio" @click="startRecording">
                开始录音
              </button><button v-else class="btn btn-danger" @click="stopRecording">
                停止并保存录音
              </button><span v-if="recording" class="recording-light">正在录音</span><span v-if="processingAudio" class="muted">正在保存录音…</span>
            </div>
            <p v-if="current.hasAudio && !submitted" class="muted">
              本次录音已保留。提交复盘后可创建同题重练，保留两次表现。
            </p>
            <audio v-if="audioUrl" :src="audioUrl" controls class="audio-player" />
            <div v-if="current.hasAudio" class="toolbar">
              <button class="btn btn-subtle" @click="downloadRecording">
                下载录音
              </button><button class="btn btn-secondary" :disabled="!aiReady || !!busy || recording || !!current.text.trim()" @click="runAI('transcribe')">
                {{ busy === 'transcribe' ? '转写中…' : 'AI 转写 · 按次调用' }}
              </button>
            </div>
          </template>
          <template v-if="selectedSkill !== 'reading'">
            <label for="answer" class="field-label">{{ selectedSkill === 'speaking' ? '回答转写 / 手动输入' : '你的英文作答' }}</label><textarea id="answer" v-model="current.text" class="studio-input answer-text" :readonly="submitted && selectedSkill === 'writing'" :disabled="!!busy" :placeholder="selectedSkill === 'speaking' ? '先录音，再转写或手动整理。不要在第一次回答前写完整稿。' : 'Write your answer here…'" @input="answerEdited" />
            <div class="status-line between">
              <span>{{ wordCount(current.text) }} words</span><span>{{ current.status === 'draft' ? '草稿 · 自动保存到本机' : '已提交 · 原始作答保留' }}</span>
            </div>
            <p v-if="selectedSkill === 'writing' && wordCount(current.text) < (prompt.section === 'Task 1' ? 150 : 250)" class="muted">
              正式考试建议至少 {{ prompt.section === 'Task 1' ? 150 : 250 }} 词；本次也可以作为片段训练提交。
            </p>
          </template>
          <template v-else>
            <div v-for="q in prompt.questions" :key="q.id" class="question">
              <label :for="`q-${q.id}`">{{ q.id }}. {{ q.text }}</label><select v-if="q.options" :id="`q-${q.id}`" v-model="current.answers[q.id]" class="studio-input" :disabled="submitted" @change="persist">
                <option value="" disabled>
                  请选择
                </option><option v-for="option in q.options" :key="option">
                  {{ option }}
                </option>
              </select><input v-else :id="`q-${q.id}`" v-model="current.answers[q.id]" class="studio-input" :disabled="submitted" placeholder="ONE WORD" @input="persist"><div v-if="submitted" class="evidence">
                <span :class="normaliseAnswer(current.answers[q.id] || '') === normaliseAnswer(q.answer) ? 'result-correct' : 'result-wrong'">{{ normaliseAnswer(current.answers[q.id] || '') === normaliseAnswer(q.answer) ? '✓ 正确' : `需要复盘 · 答案 ${q.answer}` }}</span><blockquote>{{ q.evidence }}</blockquote><p>{{ q.explanation }}</p>
              </div>
            </div><div v-if="submitted" class="studio-note">
              本次答对 {{ correctCount }} / {{ prompt.questions?.length }}。先解释错误原因，再决定复习间隔。
            </div>
          </template>
          <button v-if="!submitted" class="btn btn-primary" style="margin-top:20px" :disabled="recording || processingAudio || !!busy" @click="submit">
            提交并进入复盘 →
          </button>
        </section>
        <section v-if="submitted" class="panel">
          <span class="section-kicker">REFLECT → REVISE → RETRIEVE</span><h2>让下一遍，和这一遍不同</h2>
          <div class="review-step">
            <b>01</b><p>回放录音 / 检查作答，找出具体证据。不要只写“词汇不好”。</p>
          </div>
          <div v-if="selectedSkill !== 'reading'" class="studio-note">
            {{ aiReady ? 'AI 分析会把作答文本发送给服务商并产生费用；点击后才调用。' : 'AI 尚未开通，可以先自主复盘。到“同步与设置”查看服务状态。' }} 口语文本反馈不评价发音或真实流利度，也不提供正式分数。
          </div>
          <button v-if="selectedSkill !== 'reading'" class="btn btn-secondary" :disabled="!aiReady || !!busy" @click="runAI('feedback')">
            {{ busy === 'feedback' ? '正在分析…' : current.feedback ? '重新分析 · 再次调用' : 'AI 分析作答 · 按次调用' }}
          </button>
          <div v-if="current.feedback">
            <h3>反馈摘要</h3><p>{{ current.feedback.summary }}</p><ul class="feedback-list">
              <li v-for="s in current.feedback.strengths" :key="s">
                {{ s }}
              </li>
            </ul><div v-for="(item, i) in current.feedback.priorities" :key="i">
              <h3>{{ i + 1 }}. {{ item.issue }}</h3><blockquote class="feedback-quote">
                {{ item.evidence }}
              </blockquote><p>{{ item.action }}</p>
            </div><div class="studio-note">
              重练建议：{{ current.feedback.exercise }}
            </div><p class="muted">
              {{ current.feedback.limitation }}
            </p>
          </div>
          <label for="focus" class="field-label">02 · 这次只聚焦一个改进点</label><select id="focus" v-model="current.focus" class="studio-input" @change="persist">
            <option value="">
              请选择一个目标
            </option><option v-for="option in focusOptions[selectedSkill]" :key="option">
              {{ option }}
            </option>
          </select>
          <label for="reflection" class="field-label">证据、原因与下一次的具体行动</label><textarea id="reflection" v-model="current.reflection" class="studio-input" rows="4" placeholder="例如：第 3 题把“没有提及”误判成 FALSE。下次先找明确反证，没有证据就不推断。" @input="persist" />
          <h3>03 · 不看答案，能再做对吗？</h3><p class="muted">
            按实际掌握情况安排复习。间隔是可调整的启发式策略，不保证提分。
          </p><div class="toolbar">
            <button class="btn btn-subtle" :disabled="current.status === 'complete'" @click="finish('again')">
              还不会 · 明天复习
            </button><button class="btn btn-subtle" :disabled="current.status === 'complete'" @click="finish('hard')">
              有点困难 · 稍后检验
            </button><button class="btn btn-primary" :disabled="current.status === 'complete'" @click="finish('good')">
              能独立完成 · 拉开间隔
            </button>
          </div><p v-if="current.status === 'complete'" class="status-line">
            下次复习：{{ current.reviewAt ? new Date(current.reviewAt).toLocaleDateString('zh-CN') : '待安排' }}
          </p><button class="btn btn-secondary" @click="retry">
            带着改进点，同题重练 ↗
          </button>
          <details v-if="parent" class="comparison">
            <summary>查看上一次作答与复盘（建议新作答完成后再打开）</summary><p>{{ parent.reflection }}</p><pre>{{ parent.text || '上次为阅读或录音练习，可在复盘记录中打开原记录。' }}</pre>
          </details>
        </section>
      </div>
    </div>
  </div>
</template>
