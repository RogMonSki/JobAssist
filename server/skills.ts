import type { PoolClient } from 'pg'
import type { CvExtraction, JdExtraction } from './llm.js'

export interface NormalisedSkill {
  key: string
  canonicalName: string
}

type Importance = 'required' | 'nice_to_have'

const CURATED_SKILLS: Record<string, string[]> = {
  JavaScript: ['JS', 'ECMAScript'],
  TypeScript: ['TS'],
  'Node.js': ['Node'],
  React: ['React.js'],
  'Next.js': ['Next'],
  Vue: ['Vue.js'],
  'Express.js': ['Express'],
  PostgreSQL: ['Postgres'],
  MongoDB: ['Mongo'],
  'SQL Server': ['MSSQL', 'Microsoft SQL Server'],
  Kubernetes: ['k8s'],
  AWS: ['Amazon Web Services'],
  'Google Cloud': ['GCP', 'Google Cloud Platform'],
  Azure: ['Microsoft Azure'],
  Go: ['Golang'],
  'C#': ['C Sharp', 'CSharp'],
  'C++': ['CPP'],
  '.NET': ['dotnet'],
  'Ruby on Rails': ['Rails', 'RoR'],
  'REST APIs': ['REST', 'RESTful', 'REST API', 'RESTful API', 'RESTful APIs'],
  'CI/CD': ['CICD', 'CI CD'],
  'Tailwind CSS': ['Tailwind'],
  HTML: ['HTML5'],
  CSS: ['CSS3'],
  'Machine Learning': ['ML'],
  'Artificial Intelligence': ['AI'],
  'Test-Driven Development': ['TDD'],
  'Object-Oriented Programming': ['OOP'],
  'scikit-learn': ['sklearn'],
  Microservices: ['Microservice', 'Microservices architecture'],
}

export function skillKey(name: string): string {
  return name.toLowerCase().replace(/[\s._-]+/g, '')
}

export function buildCanonicalLookup(curated: Record<string, string[]>): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const [canonicalName, aliases] of Object.entries(curated)) {
    for (const spelling of [canonicalName, ...aliases]) {
      const key = skillKey(spelling)
      const existing = lookup.get(key)
      if (existing !== undefined && existing !== canonicalName) {
        throw new Error(`Skill key "${key}" is claimed by both "${existing}" and "${canonicalName}"`)
      }
      lookup.set(key, canonicalName)
    }
  }
  return lookup
}

const CANONICAL_BY_KEY = buildCanonicalLookup(CURATED_SKILLS)

export function normaliseSkill(name: string): NormalisedSkill | null {
  const trimmed = name.trim()
  const key = skillKey(trimmed)
  if (key === '') {
    return null
  }
  const canonicalName = CANONICAL_BY_KEY.get(key)
  if (canonicalName === undefined) {
    return { key, canonicalName: trimmed }
  }
  return { key: skillKey(canonicalName), canonicalName }
}

export async function applyCuratedNames(client: PoolClient): Promise<void> {
  const names = Object.keys(CURATED_SKILLS)
  await client.query(
    `UPDATE skills AS s SET canonical_name = t.canonical_name
     FROM unnest($1::text[], $2::text[]) AS t(key, canonical_name)
     WHERE s.key = t.key AND s.canonical_name <> t.canonical_name`,
    [names.map(skillKey), names]
  )
}

export async function deleteUnusedSkills(client: PoolClient): Promise<number> {
  const result = await client.query(
    `DELETE FROM skills s
     WHERE NOT EXISTS (SELECT 1 FROM application_skills WHERE skill_id = s.id)
       AND NOT EXISTS (SELECT 1 FROM cv_skills WHERE skill_id = s.id)`
  )
  return result.rowCount ?? 0
}

async function upsertSkills(client: PoolClient, skills: NormalisedSkill[]): Promise<Map<string, number>> {
  const unique = [...new Map(skills.map((skill) => [skill.key, skill])).values()].sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0
  )
  if (unique.length === 0) {
    return new Map()
  }

  const keys = unique.map((skill) => skill.key)
  await client.query(
    `INSERT INTO skills (key, canonical_name)
     SELECT * FROM unnest($1::text[], $2::text[])
     ON CONFLICT (key) DO NOTHING`,
    [keys, unique.map((skill) => skill.canonicalName)]
  )
  const result = await client.query<{ id: number; key: string }>(
    'SELECT id, key FROM skills WHERE key = ANY($1::text[])',
    [keys]
  )
  return new Map(result.rows.map((row) => [row.key, row.id]))
}

export async function syncApplicationSkills(
  client: PoolClient,
  applicationId: number,
  extraction: JdExtraction | null
): Promise<void> {
  await client.query('DELETE FROM application_skills WHERE application_id = $1', [applicationId])
  if (extraction === null) {
    return
  }

  const entries = new Map<string, { skill: NormalisedSkill; importance: Importance }>()
  const add = (names: string[], importance: Importance) => {
    for (const name of names) {
      const skill = normaliseSkill(name)
      if (skill !== null && !entries.has(skill.key)) {
        entries.set(skill.key, { skill, importance })
      }
    }
  }
  add(extraction.requiredSkills, 'required')
  add(extraction.niceToHaveSkills, 'nice_to_have')
  if (entries.size === 0) {
    return
  }

  const ids = await upsertSkills(client, [...entries.values()].map((entry) => entry.skill))
  const rows = [...entries.entries()].map(([key, entry]) => ({ id: ids.get(key), importance: entry.importance }))
  await client.query(
    `INSERT INTO application_skills (application_id, skill_id, importance)
     SELECT $1, * FROM unnest($2::int[], $3::text[])`,
    [applicationId, rows.map((row) => row.id), rows.map((row) => row.importance)]
  )
}

export async function syncCvSkills(
  client: PoolClient,
  cvId: number,
  extraction: CvExtraction | null
): Promise<void> {
  await client.query('DELETE FROM cv_skills WHERE cv_id = $1', [cvId])
  if (extraction === null) {
    return
  }

  const skills = extraction.skills.flatMap((name) => normaliseSkill(name) ?? [])
  if (skills.length === 0) {
    return
  }

  const ids = await upsertSkills(client, skills)
  await client.query(
    `INSERT INTO cv_skills (cv_id, skill_id)
     SELECT $1, * FROM unnest($2::int[])
     ON CONFLICT DO NOTHING`,
    [cvId, [...new Set(skills.map((skill) => ids.get(skill.key)))]]
  )
}
