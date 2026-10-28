import { additionalPrompts } from './more-content'

export type Skill = 'speaking' | 'writing' | 'reading'
export interface ReadingQuestion {
  id: string
  text: string
  answer: string
  options?: string[]
  evidence: string
  explanation: string
}
export interface Prompt {
  id: string
  skill: Skill
  title: string
  section: string
  minutes: number
  instruction: string
  cues?: string[]
  passage?: string[]
  questions?: ReadingQuestion[]
  table?: string[][]
  tableCaption?: string
  process?: { title: string; stages: string[] }
  guide?: PracticeGuide
}
export interface PracticeGuide { focus: string; review: string[]; drill: string; check: string[]; transferId?: string }
// Original practice material, not official IELTS questions or a calibrated test.
export const prompts: Prompt[] = [
  { id: 's-place', skill: 'speaking', title: 'A place where you concentrate', section: 'Part 2', minutes: 3, instruction: 'Describe a place where you like to go to concentrate. Prepare for one minute, then speak for up to two minutes.', cues: ['Where the place is', 'What you do there', 'Why it helps you concentrate', 'Explain how you feel after spending time there'] },
  { id: 's-learning', skill: 'speaking', title: 'Learning something new', section: 'Part 1', minutes: 2, instruction: 'Answer each question naturally. Give a direct answer, then a reason or a specific example.', cues: ['What would you like to learn in the future?', 'Do you prefer learning alone or with other people?', 'Has technology changed the way you learn?'] },
  { id: 's-skill', skill: 'speaking', title: 'A skill you learned', section: 'Part 2', minutes: 3, instruction: 'Describe a useful skill you learned from another person. Prepare for one minute, then speak for up to two minutes.', cues: ['What the skill was', 'Who helped you learn it', 'How you practised', 'Explain why this skill is useful to you'] },
  { id: 's-cities', skill: 'speaking', title: 'Cities and public spaces', section: 'Part 3', minutes: 4, instruction: 'Develop each answer with a reason, an example and, where useful, a qualification. Avoid memorised speeches.', cues: ['Why do some cities invest in public libraries?', 'Should public spaces prioritise young people or older people?', 'How might public spaces change in the future?'] },
  { id: 'w-study', skill: 'writing', title: 'University: knowledge or employment?', section: 'Task 2', minutes: 40, instruction: 'Some people believe that the main purpose of university education is to prepare students for employment. Others believe that universities should develop knowledge for its own sake. Discuss both views and give your own opinion. Write at least 250 words.' },
  { id: 'w-transport', skill: 'writing', title: 'Investment in public transport', section: 'Task 2', minutes: 40, instruction: 'Governments should spend more money improving public transport than building new roads. To what extent do you agree or disagree? Write at least 250 words.' },
  { id: 'w-library', skill: 'writing', title: 'Changes in library use', section: 'Task 1', minutes: 20, instruction: 'The table shows the percentage of residents in three age groups who used a public library in a city in 2010 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words. Figures are invented for this practice task.', table: [['Age group', '2010', '2025'], ['18–29', '42%', '58%'], ['30–59', '51%', '46%'], ['60 and over', '35%', '55%']] },
  {
    id: 'r-retrieval',
    skill: 'reading',
    title: 'Why recalling can outperform rereading',
    section: '学术阅读 · 短篇训练',
    minutes: 10,
    instruction: 'Read the passage and answer all six questions. For questions 1–4, choose TRUE if the statement agrees with the passage, FALSE if it contradicts the passage, or NOT GIVEN if there is not enough information. For questions 5–6, write ONE WORD from the passage.',
    passage: [
      'A. Students often judge learning by how familiar a page looks. After several readings, sentences become easy to recognise. This fluency can create confidence, but recognising information with the page open is different from recalling it after the page has been closed.',
      'B. Retrieval practice asks learners to produce information from memory. A learner might close a book and explain a concept, or answer questions without consulting notes. In several classroom studies, learners who practised retrieval remembered more on a delayed test than learners who spent the same amount of time rereading. This does not mean that rereading is always useless: it can help a learner understand an unfamiliar explanation initially.',
      'C. Timing also matters. Spacing practice across several days often supports longer retention than concentrating the same practice into one session. The best interval is not a universal number; it depends in part on how long the information needs to be remembered. A longer gap can make retrieval harder, so difficulty during practice is not necessarily evidence that learning has failed.',
      'D. Feedback gives learners a chance to correct an inaccurate answer before repeating it. However, simply viewing the correct answer is not the same as understanding an error. Learners can compare their reasoning with the evidence, identify a mistaken assumption and attempt a related question later. These methods support learning, but they do not guarantee a particular examination score.',
    ],
    questions: [
      { id: '1', text: 'Recognising a sentence and recalling it without the text are the same process.', answer: 'FALSE', options: ['TRUE', 'FALSE', 'NOT GIVEN'], evidence: 'A: recognising information with the page open is different from recalling it', explanation: '题干的 same 与原文 different 明确相反，因此选 FALSE，而不是 NOT GIVEN。' },
      { id: '2', text: 'In some classroom studies, retrieval led to better delayed-test results than equal time spent rereading.', answer: 'TRUE', options: ['TRUE', 'FALSE', 'NOT GIVEN'], evidence: 'B: remembered more on a delayed test … the same amount of time rereading', explanation: 'some 对应 several；better results 对应 remembered more，且时间投入相同。' },
      { id: '3', text: 'The learners in the studies were all university students.', answer: 'NOT GIVEN', options: ['TRUE', 'FALSE', 'NOT GIVEN'], evidence: 'B: In several classroom studies', explanation: '原文未说明学习者的教育阶段。不能从 classroom 推断都是大学生。' },
      { id: '4', text: 'There is one ideal spacing interval for every learning goal.', answer: 'FALSE', options: ['TRUE', 'FALSE', 'NOT GIVEN'], evidence: 'C: The best interval is not a universal number', explanation: 'every 与 not a universal number 冲突；间隔还取决于希望记忆多久。' },
      { id: '5', text: 'Learners can compare their reasoning with the ______ to understand an error.', answer: 'evidence', evidence: 'D: compare their reasoning with the evidence', explanation: '定位 compare their reasoning，取其后的原文名词 evidence，遵守 ONE WORD。' },
      { id: '6', text: 'Spreading practice across days can improve long-term ______.', answer: 'retention', evidence: 'C: Spacing practice across several days often supports longer retention', explanation: 'spreading practice 对应 spacing practice；long-term 对应 longer。填原文 retention。' },
    ],
  },
  ...additionalPrompts,
]
export const skillLabels: Record<Skill, string> = { speaking: '口语', writing: '写作', reading: '阅读' }
export const focusOptions: Record<Skill, string[]> = {
  speaking: ['直接回答并展开', '用具体例子支持观点', '减少停顿与自我重复', '词汇准确性', '语法准确性', '发音与重音'],
  writing: ['回应题目全部要求', '观点与论证', '段落衔接', '词汇准确性', '语法准确性', '概述与数据比较'],
  reading: ['原文定位', '同义替换', 'FALSE 与 NOT GIVEN', '题干范围与限定词', '字数与拼写'],
}

export function practiceGuideFor(prompt: Prompt): PracticeGuide {
  if (prompt.guide)
    return prompt.guide
  if (prompt.skill === 'reading')
    return { focus: '用原文证据区分反对信息与未提及信息', review: ['每题在原文找到哪一句？用自己的话说明它如何支持答案。', '选 FALSE 时，原文是否有明确反证？是否把自己的常识当成了原文信息？', '填空是否使用原文单词，并遵守题目字数限制？'], drill: '选一道错题，遮住解析，重新圈出题干限定词，再写“原文证据 → 判断”的一句解释。', check: ['能定位证据，而不是只记得选项', '能说清干扰判断错在哪里'], transferId: 'r-shade' }

  if (prompt.skill === 'writing' && prompt.section === 'Task 1')
    return { focus: '先概述主要特征，再用数据或流程细节支持', review: ['概述有没有抓住最明显的变化、差异或主要阶段？', '有没有按趋势或类别分组，而不是逐格罗列？', '单位、时态和比较对象是否准确？有没有加入图中没有的原因？'], drill: '先不看旧稿，用两句写出概述，再选两组最有代表性的信息支持它。', check: ['概述不依赖逐项报数', '具体描述能在题目中核实'], transferId: 'w-energy' }

  if (prompt.skill === 'writing')
    return { focus: '让观点、原因和例子形成完整论证', review: ['题目要求的部分是否都回应了？自己的立场是否明确且前后一致？', '每段的例子如何证明中心句？有没有跳过关键因果步骤？', '选一句不自然的表达，先定位问题，再自己改写并解释修改理由。'], drill: '选一段薄弱主体段，按“中心句 → 为什么 → 具体情境 → 回扣观点”重写；不要先看范文。', check: ['能解释例子与观点之间的关系', '新段落解决了原来的具体问题'], transferId: prompt.id === 'w-transport' ? 'w-health' : 'w-transport' }

  if (prompt.section === 'Part 1')
    return { focus: '直接作答，再自然补充理由或细节', review: ['开头是否直接回答了问题？', '例子是否具体，还是只重复 important、interesting、good？', '回放时标记一处影响理解的停顿或语法问题，文本反馈不能代替听音。'], drill: '选一个问题重新回答 20–30 秒，加入一个真实细节。第三次换一种表达，不背第二遍的句子。', check: ['回答切题且有支持信息', '重答时能自主表达，而不是背稿'], transferId: prompt.id === 's-hometown' ? 's-routine' : 's-hometown' }

  if (prompt.section === 'Part 3')
    return { focus: '从个人经历转向解释、比较与适度概括', review: ['有没有解释为什么，而不是只有立场？', '有没有考虑适用条件、不同人群或反例，避免 always、everyone 之类的绝对判断？', '例子是否支持一般观点，而不是把个人经历当作唯一证据？'], drill: '用“观点 → 原因 → 例子 → 适用条件”回答一道问题，再用不同例子重答。', check: ['观点和理由能连起来', '能够回应追问或不同看法'], transferId: prompt.id === 's-technology' ? 's-environment' : 's-technology' }

  return { focus: '把一个具体经历讲清楚，补足细节与感受', review: ['是否交代了人物、时间、情境和具体经过？', '有没有解释经历为什么对自己有意义？', '回放时记录一处重复表达或明显停顿，并判断是否影响听懂。'], drill: '保留 5 个关键词，遮住转写再讲一次；随后换一个经历使用相同组织方法。', check: ['能围绕题目持续展开', '第二遍有新的细节，而不是只重复第一遍'], transferId: 's-decision' }
}
