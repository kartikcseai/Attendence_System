"use client"

import type { AttendanceRecord } from "@/types/attendance"
import { format } from "date-fns"

export function exportToExcel(data: AttendanceRecord[], filename?: string) {
  // Create workbook data
  const worksheetData = [
    [
      "Student ID",
      "Student Name",
      "Section",
      "Date",
      "Time Submitted",
      "Location Verified",
      "Latitude",
      "Longitude",
      "Accuracy (m)",
      "Device Fingerprint",
      "Submission Time",
    ],
    ...data.map((record) => [
      record.student_id,
      record.student_name,
      record.section,
      record.date,
      format(new Date(record.time_submitted), "HH:mm:ss"),
      record.is_location_verified ? "Yes" : "No",
      record.latitude || "N/A",
      record.longitude || "N/A",
      record.location_accuracy?.toFixed(0) || "N/A",
      (record as any).device_fingerprint || "N/A",
      format(new Date(record.created_at), "PPP 'at' p"),
    ]),
  ]

  // Convert to CSV format (Excel can open CSV files)
  const csvContent = worksheetData
    .map((row) => row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(","))
    .join("\n")

  // Create and download file with .xlsx extension for better Excel compatibility
  const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename || `attendance-${new Date().toISOString().split("T")[0]}.xlsx`
  a.click()
  window.URL.revokeObjectURL(url)
}

export function exportToCSV(data: AttendanceRecord[], filename?: string) {
  const csvContent = [
    [
      "Student ID",
      "Student Name",
      "Section",
      "Date",
      "Time Submitted",
      "Location Verified",
      "Latitude",
      "Longitude",
      "Accuracy (m)",
    ].join(","),
    ...data.map((record) =>
      [
        record.student_id,
        `"${record.student_name}"`, // Wrap in quotes to handle commas in names
        record.section,
        record.date,
        format(new Date(record.time_submitted), "HH:mm:ss"),
        record.is_location_verified ? "Yes" : "No",
        record.latitude || "N/A",
        record.longitude || "N/A",
        record.location_accuracy?.toFixed(0) || "N/A",
      ].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename || `attendance-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export function exportToJSON(data: AttendanceRecord[], filename?: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename || `attendance-${new Date().toISOString().split("T")[0]}.json`
  a.click()
  window.URL.revokeObjectURL(url)
}

export function generateAttendanceReport(data: AttendanceRecord[]): string {
  const totalRecords = data.length
  const verifiedLocations = data.filter((r) => r.is_location_verified).length
  const sections = [...new Set(data.map((r) => r.section))].sort()
  const dates = [...new Set(data.map((r) => r.date))].sort()

  const sectionStats = sections.map((section) => {
    const sectionData = data.filter((r) => r.section === section)
    return {
      section,
      count: sectionData.length,
      verified: sectionData.filter((r) => r.is_location_verified).length,
    }
  })

  return `
ATTENDANCE REPORT
Generated: ${format(new Date(), "PPP 'at' p")}

SUMMARY
=======
Total Records: ${totalRecords}
Verified Locations: ${verifiedLocations} (${((verifiedLocations / totalRecords) * 100).toFixed(1)}%)
Date Range: ${dates[0]} to ${dates[dates.length - 1]}
Active Sections: ${sections.length}

SECTION BREAKDOWN
================
${sectionStats.map((stat) => `${stat.section}: ${stat.count} records (${stat.verified} verified)`).join("\n")}

DETAILED RECORDS
===============
${data
  .map(
    (record) =>
      `${record.date} | ${record.student_id} | ${record.student_name} | ${record.section} | ${record.is_location_verified ? "VERIFIED" : "UNVERIFIED"}`,
  )
  .join("\n")}
  `.trim()
}
