-- Verify and create attendance table with better error handling
-- This script can be run multiple times safely

-- First, check if the table exists and create it if it doesn't
DO $$
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
        -- Create the attendance table
        CREATE TABLE public.attendance (
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
        
        RAISE NOTICE 'Created attendance table successfully';
    ELSE
        RAISE NOTICE 'Attendance table already exists';
    END IF;
END
$$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_section_date ON public.attendance(section, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow attendance submission" ON public.attendance;
DROP POLICY IF EXISTS "Allow attendance viewing" ON public.attendance;
DROP POLICY IF EXISTS "Prevent attendance updates" ON public.attendance;
DROP POLICY IF EXISTS "Prevent attendance deletion" ON public.attendance;

-- Create policies for attendance table
CREATE POLICY "Allow attendance submission" ON public.attendance 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow attendance viewing" ON public.attendance 
  FOR SELECT USING (true);

CREATE POLICY "Prevent attendance updates" ON public.attendance 
  FOR UPDATE USING (false);

CREATE POLICY "Prevent attendance deletion" ON public.attendance 
  FOR DELETE USING (false);

-- Create or replace the duplicate prevention function
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS prevent_duplicate_attendance ON public.attendance;
CREATE TRIGGER prevent_duplicate_attendance
  BEFORE INSERT ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_attendance();

-- Verify the setup
DO $$
BEGIN
    -- Check if table was created successfully
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
        RAISE NOTICE 'Database setup completed successfully. Attendance table is ready.';
    ELSE
        RAISE EXCEPTION 'Failed to create attendance table';
    END IF;
END
$$;
