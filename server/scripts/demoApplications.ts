import type { JdExtraction } from '../llm.js'

export type Status = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

type Step = readonly [status: Status, daysAgo: number]

export interface DemoApplication {
  title: string
  company: string
  sourceWebsite: string | null
  extraction: JdExtraction | null
  history: readonly Step[]
}

function jd(requiredSkills: string[], niceToHaveSkills: string[], minYearsExperience: number | null): JdExtraction {
  return {
    requiredSkills,
    niceToHaveSkills,
    minYearsExperience,
    experienceRequirements:
      minYearsExperience === null || minYearsExperience === 0
        ? []
        : [`${minYearsExperience}+ years of professional experience`],
  }
}

export const DEMO_APPLICATIONS: readonly DemoApplication[] = [
  {
    title: 'Junior Full Stack Developer',
    company: 'Brightwave',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['React', 'TypeScript', 'Node.js', 'PostgreSQL'], ['Docker', 'AWS'], 1),
    history: [['saved', 80], ['applied', 78], ['interview', 66], ['offer', 55]],
  },
  {
    title: 'Frontend Developer',
    company: 'Pixel & Co',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['React', 'TypeScript', 'Tailwind CSS'], ['Next.js', 'Jest'], 1),
    history: [['saved', 76], ['applied', 75], ['rejected', 62]],
  },
  {
    title: 'Software Engineer',
    company: 'Northbeam',
    sourceWebsite: 'Indeed',
    extraction: jd(['Python', 'SQL', 'REST APIs', 'Git'], ['Docker', 'AWS'], 2),
    history: [['saved', 72], ['applied', 70], ['rejected', 64]],
  },
  {
    title: 'Graduate Software Developer',
    company: 'Kestrel Systems',
    sourceWebsite: 'Company website',
    extraction: jd(['JavaScript', 'Node', 'Git'], ['CI/CD'], 0),
    history: [['saved', 70], ['applied', 69], ['interview', 58], ['rejected', 49]],
  },
  {
    title: 'Backend Engineer',
    company: 'Lumen Health',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['Node.js', 'Postgres', 'REST API', 'Docker'], ['Kubernetes', 'Redis'], 3),
    history: [['saved', 66], ['applied', 65]],
  },
  {
    title: 'React Developer',
    company: 'Harbor Digital',
    sourceWebsite: 'Indeed',
    extraction: jd(['React.js', 'TypeScript', 'Jest'], ['GraphQL'], 2),
    history: [['saved', 64], ['applied', 62], ['rejected', 55]],
  },
  {
    title: 'Junior Web Developer',
    company: 'Greenfield Studio',
    sourceWebsite: 'Referral',
    extraction: jd(['HTML', 'CSS', 'JavaScript', 'React'], ['Figma'], 0),
    history: [['saved', 60], ['applied', 59], ['interview', 52], ['offer', 47]],
  },
  {
    title: 'Full Stack Engineer',
    company: 'Orbital Pay',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'], ['Redis', 'Docker'], 3),
    history: [['saved', 58], ['applied', 57], ['interview', 45], ['rejected', 40]],
  },
  {
    title: 'Software Developer',
    company: 'Tidewater Analytics',
    sourceWebsite: 'Glassdoor',
    extraction: jd(['Python', 'SQL', 'Git'], ['Tableau'], 1),
    history: [['saved', 55], ['applied', 54]],
  },
  {
    title: 'Platform Engineer',
    company: 'Cobalt Cloud',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Python'], ['Terraform'], 4),
    history: [['saved', 52], ['applied', 51], ['rejected', 50]],
  },
  {
    title: 'Junior Developer',
    company: 'Fernhill Software',
    sourceWebsite: 'Company website',
    extraction: jd(['JavaScript', 'TypeScript', 'Git'], ['React', 'Agile'], 0),
    history: [['saved', 50], ['applied', 48], ['interview', 40], ['rejected', 35]],
  },
  {
    title: 'Web Developer',
    company: 'Atlas Retail',
    sourceWebsite: 'Indeed',
    extraction: jd(['JavaScript', 'HTML', 'CSS', 'SQL'], ['PHP'], 1),
    history: [['saved', 47], ['applied', 46]],
  },
  {
    title: 'Frontend Engineer',
    company: 'Skyline Media',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['React', 'TypeScript', 'Next.js', 'Tailwind CSS'], ['GraphQL', 'Jest'], 2),
    history: [['saved', 44], ['applied', 43], ['interview', 33], ['offer', 26]],
  },
  {
    title: 'Software Engineer II',
    company: 'Meridian Bank',
    sourceWebsite: 'Indeed',
    extraction: jd(['Java', 'SQL', 'REST APIs', 'Git'], ['Spring Boot', 'Kubernetes'], 3),
    history: [['saved', 42], ['applied', 41], ['rejected', 36]],
  },
  {
    title: 'Node.js Developer',
    company: 'Quill Apps',
    sourceWebsite: 'Referral',
    extraction: jd(['Node.js', 'Express', 'MongoDB', 'TypeScript'], ['Docker'], 1),
    history: [['saved', 40], ['applied', 39], ['interview', 30], ['rejected', 24]],
  },
  {
    title: 'Junior Software Engineer',
    company: 'Bluepeak',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['Python', 'Django', 'PostgreSQL', 'Git'], ['Docker'], 1),
    history: [['saved', 38], ['applied', 37]],
  },
  {
    title: 'Full Stack Developer',
    company: 'Ember Labs',
    sourceWebsite: 'Company website',
    extraction: jd(['React', 'Node.js', 'SQL', 'REST APIs'], ['AWS', 'CI/CD'], 2),
    history: [['saved', 35], ['applied', 34], ['interview', 27]],
  },
  {
    title: 'Software Developer',
    company: 'Crestline Insurance',
    sourceWebsite: 'Indeed',
    extraction: jd(['C#', '.NET', 'SQL', 'Git'], ['Azure'], 2),
    history: [['saved', 33], ['applied', 32], ['rejected', 29]],
  },
  {
    title: 'Cloud Developer',
    company: 'Zenith Tech',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['AWS', 'Python', 'Docker', 'CI/CD'], ['Terraform'], 2),
    history: [['saved', 31], ['applied', 30], ['interview', 24], ['applied', 23]],
  },
  {
    title: 'Frontend Developer',
    company: 'Nimbus UI',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['React', 'TypeScript', 'Jest'], ['Tailwind CSS'], 1),
    history: [['saved', 28], ['interview', 22]],
  },
  {
    title: 'Backend Developer',
    company: 'Foxglove Data',
    sourceWebsite: 'Glassdoor',
    extraction: jd(['Python', 'PostgreSQL', 'Docker', 'REST APIs'], ['Kafka'], 3),
    history: [['saved', 27], ['applied', 26], ['rejected', 21]],
  },
  {
    title: 'Software Engineer',
    company: 'Ironclad Security',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['Go', 'Docker', 'Kubernetes', 'PostgreSQL'], ['Terraform'], 3),
    history: [['saved', 25], ['applied', 23]],
  },
  {
    title: 'Junior Full Stack Developer',
    company: 'Paperplane',
    sourceWebsite: 'Referral',
    extraction: jd(['React', 'Node.js', 'TypeScript', 'PostgreSQL'], ['Docker'], null),
    history: [['saved', 21], ['applied', 20], ['interview', 12]],
  },
  {
    title: 'React Engineer',
    company: 'Solstice Health',
    sourceWebsite: 'LinkedIn',
    extraction: jd(['React', 'TypeScript', 'GraphQL'], ['Cypress'], 2),
    history: [['saved', 12], ['applied', 9]],
  },
  {
    title: 'Software Developer',
    company: 'Quarry Labs',
    sourceWebsite: 'Indeed',
    extraction: jd(['Java', 'SQL', 'Git', 'Agile'], ['Jenkins'], 2),
    history: [['saved', 8], ['applied', 6]],
  },
  {
    title: 'Frontend Developer',
    company: 'Willow & Finch',
    sourceWebsite: 'Company website',
    extraction: jd(['HTML', 'CSS', 'JavaScript', 'React'], ['Accessibility'], 1),
    history: [['saved', 4]],
  },
  {
    title: 'DevOps Engineer',
    company: 'Granite Works',
    sourceWebsite: null,
    extraction: null,
    history: [['saved', 2]],
  },
]
