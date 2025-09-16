-- Simple migration to add device tracking columns
-- Add device_fingerprint column
ALTER TABLE attendance ADD COLUMN device_fingerprint TEXT;

-- Add user_agent column  
ALTER TABLE attendance ADD COLUMN user_agent TEXT;

-- Add ip_address column
ALTER TABLE attendance ADD COLUMN ip_address INET;

-- Create index for faster device lookups
CREATE INDEX idx_attendance_device_date ON attendance(device_fingerprint, date);

-- Add constraint to prevent duplicate submissions from same device per day
ALTER TABLE attendance ADD CONSTRAINT unique_device_per_day UNIQUE (device_fingerprint, date);
