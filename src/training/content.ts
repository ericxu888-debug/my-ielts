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
}
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
]
export const skillLabels: Record<Skill, string> = { speaking: '口语', writing: '写作', reading: '阅读' }
export const focusOptions: Record<Skill, string[]> = {
  speaking: ['直接回答并展开', '用具体例子支持观点', '减少停顿与自我重复', '词汇准确性', '语法准确性', '发音与重音'],
  writing: ['回应题目全部要求', '观点与论证', '段落衔接', '词汇准确性', '语法准确性', '概述与数据比较'],
  reading: ['原文定位', '同义替换', 'FALSE 与 NOT GIVEN', '题干范围与限定词', '字数与拼写'],
}
