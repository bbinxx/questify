"use client"
export const dynamic = "force-dynamic";
import Link from "next/link"
import { JoinForm } from "@/components/presentations/join-form"

export default function AltHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-800 text-balance">Question Presentations</h1>
          <p className="text-gray-600">Join a presentation or manage your own</p>
        </div>
        <JoinForm />
        <div className="mt-6 text-center">
          <Link href="/admin" className="font-medium text-blue-600 hover:text-blue-700">
            Admin Panel →
          </Link>
        </div>
      </div>
    </div>
  )
}
