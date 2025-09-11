"use client"
import { useState } from "react"
import Link from "next/link"

export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return ( 
    <nav className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">JC</span>
          </div>
          <span className="text-white font-semibold text-lg">Think Twice</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search decisions, users..."
              className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              suppressHydrationWarning // Suppress hydration warning for this input
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* User Menu */}
        {/* (Add user menu logic here if needed) */}
      </div>
    </nav>
  )
}