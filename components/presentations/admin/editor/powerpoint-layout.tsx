"use client"

import { ReactNode } from "react"

export function PowerPointLayout({ 
  slideList, 
  slideEditor, 
  questionTypes 
}: { 
  slideList: ReactNode, 
  slideEditor: ReactNode, 
  questionTypes: ReactNode 
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/5 overflow-y-auto bg-white p-4">
        {slideList}
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        {slideEditor}
      </div>
      <div className="w-1/5 bg-white p-4">
        {questionTypes}
      </div>
    </div>
  )
}
