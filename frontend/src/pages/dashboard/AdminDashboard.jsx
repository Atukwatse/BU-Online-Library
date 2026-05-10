import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI, adminAPI, borrowingAPI, servicesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Users, BookOpen, FileText, Calendar, TrendingUp, Bell, CheckCircle, XCircle, Printer, MessageSquare } from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [serviceRequests, setServiceRequests] = useState([])
  const [newUsers, setNewUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, requestsRes, usersRes, servicesRes] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => ({ data: { data: {} } })),
        borrowingAPI.getRequests().catch(() => ({ data: { data: [] } })),
        adminAPI.getUsers().catch(() => ({ data: { data: [] } })),
        servicesAPI.getAllRequests().catch(() => ({ data: { data: [] } })),
      ])
      
      setStats(statsRes.data.data)
      const allRequests = requestsRes.data.data || []
      setRecentRequests(allRequests)
      const users = usersRes.data.data || []
      const filteredUsers = users.filter(user => user.Role !== 'Staff')
      setAllUsers(filteredUsers)
      setNewUsers(filteredUsers.slice(-3).reverse())
      setServiceRequests(servicesRes.data.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveBorrow = async (id) => {
    try {
      await borrowingAPI.approveRequest(id)
      fetchData()
    } catch (err) { alert('Failed to approve') }
  }

  const handleRejectBorrow = async (id) => {
    try {
      await borrowingAPI.rejectRequest(id)
      fetchData()
    } catch (err) { alert('Failed to reject') }
  }

  const handleServiceStatus = async (id, status) => {
    try {
      await servicesAPI.updateStatus(id, status)
      fetchData()
    } catch (err) { alert('Failed to update status') }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pendingBorrows = recentRequests.filter(r => r.Status === 'Pending')
  const pendingServices = serviceRequests.filter(s => s.Status === 'Pending')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-primary">
              <Bell size={24} />
              {(pendingBorrows.length + pendingServices.length) > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {pendingBorrows.length + pendingServices.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.FullName?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user?.FullName || 'Admin'}</p>
                <p className="text-sm text-gray-500">{user?.Role || 'Administrator'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-green-600 mt-2">
                  <TrendingUp size={16} className="inline mr-1" />{stats?.activeUsers || 0} active
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="text-primary" size={24} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Books</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalBooks || 0}</p>
                <p className="text-sm text-gray-600 mt-2">Total catalog</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="text-primary" size={24} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600">{pendingBorrows.length + pendingServices.length}</p>
                <p className="text-sm text-gray-600 mt-2">Requires attention</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Events</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalEvents || 0}</p>
                <p className="text-sm text-gray-600 mt-2">Total hosted</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="text-primary" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-primary mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigate('/resources')} className="btn btn-primary">Add Book</button>
            <button onClick={() => navigate('/events')} className="btn btn-secondary">Create Event</button>
            <button onClick={() => setShowUsersModal(true)} className="btn btn-secondary">Manage Users</button>
          </div>
        </div>

        {/* Tabs for requests */}
        <div className="flex gap-4 mb-6 border-b">
          {[
            { id: 'overview', label: 'Borrow Requests', count: pendingBorrows.length },
            { id: 'services', label: 'Service Requests', count: pendingServices.length },
            { id: 'users', label: 'Recent Users' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* BORROW REQUESTS TAB */}
        {activeTab === 'overview' && (
          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">All Borrow Requests</h2>
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No borrow requests.</p>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.RequestID} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{request.BookTitle}</p>
                        <p className="text-sm text-gray-600">By: {request.UserName} ({request.UserEmail || 'N/A'})</p>
                        <p className="text-xs text-gray-500">{new Date(request.RequestDate).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.Status === 'Pending' ? (
                        <>
                          <button onClick={() => handleApproveBorrow(request.RequestID)} className="p-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-700" title="Approve">
                            <CheckCircle size={20} />
                          </button>
                          <button onClick={() => handleRejectBorrow(request.RequestID)} className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700" title="Reject">
                            <XCircle size={20} />
                          </button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.Status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>{request.Status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SERVICE REQUESTS TAB */}
        {activeTab === 'services' && (
          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">All Service Requests</h2>
            <p className="text-sm text-gray-500 mb-4">Printing, Study Rooms, Inter-Library Loans, Research Support, Staff Messages</p>
            {serviceRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No service requests.</p>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((sr) => (
                  <div key={sr.ID} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          sr.Type === 'printing' ? 'bg-blue-500' :
                          sr.Type === 'Staff Message' ? 'bg-purple-500' :
                          'bg-primary'
                        }`}>
                          {sr.Type === 'printing' ? <Printer size={20} /> :
                           sr.Type === 'Staff Message' ? <MessageSquare size={20} /> :
                           <FileText size={20} />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 capitalize">{sr.Type}</p>
                          <p className="text-sm text-gray-600 mt-1">{sr.Details}</p>
                          <p className="text-xs text-gray-500 mt-1">From: {sr.UserName} ({sr.UserEmail})</p>
                          <p className="text-xs text-gray-400">{new Date(sr.CreatedAt).toLocaleString()}</p>
                          {sr.FileURL && (
                            <a href={sr.FileURL} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 inline-block">📎 View Uploaded File</a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {sr.Status === 'Pending' ? (
                          <>
                            <button onClick={() => handleServiceStatus(sr.ID, 'Approved')} className="p-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-700" title="Approve">
                              <CheckCircle size={20} />
                            </button>
                            <button onClick={() => handleServiceStatus(sr.ID, 'Rejected')} className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700" title="Reject">
                              <XCircle size={20} />
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            sr.Status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>{sr.Status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">Recent Users</h2>
            <div className="space-y-4">
              {newUsers.length === 0 ? (
                <p className="text-gray-500">No users found.</p>
              ) : (
                newUsers.map((u) => (
                  <div key={u.UserID} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {u.FullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{u.FullName}</p>
                      <p className="text-sm text-gray-600">{u.Email}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{u.Role}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manage Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Manage Users</h2>
              <button onClick={() => setShowUsersModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.filter(u => u.Role !== 'Staff').map((u) => (
                    <tr key={u.UserID}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                            {u.FullName?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u.FullName}</div>
                            <div className="text-sm text-gray-500">{u.Email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.Role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.Status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={async () => {
                            const newStatus = u.Status === 'Inactive' ? 'Active' : 'Inactive';
                            await adminAPI.updateUserStatus(u.UserID, newStatus);
                            fetchData();
                          }}
                          className={`text-sm font-semibold ${u.Status === 'Inactive' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                        >
                          {u.Status === 'Inactive' ? 'Activate' : 'Deactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
