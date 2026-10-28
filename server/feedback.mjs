// Ask the model to cite server-owned excerpts instead of reproducing quotations.
// The evidence displayed to the learner always comes from their original answer.
export function answerSources(text) {
  const parts = text.match(/[^.!?\n]+[.!?]*/gu) || [text]
  const excerpts = []
  for (const part of parts) {
    let rest = part.trim()
    while (rest.length > 600) {
      const space = rest.lastIndexOf(' ', 600)
      const end = space > 300 ? space : 600
      excerpts.push(rest.slice(0, end))
      rest = rest.slice(end).trim()
    }
    if (rest) excerpts.push(rest)
  }
  return excerpts.map((text, i) => ({ id: `S${i + 1}`, text }))
}

function normaliseQuote(value) {
  let text = value.normalize('NFKC').replace(/[‘’]/gu, "'").replace(/[“”]/gu, '"').replace(/\s+/gu, ' ').trim()
  // Strip a wrapper, not meaningful punctuation inside a learner's quotation.
  const pairs = [['"', '"'], ["'", "'"], ['`', '`'], ['「', '」'], ['『', '』']]
  for (const [start, end] of pairs) {
    if (text.startsWith(start) && text.endsWith(end) && text.length > 2) {
      text = text.slice(1, -1).trim()
      break
    }
  }
  return text
}

export function groundFeedback(value, sources) {
  const stringArray = items => Array.isArray(items) && items.every(v => typeof v === 'string')
  if (!value || typeof value !== 'object' || typeof value.summary !== 'string' || !stringArray(value.strengths) || !Array.isArray(value.priorities) || value.priorities.length > 3 || typeof value.exercise !== 'string' || typeof value.limitation !== 'string') {
    return { error: 'AI 反馈不完整，本次结果未保存。' }
  }
  if (!value.priorities.every(v => v && typeof v.issue === 'string' && typeof v.action === 'string' && (typeof v.evidenceId === 'string' || typeof v.evidence === 'string'))) {
    return { error: 'AI 反馈不完整，本次结果未保存。' }
  }
  const priorities = []
  for (const item of value.priorities) {
    const source = item.evidenceId
      ? sources.find(source => source.id === item.evidenceId.trim())
      : typeof item.evidence === 'string' && normaliseQuote(item.evidence)
        ? sources.find(source => normaliseQuote(source.text).includes(normaliseQuote(item.evidence)))
        : undefined
    if (source) priorities.push({ issue: item.issue, evidence: source.text, action: item.action })
  }
  if (value.priorities.length && !priorities.length) return { error: 'AI 引用未能与原始作答匹配，未保存这次反馈。你的作答仍然保留。请稍后重试或先自主复盘。' }
  const filtered = value.priorities.length - priorities.length
  return { feedback: {
    summary: value.summary,
    strengths: value.strengths,
    priorities,
    exercise: value.exercise,
    limitation: value.limitation,
    ...(filtered ? { warnings: [`有 ${filtered} 条建议的引用无法核实，已隐藏；以下仅展示可定位到原文的建议。`] } : {}),
  } }
}
