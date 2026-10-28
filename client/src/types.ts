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

export type CvMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain'

export interface CvExtraction {
  skills: string[]
  totalYearsExperience: number | null
}

export interface Cv {
  id: number
  fileName: string
  mimeType: CvMimeType
  sizeBytes: number
  textExtractionStatus: 'success' | 'failed'
  uploadedAt: string
  isPrimary: boolean
  skillsExtraction: CvExtraction | null
  skillsExtractionStatus: ExtractionStatus
}

export type EvidenceTier = 'none' | 'limited' | 'full'

export interface SkillGapRow {
  name: string
  applicationCount: number
  requiredCount: number
  inCv: boolean
}

export interface SkillGap {
  applicationCount: number
  tier: EvidenceTier
  skills: SkillGapRow[]
}

export interface CvEvaluation {
  summary: string
  strengths: string[]
  gaps: string[]
  suggestions: string[]
}

export interface Evaluation {
  id: number
  cvId: number | null
  cvFileName: string
  tier: EvidenceTier
  applicationCount: number
  skillGap: SkillGap
  evaluation: CvEvaluation
  createdAt: string
}

export type PipelineStage = 'saved' | 'applied' | 'interview' | 'offer'
export type TimedStage = 'saved' | 'applied' | 'interview'

export interface StageTiming {
  medianDays: number | null
  sampleSize: number
}

export interface SkillFrequency {
  name: string
  requiredCount: number
  niceToHaveCount: number
}

export interface SourceStats {
  source: string | null
  applications: number
  applied: number
  replied: number
}

export interface WeeklyCount {
  weekStart: string
  count: number
}

export interface ExperienceStats {
  medianYears: number | null
  minYears: number | null
  maxYears: number | null
  sampleSize: number
}

export interface Stats {
  funnel: Record<PipelineStage, number>
  dropOff: Record<PipelineStage, number>
  stageDurations: Record<TimedStage, StageTiming>
  awaitingReply: number
  totals: { applications: number; applied: number; replied: number }
  extractedApplications: number
  skills: SkillFrequency[]
  sources: SourceStats[]
  weeklyApplications: WeeklyCount[]
  experience: ExperienceStats
}

export interface ApplicationInput {
  title: string
  company: string
  recruiter: string | null
  sourceWebsite: string | null
  status: ApplicationStatus
  appliedOn: string | null
}
