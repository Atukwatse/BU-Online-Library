import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI, adminAPI, borrowingAPI, printingAPI, researchAPI, studyRoomAPI, allRequestsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Users, BookOpen, FileText, Calendar, TrendingUp, Bell, Printer, AlertCircle } from 'lucide-react'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [borrowingRequests, setBorrowingRequests] = useState([])
  const [printingRequests, setPrintingRequests] = useState([])
  const [researchRequests, setResearchRequests] = useState([])
  const [studyRoomRequests, setStudyRoomRequests] = useState([])
  const [newUsers, setNewUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUsersModal, setShowUsersModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch all request types and stats concurrently
      const [statsRes, allRequestsRes, usersRes] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => ({ data: { data: {} } })),
        allRequestsAPI.getAllPendingRequests(),
        adminAPI.getUsers().catch(() => ({ data: { data: [] } }))
      ])
      
      setStats(statsRes.data.data)
      setBorrowingRequests(allRequestsRes.borrowing || [])
      setPrintingRequests(allRequestsRes.printing || [])
      setResearchRequests(allRequestsRes.research || [])
      setStudyRoomRequests(allRequestsRes.studyRoom || [])
      
      const users = usersRes.data.data || []
      setAllUsers(users)
      setNewUsers(users.slice(-3).reverse())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalPendingRequests = () => {
    return borrowingRequests.length + printingRequests.length + researchRequests.length + studyRoomRequests.length
  }

  const handleApproveRequest = async (type, id) => {
    try {
      if (type === 'borrowing') {
        await borrowingAPI.approveRequest(id, {})
      } else if (type === 'printing') {
        await printingAPI.updateStatus(id, 'Approved')
      } else if (type === 'research') {
        await researchAPI.updateStatus(id, 'Approved', '')
      } else if (type === 'studyRoom') {
        await studyRoomAPI.updateStatus(id, 'Approved')
      }
      fetchData()
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleRejectRequest = async (type, id) => {
    try {
      if (type === 'borrowing') {
        await borrowingAPI.rejectRequest(id, {})
      } else if (type === 'printing') {
        await printingAPI.updateStatus(id, 'Rejected')
      } else if (type === 'research') {
        await researchAPI.updateStatus(id, 'Rejected', '')
      } else if (type === 'studyRoom') {
        await studyRoomAPI.updateStatus(id, 'Rejected')
      }
      fetchData()
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:text-primary">
              <Bell size={24} />
              {getTotalPendingRequests() > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {getTotalPendingRequests()}
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
                <p className="text-3xl font-bold text-primary">
                  {stats?.totalUsers || 0}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  <TrendingUp size={16} className="inline mr-1" />
                  {stats?.activeUsers || 0} active
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
                <p className="text-3xl font-bold text-primary">
                  {stats?.totalBooks || 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Total catalog
                </p>
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
                <p className="text-3xl font-bold text-primary">
                  {getTotalPendingRequests()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Requires attention
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <AlertCircle className="text-primary" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Events</p>
                <p className="text-3xl font-bold text-primary">
                  {stats?.totalEvents || 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Total hosted
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="text-primary" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b overflow-x-auto">
          {['overview', 'borrowing', 'printing', 'research', 'studyroom', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {tab === 'studyroom' ? 'Study Room' : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((u) => (
                    <tr key={u.UserID}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
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
