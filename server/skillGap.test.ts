import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { evidenceTier } from './skillGap.js'

describe('evidenceTier', () => {
  it('has no evidence with zero applications', () => {
    assert.equal(evidenceTier(0), 'none')
  })

  it('is limited from one to four applications', () => {
    assert.equal(evidenceTier(1), 'limited')
    assert.equal(evidenceTier(4), 'limited')
  })

  it('is full from five applications', () => {
    assert.equal(evidenceTier(5), 'full')
    assert.equal(evidenceTier(40), 'full')
  })
})
