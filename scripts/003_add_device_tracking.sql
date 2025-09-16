-- Add device tracking to prevent multiple submissions from same device
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET;

-- Create index for faster device lookups
CREATE INDEX IF NOT EXISTS idx_attendance_device_date 
ON attendance(device_fingerprint, date);

-- Create unique constraint to prevent duplicate submissions from same device per day
ALTER TABLE attendance 
ADD CONSTRAINT IF NOT EXISTS unique_device_per_day 
UNIQUE (device_fingerprint, date);

-- Update the existing unique constraint name for clarity
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS unique_student_per_day;

ALTER TABLE attendance 
ADD CONSTRAINT IF NOT EXISTS unique_student_per_day 
UNIQUE (student_id, date);
