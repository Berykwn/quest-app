export interface CourseSummary {
  id: string
  title: string
}

export interface EnrollmentSummary {
  course_id: string
  assigned_at?: string
  courses?: CourseSummary | CourseSummary[]
}

export interface User {
  id: string
  email: string
  role?: string
  created_at: string
  updated_at?: string
  enrollments?: EnrollmentSummary[]
}