import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalLookup, normaliseSkill, skillKey } from './skills.js'

describe('skillKey', () => {
  it('lowercases and strips spaces, dots, hyphens and underscores', () => {
    assert.equal(skillKey('Node.js'), 'nodejs')
    assert.equal(skillKey('node js'), 'nodejs')
    assert.equal(skillKey('NODE-JS'), 'nodejs')
    assert.equal(skillKey('scikit_learn'), 'scikitlearn')
  })

  it('keeps + and # so C, C++ and C# stay distinct', () => {
    const keys = new Set([skillKey('C'), skillKey('C++'), skillKey('C#')])
    assert.equal(keys.size, 3)
  })
})

describe('normaliseSkill', () => {
  it('maps aliases to the canonical spelling', () => {
    assert.deepEqual(normaliseSkill('Postgres'), { key: 'postgresql', canonicalName: 'PostgreSQL' })
    assert.equal(normaliseSkill('k8s')?.canonicalName, 'Kubernetes')
    assert.equal(normaliseSkill('React.js')?.canonicalName, 'React')
  })

  it('gives different spellings of the same skill the same key', () => {
    assert.equal(normaliseSkill('PostgreSQL')?.canonicalName, 'PostgreSQL')
    assert.equal(normaliseSkill('postgresql')?.canonicalName, 'PostgreSQL')
    assert.equal(normaliseSkill('POSTGRESQL')?.key, normaliseSkill('PostgreSQL')?.key)
  })

  it('gives every alias of a skill the same key as its canonical name', () => {
    assert.equal(normaliseSkill('Express')?.key, normaliseSkill('Express.js')?.key)
    assert.equal(normaliseSkill('Postgres')?.key, normaliseSkill('PostgreSQL')?.key)
    assert.equal(normaliseSkill('k8s')?.key, normaliseSkill('Kubernetes')?.key)
    assert.equal(normaliseSkill('CI CD')?.key, normaliseSkill('CI/CD')?.key)
  })

  it('keeps an unknown skill under its trimmed raw name', () => {
    assert.deepEqual(normaliseSkill('  Terraform '), { key: 'terraform', canonicalName: 'Terraform' })
  })

  it('does not merge C, C++ and C#', () => {
    assert.equal(normaliseSkill('C')?.canonicalName, 'C')
    assert.equal(normaliseSkill('C++')?.canonicalName, 'C++')
    assert.equal(normaliseSkill('C Sharp')?.canonicalName, 'C#')
  })

  it('returns null for names with nothing left after cleaning', () => {
    assert.equal(normaliseSkill(''), null)
    assert.equal(normaliseSkill(' . - '), null)
  })
})

describe('buildCanonicalLookup', () => {
  it('rejects a table where two canonical names claim the same key', () => {
    assert.throws(
      () => buildCanonicalLookup({ Postgres: ['PG'], PostgreSQL: ['pg'] }),
      /claimed by both/
    )
  })
})
