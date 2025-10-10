export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Test Availability Page</h1>
        <p className="text-gray-600 mt-2">If you see this, the routing works!</p>
        <a 
          href="/admin/dashboard" 
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}
