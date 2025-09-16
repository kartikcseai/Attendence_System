import { AdminDashboard } from "@/components/admin-dashboard"
import { createClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  const supabase = await createClient()

  // Get attendance data for the dashboard
  const { data: attendanceData, error } = await supabase
    .from("attendance")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching attendance data:", error)
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Dashboard</h1>
            <p className="text-muted-foreground">Unable to fetch attendance data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage student attendance records</p>
        </div>

        <AdminDashboard attendanceData={attendanceData || []} />
      </div>
    </div>
  )
}
