-- Create attendance table for storing student attendance records
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  section VARCHAR(50) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_accuracy DECIMAL(10, 2),
  is_location_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_section_date ON public.attendance(section, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance table
-- Allow anyone to insert attendance records (students submitting attendance)
CREATE POLICY "Allow attendance submission" ON public.attendance 
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read attendance records (for admin dashboard)
CREATE POLICY "Allow attendance viewing" ON public.attendance 
  FOR SELECT USING (true);

-- Prevent updates and deletes to maintain data integrity
CREATE POLICY "Prevent attendance updates" ON public.attendance 
  FOR UPDATE USING (false);

CREATE POLICY "Prevent attendance deletion" ON public.attendance 
  FOR DELETE USING (false);

-- Create a function to prevent duplicate submissions on the same date
CREATE OR REPLACE FUNCTION check_duplicate_attendance()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.attendance 
    WHERE student_id = NEW.student_id 
    AND date = NEW.date
  ) THEN
    RAISE EXCEPTION 'Attendance already submitted for this date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicate submissions
DROP TRIGGER IF EXISTS prevent_duplicate_attendance ON public.attendance;
CREATE TRIGGER prevent_duplicate_attendance
  BEFORE INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_attendance();
