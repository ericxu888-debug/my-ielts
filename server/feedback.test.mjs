import test from 'node:test'
import assert from 'node:assert/strict'
import { answerSources, groundFeedback } from './feedback.mjs'

const feedback = priorities => ({ summary: '需要更明确地表达观点', strengths: ['已表达立场'], priorities, exercise: '用一句明确的理由重答', limitation: '样本短，只能针对片段反馈' })
const priority = evidence => ({ issue: '指代不明确', evidence, action: '明确 first 指代哪种观点' })

test('short user sample receives its own source ID and the server restores original text', () => {
  const text = 'I think the first is important'
  const sources = answerSources(text)
  assert.deepEqual(sources, [{ id: 'S1', text }])
  const result = groundFeedback(feedback([{ issue: '指代不明确', evidenceId: 'S1', action: '直接说出你的观点' }]), sources)
  assert.equal(result.feedback.priorities[0].evidence, text)
  assert.equal(result.error, undefined)
})
test('line breaks without punctuation and long answers do not lose source text', () => {
  assert.deepEqual(answerSources('First line\nSecond line').map(v => v.text), ['First line', 'Second line'])
  const text = 'university '.repeat(140).trim()
  const sources = answerSources(text)
  assert.ok(sources.every(v => v.text.length <= 600))
  assert.equal(sources.map(v => v.text).join(' '), text)
})
for (const quote of ['“I think the first is important”', ' I think  the first\tis important ', '"I think the first is important"']) {
  test(`format-only differences match original evidence: ${JSON.stringify(quote)}`, () => {
    const text = 'I think the first is important'
    const result = groundFeedback(feedback([priority(quote)]), answerSources(text))
    assert.equal(result.feedback.priorities[0].evidence, text)
  })
}
test('typographic apostrophes can match, while original spelling is preserved', () => {
  const text = 'I don’t enjoy studying alone.'
  const result = groundFeedback(feedback([priority("I don't enjoy studying alone.")]), answerSources(text))
  assert.equal(result.feedback.priorities[0].evidence, text)
})
test('invented and grammatically corrected quotations are not accepted as original evidence', () => {
  for (const quote of ['I think employment is more important.', 'I think the first option is important']) {
    assert.match(groundFeedback(feedback([priority(quote)]), answerSources('I think the first is important')).error, /引用未能/)
  }
  assert.match(groundFeedback(feedback([{ issue: 'test', evidenceId: 'S999', action: 'test' }]), answerSources('A real answer.')).error, /引用未能/)
})
test('one bad citation does not discard other grounded feedback; the omission is visible', () => {
  const result = groundFeedback(feedback([{ issue: 'clearer reference', evidenceId: 'S1', action: 'be specific' }, priority('This sentence does not exist.')]), answerSources('I think the first is important'))
  assert.equal(result.feedback.priorities.length, 1)
  assert.match(result.feedback.warnings[0], /1 条/)
})
test('malformed AI responses produce a controlled error rather than crashing', () => {
  for (const value of [null, [], {}, feedback([{}]), feedback([{ issue: 'test', evidence: '', action: 'test' }])]) {
    assert.ok(groundFeedback(value, answerSources('I think the first is important')).error)
  }
})
