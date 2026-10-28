<script setup lang="ts">
import { ref } from 'vue'
import { api, attempts, checkConnection, connected, exportBackup, importBackup, sync, syncMessage } from '../training/storage'

const password = ref('')
const busy = ref(false)
const error = ref('')
const message = ref('')
const ai = ref(false)
checkConnection().then((s) => {
  ai.value = s.ai
})
async function login() {
  busy.value = true
  error.value = ''
  try {
    await api('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: password.value }) })
    password.value = ''
    const status = await checkConnection()
    ai.value = status.ai
    message.value = '已连接私人服务。另一台设备打开同一个网站并登录，即可同步记录。'
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    busy.value = false
  }
}
async function logout() {
  try {
    await api('/logout', { method: 'POST' })
    connected.value = false
    syncMessage.value = '已断开同步 · 本机副本保留'
    ai.value = false
    message.value = '已退出。此浏览器仍保留本机练习副本，请勿在共用设备上留下私人记录。'
  }
  catch (e) {
    error.value = (e as Error).message
  }
}
async function restore(event: Event) {
  error.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  if (file.size > 10 * 1024 * 1024) {
    error.value = '备份超过 10 MB，请检查文件。'
    return
  }
  try {
    const count = importBackup(JSON.parse(await file.text()))
    message.value = `导入 ${count} 条新记录；同 ID 的现有记录未覆盖。录音需要单独保留。`
    sync()
  }
  catch (e) {
    error.value = (e as Error).message
  }
  input.value = ''
}
</script>

<template>
  <div class="studio-page">
    <div class="page-eyebrow">
      YOUR DATA, YOUR SPACE <span>04 / 同步与设置</span>
    </div><h1 class="page-title">
      在手机开始，在电脑继续。
    </h1><p class="page-intro">
      连接同一个私人服务，练习记录和录音才能跨设备同步。本机自动保存与云端同步是两件事。
    </p><div v-if="error" class="studio-alert" role="alert">
      {{ error }}
    </div><div v-if="message" class="studio-success" role="status">
      {{ message }}
    </div>
    <div class="settings-grid">
      <section class="panel">
        <span class="section-kicker">PRIVATE SYNC</span><h2>{{ connected ? '已连接私人同步服务' : '连接私人同步服务' }}</h2><p class="muted">
          {{ syncMessage }}
        </p><form v-if="!connected" @submit.prevent="login">
          <label class="field-label" for="password">私人访问口令</label><input id="password" v-model="password" class="studio-input" type="password" autocomplete="current-password" required placeholder="部署时设置的私人口令"><button class="btn btn-primary" :disabled="busy" style="margin-top:18px">
            {{ busy ? '连接中…' : '登录并同步' }}
          </button>
        </form><div v-else class="toolbar">
          <button class="btn btn-primary" @click="sync">
            立即同步
          </button><button class="btn btn-subtle" @click="logout">
            退出连接
          </button>
        </div><div class="studio-note">
          离线或连接失败时先保留本机副本，网络恢复后重试。同一条记录发生双端修改时分别保留，不静默覆盖。录音需上传完成后才能在另一台设备播放。
        </div><p class="muted">
          尚未部署服务时，当前页面可以本机练习，但无法跨设备同步。正式使用需要 HTTPS，手机录音也依赖它。
        </p>
      </section>
      <section class="panel">
        <span class="section-kicker">AI COACH</span><h2>{{ ai ? 'AI 已配置' : 'AI 尚未开通' }}</h2><p>AI 用于录音转写和基于原句的练习反馈。只有你点击“转写”或“分析”时才调用。</p><p class="muted">
          启用后会将所选音频或作答文本发送到 AI 服务商，按实际调用计费。本网站不显示虚构分数，也不凭转写文本评价发音。
        </p><div class="studio-note">
          {{ ai ? '服务端已配置密钥；实际可用性取决于服务商额度和模型权限。' : '网站的练习、自主复盘和间隔复习无需 AI。开通 API 账户、配置额度及服务端密钥后，再启用自动反馈。' }}
        </div><p class="muted">
          AI 密钥由服务器保管，请勿填写到前端页面或聊天中。
        </p>
      </section>
      <section class="panel">
        <span class="section-kicker">BACKUP & RESTORE</span><h2>把学习记录握在自己手里</h2><p>当前设备有 {{ attempts.length }} 条记录。导出包含作答、反馈和复习安排；录音请在各练习内单独下载。</p><div class="toolbar">
          <button class="btn btn-secondary" @click="exportBackup">
            导出文字记录 JSON
          </button>
        </div><label class="field-label" for="restore">导入备份（合并，不覆盖现有记录）</label><input id="restore" class="studio-input" type="file" accept="application/json,.json" @change="restore"><p class="muted">
          清除浏览器数据可能删除尚未上传的草稿和录音。定期同步并保留独立备份。
        </p>
      </section>
      <section class="panel">
        <span class="section-kicker">LEARNING DESIGN</span><h2>练习方法，而非提分承诺</h2><p>本网站结合主动回忆、证据反馈、同题重练与间隔复习。完成复盘后按自评安排复习：还不会从 1 天开始、有困难从 2 天开始、能独立完成从 3 天开始并逐步拉长。</p><p class="muted">
          具体间隔是一项可调整的启发式规则，没有经过个人学习效果校准。题库为原创训练素材，非官方真题；阅读小练习不换算 Band 分数。
        </p>
      </section>
    </div>
  </div>
</template>
