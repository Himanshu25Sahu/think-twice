"use client"
import Sidebar from "./Sidebar"

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}