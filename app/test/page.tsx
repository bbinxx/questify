export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            🎨 Tailwind CSS Test
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Blue Card
              </h3>
              <p className="text-blue-700">
                This card should have a blue background and border.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Green Card
              </h3>
              <p className="text-green-700">
                This card should have a green background and border.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Purple Card
              </h3>
              <p className="text-purple-700">
                This card should have a purple background and border.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Primary Button
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Success Button
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Danger Button
            </button>
          </div>

          {/* Status */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Tailwind CSS Status:</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">✅ Working!</span>
            </div>
            <p className="text-gray-600 mt-2">
              If you can see styled cards, buttons, and colors, Tailwind CSS is working correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
