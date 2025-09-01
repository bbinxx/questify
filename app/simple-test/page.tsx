export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Simple Tailwind Test
        </h1>
        <p className="text-gray-600 mb-4">
          This is a simple test to verify Tailwind CSS is working.
        </p>
        <div className="space-y-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Red alert box
          </div>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Green success box
          </div>
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            Blue info box
          </div>
        </div>
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Test Button
        </button>
      </div>
    </div>
  )
}
