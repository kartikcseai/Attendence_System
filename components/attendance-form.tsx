"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, CheckCircle, AlertCircle, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface FormData {
  studentId: string
  studentName: string
  section: string
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
}

const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  ctx!.textBaseline = "top"
  ctx!.font = "14px Arial"
  ctx!.fillText("Device fingerprint", 2, 2)

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join("|")

  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

export function AttendanceForm() {
  const [formData, setFormData] = useState<FormData>({
    studentId: "",
    studentName: "",
    section: "",
  })
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({})
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("")
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false)

  const sections = ["Section A", "Section B", "Section C", "Section D", "Section E"]

  useEffect(() => {
    const fingerprint = generateDeviceFingerprint()
    setDeviceFingerprint(fingerprint)
    checkDeviceSubmission(fingerprint)
  }, [])

  const checkDeviceSubmission = async (fingerprint: string) => {
    try {
      const supabase = createClient()
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("attendance")
        .select("id")
        .eq("device_fingerprint", fingerprint)
        .eq("date", today)
        .limit(1)

      if (error) {
        console.log("[v0] Error checking device submission:", error)
        return
      }

      if (data && data.length > 0) {
        setHasSubmittedToday(true)
        setError(
          "This device has already been used to submit attendance today. Each device can only submit once per day.",
        )
      }
    } catch (err) {
      console.log("[v0] Error checking device submission:", err)
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {}

    if (!formData.studentId.trim()) {
      errors.studentId = "Student ID is required"
    } else if (formData.studentId.length < 3) {
      errors.studentId = "Student ID must be at least 3 characters"
    }

    if (!formData.studentName.trim()) {
      errors.studentName = "Student name is required"
    } else if (formData.studentName.length < 2) {
      errors.studentName = "Student name must be at least 2 characters"
    }

    if (!formData.section) {
      errors.section = "Section is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const getLocation = async () => {
    setIsLoadingLocation(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get location. Please enable location services and try again.",
      )
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasSubmittedToday) {
      setError("This device has already been used to submit attendance today.")
      return
    }

    if (!validateForm()) {
      return
    }

    if (!location) {
      setError("Please verify your location before submitting")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      console.log("[v0] Attempting to submit attendance data:", {
        student_id: formData.studentId.trim(),
        student_name: formData.studentName.trim(),
        section: formData.section,
        latitude: location.latitude,
        longitude: location.longitude,
        location_accuracy: location.accuracy,
        is_location_verified: location.accuracy <= 100,
        device_fingerprint: deviceFingerprint,
        user_agent: navigator.userAgent,
      })

      const { error: insertError } = await supabase.from("attendance").insert({
        student_id: formData.studentId.trim(),
        student_name: formData.studentName.trim(),
        section: formData.section,
        latitude: location.latitude,
        longitude: location.longitude,
        location_accuracy: location.accuracy,
        is_location_verified: location.accuracy <= 100,
        device_fingerprint: deviceFingerprint,
        user_agent: navigator.userAgent,
      })

      if (insertError) {
        console.log("[v0] Database insert error:", insertError)

        if (insertError.message.includes("unique_device_per_day")) {
          throw new Error("This device has already been used to submit attendance today")
        }
        if (insertError.message.includes("unique_student_per_day")) {
          throw new Error("You have already submitted attendance for today")
        }
        if (insertError.message.includes("relation") && insertError.message.includes("does not exist")) {
          throw new Error("Database table not found. Please ensure the database setup script has been executed.")
        }
        throw new Error(insertError.message)
      }

      console.log("[v0] Attendance submitted successfully")
      setSuccess(true)
      setHasSubmittedToday(true)
      setFormData({ studentId: "", studentName: "", section: "" })
      setLocation(null)
    } catch (err) {
      console.log("[v0] Error submitting attendance:", err)
      setError(err instanceof Error ? err.message : "Failed to submit attendance")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasSubmittedToday && !success) {
    return (
      <div className="text-center py-8">
        <Shield className="mx-auto h-16 w-16 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Device Already Used</h3>
        <p className="text-muted-foreground mb-4">
          This device has already been used to submit attendance today. Each device can only submit once per day to
          prevent duplicate entries.
        </p>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            If you need to submit attendance for a different student, please use a different device or contact your
            administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Attendance Submitted Successfully!</h3>
        <p className="text-muted-foreground mb-4">Your attendance has been recorded for today.</p>
        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>This device cannot be used to submit another attendance record today.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Device security enabled: Each device can only submit attendance once per day.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="studentId">Student ID</Label>
        <Input
          id="studentId"
          type="text"
          placeholder="Enter your student ID"
          value={formData.studentId}
          onChange={(e) => handleInputChange("studentId", e.target.value)}
          className={validationErrors.studentId ? "border-destructive" : ""}
        />
        {validationErrors.studentId && <p className="text-sm text-destructive">{validationErrors.studentId}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentName">Full Name</Label>
        <Input
          id="studentName"
          type="text"
          placeholder="Enter your full name"
          value={formData.studentName}
          onChange={(e) => handleInputChange("studentName", e.target.value)}
          className={validationErrors.studentName ? "border-destructive" : ""}
        />
        {validationErrors.studentName && <p className="text-sm text-destructive">{validationErrors.studentName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="section">Section</Label>
        <Select value={formData.section} onValueChange={(value) => handleInputChange("section", value)}>
          <SelectTrigger className={validationErrors.section ? "border-destructive" : ""}>
            <SelectValue placeholder="Select your section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section} value={section}>
                {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.section && <p className="text-sm text-destructive">{validationErrors.section}</p>}
      </div>

      <div className="space-y-3">
        <Label>Location Verification</Label>
        {!location ? (
          <Button
            type="button"
            variant="outline"
            onClick={getLocation}
            disabled={isLoadingLocation}
            className="w-full bg-transparent"
          >
            {isLoadingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Verify Location
              </>
            )}
          </Button>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Location verified with {location.accuracy.toFixed(0)}m accuracy</AlertDescription>
          </Alert>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || !location || hasSubmittedToday}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Attendance"
        )}
      </Button>
    </form>
  )

  function handleInputChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }
}
