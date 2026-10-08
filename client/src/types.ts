export interface User {
  id: number
  email: string
  username: string
  firstName: string
  lastName: string
}

export interface SignupFields {
  email: string
  username: string
  firstName: string
  lastName: string
  password: string
}

export const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const
export type ApplicationStatus = (typeof STATUSES)[number]

export type ExtractionStatus = 'not_attempted' | 'success' | 'failed'

export interface JdExtraction {
  requiredSkills: string[]
  niceToHaveSkills: string[]
  minYearsExperience: number | null
  experienceRequirements: string[]
}

export interface Application {
  id: number
  title: string
  company: string
  recruiter: string | null
  sourceWebsite: string | null
  status: ApplicationStatus
  appliedOn: string | null
  extractionStatus: ExtractionStatus
  jobDescription: string | null
  jdExtraction: JdExtraction | null
  createdAt: string
  updatedAt: string
}

export interface ApplicationInput {
  title: string
  company: string
  recruiter: string | null
  sourceWebsite: string | null
  status: ApplicationStatus
  appliedOn: string | null
}
