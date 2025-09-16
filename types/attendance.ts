export interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  section: string
  date: string
  time_submitted: string
  latitude: number | null
  longitude: number | null
  location_accuracy: number | null
  is_location_verified: boolean
  created_at: string
  device_fingerprint?: string
  user_agent?: string
  ip_address?: string
}
