"use client"

import Link from "next/link"
import { PresentationList } from "@/components/presentations/presentation-list"

export default function AdminListPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            ← Back to Home
          </Link>
        </div>
        <PresentationList />
      </div>
    </div>
  )
}
