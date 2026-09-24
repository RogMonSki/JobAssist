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

export interface Application {
  id: number
  title: string
  company: string
  recruiter: string | null
  sourceWebsite: string | null
  status: ApplicationStatus
  appliedOn: string | null
  extractionStatus: string
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
