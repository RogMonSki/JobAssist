import pool, { withTransaction } from '../db.js'
import type { CvExtraction, JdExtraction } from '../llm.js'
import {
  applyCuratedNames,
  deleteUnusedSkills,
  syncApplicationSkills,
  syncCvSkills,
} from '../skills.js'

async function rebuild() {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM application_skills')
    await client.query('DELETE FROM cv_skills')

    const applications = await client.query<{ id: number; jd_extraction: JdExtraction }>(
      `SELECT id, jd_extraction FROM applications
       WHERE extraction_status = 'success' AND jd_extraction IS NOT NULL`
    )
    for (const application of applications.rows) {
      await syncApplicationSkills(client, application.id, application.jd_extraction)
    }

    const cvs = await client.query<{ id: number; skills_extraction: CvExtraction }>(
      `SELECT id, skills_extraction FROM cvs
       WHERE skills_extraction_status = 'success' AND skills_extraction IS NOT NULL`
    )
    for (const cv of cvs.rows) {
      await syncCvSkills(client, cv.id, cv.skills_extraction)
    }

    await applyCuratedNames(client)
    const removed = await deleteUnusedSkills(client)

    console.log(
      `Rebuilt skills for ${applications.rows.length} applications and ${cvs.rows.length} CVs; removed ${removed} unused skills`
    )
  })
}

rebuild()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
