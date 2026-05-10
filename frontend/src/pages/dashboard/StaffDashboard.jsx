import React from 'react'

function StaffDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Staff Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Library Management</h2>
          <p className="text-gray-600">Manage books, catalogs, and inventory</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Member Services</h2>
          <p className="text-gray-600">Assist library members and handle requests</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Reports</h2>
          <p className="text-gray-600">View library statistics and reports</p>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
