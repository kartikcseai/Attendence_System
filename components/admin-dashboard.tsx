"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, MapPin, Calendar, Download, Search, Filter, FileText, FileJson, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { exportToCSV, exportToJSON, exportToExcel, generateAttendanceReport } from "@/components/download-utils"
import type { AttendanceRecord } from "@/types/attendance"

interface AdminDashboardProps {
  attendanceData: AttendanceRecord[]
}

export function AdminDashboard({ attendanceData }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sectionFilter, setSectionFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const todayRecords = attendanceData.filter((record) => record.date === today)
    const verifiedLocations = attendanceData.filter((record) => record.is_location_verified).length
    const sections = [...new Set(attendanceData.map((record) => record.section))]

    return {
      totalToday: todayRecords.length,
      totalAll: attendanceData.length,
      verifiedLocations,
      sections: sections.length,
      sectionsList: sections.sort(),
    }
  }, [attendanceData])

  // Filter attendance data
  const filteredData = useMemo(() => {
    return attendanceData.filter((record) => {
      const matchesSearch =
        record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSection = sectionFilter === "all" || record.section === sectionFilter

      const matchesDate = dateFilter === "all" || record.date === dateFilter

      return matchesSearch && matchesSection && matchesDate
    })
  }, [attendanceData, searchTerm, sectionFilter, dateFilter])

  // Get unique dates for date filter
  const availableDates = useMemo(() => {
    const dates = [...new Set(attendanceData.map((record) => record.date))]
    return dates.sort().reverse()
  }, [attendanceData])

  const handleExport = (format: "csv" | "json" | "excel" | "report") => {
    const timestamp = new Date().toISOString().split("T")[0]
    const baseFilename = `attendance-${timestamp}`

    switch (format) {
      case "csv":
        exportToCSV(filteredData, `${baseFilename}.csv`)
        break
      case "json":
        exportToJSON(filteredData, `${baseFilename}.json`)
        break
      case "excel":
        exportToExcel(filteredData, `${baseFilename}.xlsx`)
        break
      case "report":
        const reportContent = generateAttendanceReport(filteredData)
        const blob = new Blob([reportContent], { type: "text/plain" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${baseFilename}-report.txt`
        a.click()
        window.URL.revokeObjectURL(url)
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground">Students marked present today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAll}</div>
            <p className="text-xs text-muted-foreground">All attendance records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedLocations}</div>
            <p className="text-xs text-muted-foreground">GPS verified submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sections</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sections}</div>
            <p className="text-xs text-muted-foreground">Different sections</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>View and manage all student attendance submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {stats.sectionsList.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {availableDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {format(new Date(date), "MMM dd, yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("report")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Attendance Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.student_id}</TableCell>
                      <TableCell>{record.student_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.section}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{format(new Date(record.time_submitted), "HH:mm:ss")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {record.is_location_verified ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <MapPin className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <MapPin className="mr-1 h-3 w-3" />
                              Unverified
                            </Badge>
                          )}
                          {record.location_accuracy && (
                            <span className="text-xs text-muted-foreground">
                              ±{record.location_accuracy.toFixed(0)}m
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredData.length} of {attendanceData.length} records
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
