import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SpeakingBite from '../src/training/SpeakingBite.vue'

describe('retrieval practice on the home page', () => {
  afterEach(() => {
    vi.useRealTimers()
  })
  it('hides examples while practising and restores them with self-checks after 30 seconds', async () => {
    vi.useFakeTimers()
    const wrapper = mount(SpeakingBite, { global: { stubs: { RouterLink: true } } })
    try {
      expect(wrapper.find('.bite-example').exists()).toBe(true)
      await wrapper.findAll('button')[0].trigger('click')
      expect(wrapper.find('.bite-example').exists()).toBe(false)
      expect(wrapper.find('.bite-check').exists()).toBe(false)
      await vi.advanceTimersByTimeAsync(30000)
      expect(wrapper.find('.bite-example').exists()).toBe(true)
      expect(wrapper.findAll('.bite-check li')).toHaveLength(2)
    }
    finally { wrapper.unmount() }
  })
  it('changing the lesson resets an active exercise and does not show old self-checks', async () => {
    vi.useFakeTimers()
    const wrapper = mount(SpeakingBite, { global: { stubs: { RouterLink: true } } })
    try {
      const title = wrapper.find('h2').text()
      await wrapper.findAll('button')[0].trigger('click')
      await wrapper.find('.bite-next').trigger('click')
      expect(wrapper.find('h2').text()).not.toBe(title)
      expect(wrapper.find('.bite-challenge').exists()).toBe(false)
      await vi.advanceTimersByTimeAsync(30000)
      expect(wrapper.find('.bite-check').exists()).toBe(false)
    }
    finally { wrapper.unmount() }
  })
})
