import { useState, useEffect } from 'react'
import { borrowingAPI, servicesAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle, FileText, Printer, Home, Search, ArrowRight } from 'lucide-react'

const statusBadge = (status) => {
  const styles = {
    Pending:  'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Borrowed: 'bg-blue-100 text-blue-800',
    Returned: 'bg-gray-100 text-gray-700',
  }
  return `px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`
}

const UserDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [borrowings, setBorrowings] = useState([])
  const [serviceRequests, setServiceRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [borrowRes, serviceRes] = await Promise.allSettled([
        borrowingAPI.getMyRequests(),
        servicesAPI.getMyRequests(),
      ])
      setBorrowings(borrowRes.status === 'fulfilled' ? borrowRes.value.data.data || [] : [])
      setServiceRequests(serviceRes.status === 'fulfilled' ? serviceRes.value.data.data || [] : [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pendingBorrows = borrowings.filter(b => b.Status === 'Pending').length
  const approvedBorrows = borrowings.filter(b => b.Status === 'Approved').length
  const pendingServices = serviceRequests.filter(s => s.Status === 'Pending').length
  const approvedServices = serviceRequests.filter(s => s.Status === 'Approved').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">My Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.FullName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user?.FullName || 'Student'}</p>
                <p className="text-sm text-gray-500">{user?.Email}</p>
              </div>
              <button onClick={logout} className="text-red-600 hover:text-red-700 text-sm ml-2">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'borrowings', label: 'Book Requests' },
            { id: 'services', label: 'My Service Requests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="text-yellow-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-primary">{pendingBorrows}</p>
                <p className="text-sm text-gray-600">Pending Borrows</p>
              </div>
              <div className="card text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-primary">{approvedBorrows}</p>
                <p className="text-sm text-gray-600">Approved Borrows</p>
              </div>
              <div className="card text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="text-yellow-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-primary">{pendingServices}</p>
                <p className="text-sm text-gray-600">Pending Services</p>
              </div>
              <div className="card text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <p className="text-2xl font-bold text-primary">{approvedServices}</p>
                <p className="text-sm text-gray-600">Approved Services</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-primary mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => navigate('/resources')} className="btn btn-primary flex items-center justify-center gap-2">
                  <BookOpen size={18} /> Browse &amp; Borrow E-Books
                </button>
                <button onClick={() => navigate('/services?type=printing')} className="btn btn-secondary flex items-center justify-center gap-2">
                  <Printer size={18} /> Request Printing
                </button>
                <button onClick={() => navigate('/services?type=studyroom')} className="btn btn-secondary flex items-center justify-center gap-2">
                  <Home size={18} /> Book Study Room
                </button>
              </div>
            </div>

            {/* Recent Borrow Requests */}
            <div className="card mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary">Recent Book Requests</h2>
                <button onClick={() => setActiveTab('borrowings')} className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </button>
              </div>
              {borrowings.slice(0, 3).length === 0 ? (
                <p className="text-gray-500 text-center py-6">No book requests yet. <button onClick={() => navigate('/resources')} className="text-primary underline">Browse Books</button></p>
              ) : (
                <div className="space-y-3">
                  {borrowings.slice(0, 3).map((b) => (
                    <div key={b.RequestID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                          <BookOpen className="text-primary" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{b.BookTitle}</p>
                          <p className="text-xs text-gray-500">{new Date(b.RequestDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={statusBadge(b.Status)}>{b.Status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Service Requests */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary">Recent Service Requests</h2>
                <button onClick={() => setActiveTab('services')} className="text-sm text-primary hover:underline flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </button>
              </div>
              {serviceRequests.slice(0, 3).length === 0 ? (
                <p className="text-gray-500 text-center py-6">No service requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {serviceRequests.slice(0, 3).map((s) => (
                    <div key={s.ID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileText className="text-primary" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{s.Type}</p>
                          <p className="text-xs text-gray-500">{new Date(s.CreatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={statusBadge(s.Status)}>{s.Status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOOK REQUESTS TAB */}
        {activeTab === 'borrowings' && (
          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">My Book Borrow Requests</h2>
            {borrowings.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No book requests yet.</p>
                <button onClick={() => navigate('/resources')} className="btn btn-primary mt-4">Browse E-Books</button>
              </div>
            ) : (
              <div className="space-y-4">
                {borrowings.map((b) => (
                  <div key={b.RequestID} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{b.BookTitle}</p>
                        <p className="text-sm text-gray-500">Requested: {new Date(b.RequestDate).toLocaleDateString()}</p>
                        {b.Status === 'Approved' && (
                          <p className="text-xs text-green-600 font-medium mt-1">✅ Your request has been approved! You may collect the book from the library.</p>
                        )}
                        {b.Status === 'Rejected' && (
                          <p className="text-xs text-red-600 font-medium mt-1">❌ Your request was not approved this time.</p>
                        )}
                      </div>
                    </div>
                    <span className={statusBadge(b.Status)}>{b.Status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SERVICE REQUESTS TAB */}
        {activeTab === 'services' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">My Service Requests</h2>
              <button onClick={() => navigate('/services')} className="btn btn-primary text-sm flex items-center gap-2">
                <FileText size={16} /> New Request
              </button>
            </div>
            {serviceRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No service requests yet.</p>
                <button onClick={() => navigate('/services')} className="btn btn-primary mt-4">Request a Service</button>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((s) => (
                  <div key={s.ID} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{s.Type}</p>
                        <p className="text-sm text-gray-600 mt-1">{s.Details}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(s.CreatedAt).toLocaleString()}</p>
                        {s.Status === 'Approved' && (
                          <p className="text-sm text-green-600 font-medium mt-2">✅ Approved! The library will contact you for next steps.</p>
                        )}
                        {s.Status === 'Rejected' && (
                          <p className="text-sm text-red-600 font-medium mt-2">❌ This request was not approved. Please contact the library.</p>
                        )}
                      </div>
                      <span className={statusBadge(s.Status)}>{s.Status}</span>
                    </div>
                    {s.FileURL && (
                      <a href={s.FileURL} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 inline-block">View Uploaded File</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
