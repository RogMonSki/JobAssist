import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { summariseStatusHistory, type Status, type StatusEvent } from './stats.js'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-28T12:00:00Z')

function history(...steps: [status: Status, daysAgo: number][]): StatusEvent[] {
  return steps.map(([status, daysAgo]) => ({ status, changedAt: new Date(NOW.getTime() - daysAgo * DAY_MS) }))
}

describe('summariseStatusHistory funnel', () => {
  it('counts an application that skips a stage as having reached it', () => {
    const summary = summariseStatusHistory([history(['saved', 10], ['interview', 5])], NOW)

    assert.deepEqual(summary.funnel, { saved: 1, applied: 1, interview: 1, offer: 0 })
  })

  it('keeps a stage reached even if the status was later moved back', () => {
    const summary = summariseStatusHistory(
      [history(['saved', 30], ['applied', 29], ['interview', 20], ['applied', 19])],
      NOW
    )

    assert.deepEqual(summary.funnel, { saved: 1, applied: 1, interview: 1, offer: 0 })
  })

  it('counts an application that was only ever rejected at the first stage', () => {
    const summary = summariseStatusHistory([history(['rejected', 3])], NOW)

    assert.deepEqual(summary.funnel, { saved: 1, applied: 0, interview: 0, offer: 0 })
  })
})

describe('summariseStatusHistory drop-off', () => {
  it('attributes each rejection to the furthest stage the application reached', () => {
    const summary = summariseStatusHistory(
      [
        history(['saved', 20], ['applied', 19], ['rejected', 10]),
        history(['saved', 20], ['applied', 19], ['interview', 12], ['rejected', 5]),
        history(['saved', 20], ['applied', 19], ['interview', 12], ['rejected', 4]),
        history(['saved', 20], ['applied', 19], ['interview', 12], ['offer', 8], ['rejected', 2]),
        history(['saved', 20], ['applied', 19]),
      ],
      NOW
    )

    assert.deepEqual(summary.dropOff, { saved: 0, applied: 1, interview: 2, offer: 1 })
  })
})

describe('summariseStatusHistory stage durations', () => {
  it('reports the median days of completed stays with the sample size', () => {
    const summary = summariseStatusHistory(
      [
        history(['saved', 30], ['applied', 28]),
        history(['saved', 30], ['applied', 27]),
        history(['saved', 30], ['applied', 26]),
      ],
      NOW
    )

    assert.deepEqual(summary.stageDurations.saved, { medianDays: 3, sampleSize: 3 })
  })

  it('averages the two middle stays when there is an even number', () => {
    const summary = summariseStatusHistory(
      [
        history(['saved', 30], ['applied', 29]),
        history(['saved', 30], ['applied', 28]),
        history(['saved', 30], ['applied', 26]),
        history(['saved', 30], ['applied', 21]),
      ],
      NOW
    )

    assert.deepEqual(summary.stageDurations.saved, { medianDays: 3, sampleSize: 4 })
  })

  it('leaves out a stay that is still in progress', () => {
    const summary = summariseStatusHistory([history(['saved', 10], ['applied', 5])], NOW)

    assert.deepEqual(summary.stageDurations.saved, { medianDays: 5, sampleSize: 1 })
    assert.deepEqual(summary.stageDurations.applied, { medianDays: null, sampleSize: 0 })
  })
})

describe('summariseStatusHistory awaiting reply', () => {
  it('counts applications that have been at applied for more than 14 days', () => {
    const summary = summariseStatusHistory(
      [
        history(['saved', 30], ['applied', 20]),
        history(['saved', 30], ['applied', 14]),
        history(['saved', 30], ['applied', 15]),
        history(['saved', 40], ['applied', 39], ['interview', 30]),
      ],
      NOW
    )

    assert.equal(summary.awaitingReply, 2)
  })
})

describe('summariseStatusHistory edge cases', () => {
  it('does not count a rejection that was later undone as a drop-off', () => {
    const summary = summariseStatusHistory(
      [history(['saved', 20], ['applied', 19], ['rejected', 10], ['applied', 5])],
      NOW
    )

    assert.deepEqual(summary.dropOff, { saved: 0, applied: 0, interview: 0, offer: 0 })
  })

  it('returns zero counts and no medians when there are no applications', () => {
    const summary = summariseStatusHistory([], NOW)

    assert.deepEqual(summary.funnel, { saved: 0, applied: 0, interview: 0, offer: 0 })
    assert.deepEqual(summary.stageDurations.saved, { medianDays: null, sampleSize: 0 })
  })
})
