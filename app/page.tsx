import { AttendanceForm } from "@/components/attendance-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Student Attendance</h1>
          <p className="text-muted-foreground text-sm">Submit your daily attendance with location verification</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mark Your Attendance</CardTitle>
            <CardDescription>Please fill in your details and verify your location to submit attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceForm />
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">Need help? Contact your administrator</p>
        </div>
      </div>
    </div>
  )
}
