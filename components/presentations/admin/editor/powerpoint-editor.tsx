"use client"

// import { SlideList } from "./slide-list" // TODO: Create slide-list component
import { SlideEditor } from "../slide-editor"

export function PowerPointEditor() {
  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/5 overflow-y-auto bg-white p-4">
          {/* <SlideList /> */}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <SlideEditor />
        </div>
        <div className="w-1/5 bg-white p-4">
          <h2 className="text-lg font-bold">Question Types</h2>
          {/* Add question types here */}
        </div>
      </div>
    </div>
  )
}
