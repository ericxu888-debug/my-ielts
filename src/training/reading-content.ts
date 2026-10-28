import type { Prompt } from './content'

const tfng = ['TRUE', 'FALSE', 'NOT GIVEN']

export const readingPrompts: Prompt[] = [
  {
    id: 'r-shade',
    skill: 'reading',
    title: 'Trees, shade and urban heat',
    section: '学术阅读 · 环境与城市',
    minutes: 12,
    instruction: 'Read the passage and answer six questions. For questions 1–3, choose TRUE, FALSE or NOT GIVEN. For questions 4–5, write ONE WORD from the passage. For question 6, choose the paragraph containing the information. This is an original short practice passage, not a full IELTS test.',
    passage: [
      'A. On a hot day, people often move from a sunny pavement to the shade of a tree. Shade reduces the amount of sunlight reaching the ground, but trees can affect their surroundings in another way as well. Water released through leaves can absorb heat as it evaporates. The size of these effects depends on conditions such as water availability, the species planted and the arrangement of nearby buildings.',
      'B. Comparing temperatures is less straightforward than it may appear. A thermometer placed in direct sunlight can become warmer than the air around it. Researchers therefore need to distinguish the temperature of a surface from that of the air. Measurements taken at different heights or times of day may also lead to misleading comparisons. Consistent methods are important when deciding whether a change is associated with planting trees.',
      'C. A tree that grows quickly is not necessarily the best choice for every street. Its roots may require space, and its crown may interfere with overhead cables. In dry locations, watering young trees can create an additional demand on limited supplies. A planting plan therefore involves trade-offs between cooling, maintenance and other uses of public space. It also requires attention to which neighbourhoods currently have the least shade.',
      'D. A careful evaluation considers both benefits and costs over time. Recording the survival of young trees can reveal whether a planting programme is being maintained successfully. Counting the number initially planted cannot provide this information by itself. Local residents can contribute observations, although these should be collected using clear instructions. Tree planting is one possible response to urban heat; it works alongside measures such as building design and access to drinking water.',
    ],
    questions: [
      { id: '1', text: 'Trees influence their surroundings only by blocking sunlight.', answer: 'FALSE', options: tfng, evidence: 'A: trees can affect their surroundings in another way as well', explanation: 'only 排除了其他机制，但原文还介绍了水分蒸发吸热，因此有明确反证。' },
      { id: '2', text: 'Temperature readings taken at different times can produce misleading comparisons.', answer: 'TRUE', options: tfng, evidence: 'B: Measurements taken at different heights or times of day may also lead to misleading comparisons.', explanation: '题干 different times 对应原文 times of day；can 对应 may，没有扩大原文范围。' },
      { id: '3', text: 'Most residents prefer trees with large crowns.', answer: 'NOT GIVEN', options: tfng, evidence: 'C: its crown may interfere with overhead cables', explanation: '原文提到树冠与电线的关系，没有调查居民偏好，更没有 most 的比例信息。' },
      { id: '4', text: 'In dry places, young trees may need ______.', answer: 'watering', evidence: 'C: In dry locations, watering young trees can create an additional demand on limited supplies.', explanation: 'dry places 对应 dry locations。空格作 need 的宾语，使用原文 watering，不能自行改成多个词。' },
      { id: '5', text: 'Monitoring the ______ of young trees helps assess maintenance.', answer: 'survival', evidence: 'D: Recording the survival of young trees can reveal whether a planting programme is being maintained successfully.', explanation: 'monitoring 对应 recording；assess maintenance 对应 maintained successfully。' },
      { id: '6', text: 'Which paragraph explains practical conflicts that affect the choice of tree?', answer: 'C', options: ['A', 'B', 'C', 'D'], evidence: 'C: Its roots may require space, and its crown may interfere with overhead cables.', explanation: 'practical conflicts 被具体化为根系占地、树冠与电线冲突以及用水需求，定位 C。' },
    ],
    guide: { focus: '识别 only、most 等限定词，区分反证与信息缺失', review: ['第 1 题的 only 为什么关键？', '第 3 题能否从“树冠会影响电线”推断居民喜好？', '第 6 题的关键词如何被具体事例替换？'], drill: '遮住答案，给三道判断题分别写“支持 / 反证 / 没有信息”，每项只引用一处原文。', check: ['不把常识当作文章证据', '定位后还检查语义范围'], transferId: 'r-citizens' },
  },
  {
    id: 'r-citizens',
    skill: 'reading',
    title: 'When volunteers collect wildlife data',
    section: '学术阅读 · 科学与方法',
    minutes: 12,
    instruction: 'Read the passage. For questions 1–3, choose TRUE, FALSE or NOT GIVEN. For questions 4–5, write ONE WORD from the passage. For question 6, choose the best answer. This is an original short practice passage.',
    passage: [
      'A. Wildlife researchers cannot visit every garden, pond or field themselves. Projects that invite volunteers to record what they see can extend the geographical reach of a survey. A participant might submit a photograph, a location and the date of an observation. These contributions can help researchers investigate patterns that would be difficult to document with a small professional team alone.',
      'B. More records do not automatically mean more representative data. Volunteers may be concentrated near towns, while remote areas receive fewer visits. A place with many reports may therefore have more observers rather than more animals. Similarly, an increase in submitted records from one year to the next might reflect growing participation. It cannot, on its own, establish that the wildlife population has increased.',
      'C. Clear protocols can make observations easier to compare. A project might ask participants to watch a fixed area for the same period of time, including occasions when no target species is seen. Photographs can help specialists check uncertain identifications. Training also matters: distinguishing similar species may require practice. These approaches improve the usefulness of records, but they do not remove every source of error.',
      'D. The appropriate use of a dataset depends on the question being asked. A collection of occasional sightings may show that a species occurs in an area, yet provide a weak basis for estimating its total population. Researchers should explain these limits when presenting results. Volunteers can also benefit from taking part, for example by becoming more attentive to seasonal changes. Scientific value and public engagement can coexist without every observation answering every research question.',
    ],
    questions: [
      { id: '1', text: 'Volunteer contributions can help researchers cover a larger geographical area.', answer: 'TRUE', options: tfng, evidence: 'A: can extend the geographical reach of a survey', explanation: 'cover a larger area 是 extend the geographical reach 的同义表达。' },
      { id: '2', text: 'A rise in submitted records is sufficient proof that a wildlife population has grown.', answer: 'FALSE', options: tfng, evidence: 'B: It cannot, on its own, establish that the wildlife population has increased.', explanation: 'sufficient proof 与 cannot, on its own 明确冲突；记录变多还可能是参与者变多。' },
      { id: '3', text: 'Most volunteers have a university qualification in biology.', answer: 'NOT GIVEN', options: tfng, evidence: 'C: Training also matters', explanation: '文章说培训重要，但没有提供志愿者学历或专业的统计。' },
      { id: '4', text: 'Specialists can use ______ to check doubtful identifications.', answer: 'photographs', evidence: 'C: Photographs can help specialists check uncertain identifications.', explanation: 'doubtful 对应 uncertain；答案取原文复数 photographs。' },
      { id: '5', text: 'Volunteers may notice seasonal ______ more closely.', answer: 'changes', evidence: 'D: becoming more attentive to seasonal changes', explanation: 'notice more closely 对应 more attentive to，空格填 changes。' },
      { id: '6', text: 'What is the main point of paragraph D?', answer: 'B. A dataset should be used with its limitations in mind.', options: ['A. Occasional sightings are always scientifically useless.', 'B. A dataset should be used with its limitations in mind.', 'C. Every volunteer observation estimates population size accurately.'], evidence: 'D: The appropriate use of a dataset depends on the question being asked.', explanation: 'B 概括整段：数据用途要匹配研究问题并说明限制。A 的 always 和 C 的 every 都过度绝对。' },
    ],
    guide: { focus: '分清记录数量、观察者数量和动物数量', review: ['第 2 题混淆了哪两种增加？', '主旨题的错误选项有哪些绝对词？', '原文说数据有局限，是否等于数据毫无价值？'], drill: '用一句英文解释 why more records do not necessarily mean more animals，再不看解析重做主旨题。', check: ['能识别相关与充分证据的区别', '主旨覆盖全段，而非一个细节'], transferId: 'r-work' },
  },
  {
    id: 'r-work',
    skill: 'reading',
    title: 'What does workplace productivity measure?',
    section: '学术阅读 · 工作与社会',
    minutes: 12,
    instruction: 'Read the passage. For questions 1–3, choose TRUE, FALSE or NOT GIVEN. For questions 4–5, write ONE WORD from the passage. For question 6, choose the paragraph containing the information. This is an original short practice passage.',
    passage: [
      'A. Discussions about working from home often use the word productivity as though it had a single obvious meaning. Yet the number of tasks completed, their quality and their long-term value are different measures. An employee may answer many messages without advancing an important project. A fair evaluation therefore begins by specifying what kind of output matters for a particular role.',
      'B. The setting in which work takes place can affect concentration. At home, some employees have a quiet room, while others share space with family members. In an office, an immediate conversation may solve a problem quickly, but frequent interruptions can make demanding tasks harder. These differences mean that an arrangement that suits one employee may not suit another. A comparison should account for the conditions under which people work.',
      'C. Time also changes the interpretation of results. A new arrangement may appear efficient during a short trial, yet difficulties in training new staff may emerge later. Conversely, employees may need an initial period to learn new tools before benefits become visible. Looking only at the first week can miss both delayed costs and delayed gains. Job satisfaction is relevant too, although it is not identical to the amount of work produced.',
      'D. Organisations can combine several sources of information rather than rely on one indicator. Project outcomes, error rates and employee feedback may each reveal something different. The purpose is not to collect every possible number, but to choose evidence that matches the decision. If a change improves one outcome while worsening another, managers need to make that trade-off explicit instead of describing the arrangement as simply better or worse.',
    ],
    questions: [
      { id: '1', text: 'The quantity of completed tasks and their quality are identical measures.', answer: 'FALSE', options: tfng, evidence: 'A: the number of tasks completed, their quality and their long-term value are different measures', explanation: 'identical 与 different 直接冲突。注意 quantity 只对应任务数量。' },
      { id: '2', text: 'An arrangement suitable for one worker may be unsuitable for another.', answer: 'TRUE', options: tfng, evidence: 'B: an arrangement that suits one employee may not suit another', explanation: 'suitable / unsuitable 与 suits / may not suit 是同义对应。' },
      { id: '3', text: 'Employees working from home earn higher salaries on average.', answer: 'NOT GIVEN', options: tfng, evidence: 'B: At home, some employees have a quiet room', explanation: '原文讨论工作空间、干扰与专注，没有比较薪资。不能推断工资高低。' },
      { id: '4', text: 'A short ______ may not reveal problems that occur later.', answer: 'trial', evidence: 'C: efficient during a short trial, yet difficulties in training new staff may emerge later', explanation: 'later 对应 emerge later，short 后的原文名词是 trial。' },
      { id: '5', text: 'The decision should determine which ______ is selected.', answer: 'evidence', evidence: 'D: choose evidence that matches the decision', explanation: '题干调换了表达顺序，但仍然是选择与决策相匹配的 evidence。' },
      { id: '6', text: 'Which paragraph discusses why conclusions can change with the length of the observation period?', answer: 'C', options: ['A', 'B', 'C', 'D'], evidence: 'C: Time also changes the interpretation of results.', explanation: 'length of the observation period 对应短期试行、初始适应与延迟出现的效果，均在 C 段。' },
    ],
    guide: { focus: '识别定义差异与时间范围，避免把文章没有比较的内容带入判断', review: ['quality 和 quantity 在文中为什么不能混用？', '第 3 题能否根据自己的工作经验作答？', '第 6 题的时间线如何影响结论？'], drill: '为每段写一个 5–8 词英文标题，再解释哪段最适合回答时间范围类题目。', check: ['答案基于文章而非个人立场', '能概括段落功能'], transferId: 'r-retrieval' },
  },
]
