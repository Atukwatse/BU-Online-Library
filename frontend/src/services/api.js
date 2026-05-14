import axios from 'axios'

const API_BASE_URL = 'https://bu-online-library.onrender.com/api'
// const API_BASE_URL = "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
}

export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  search: (params) => api.get('/search/books', { params }),
  getFeatured: () => api.get('/books/featured'),
  getTrending: () => api.get('/books/trending'),
  getRecommended: () => api.get('/books/recommended'),
  addToFavorites: (id) => api.post(`/books/${id}/favorite`),
  removeFromFavorites: (id) => api.delete(`/books/${id}/favorite`),
  rateBook: (id, rating) => api.post(`/books/${id}/rating`, { rating }),
  getReviews: (id) => api.get(`/books/${id}/reviews`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
}

export const borrowingAPI = {
  createRequest: (data) => api.post('/borrowing/requests', data),
  getMyRequests: () => api.get('/borrowing/my-requests'),
  getRequests: (params) => api.get('/borrowing/requests', { params }),
  approveRequest: (id, approvalData) => api.put(`/borrowing/requests/${id}/approve`, approvalData),
  rejectRequest: (id, rejectData) => api.put(`/borrowing/requests/${id}/reject`, rejectData),
  returnBook: (id) => api.put(`/borrowing/${id}/return`),
  getHistory: () => api.get('/borrowing/history'),
  getActive: () => api.get('/borrowing/active'),
  getPendingRequests: () => api.get('/borrowing/requests?status=Pending'),
}

export const printingAPI = {
  createRequest: (formData) => api.post('/printing/requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyRequests: () => api.get('/printing/my-requests'),
  getRequests: (params) => api.get('/printing/requests', { params }),
  updateStatus: (id, status) => api.put(`/printing/requests/${id}`, { status }),
  calculateCost: (data) => api.post('/printing/calculate-cost', data),
  getPending: () => api.get('/printing/pending'),
  delete: (id) => api.delete(`/printing/requests/${id}`),
}

export const researchAPI = {
  createRequest: (formData) => api.post('/research/requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyRequests: () => api.get('/research/my-requests'),
  getRequests: (params) => api.get('/research/requests', { params }),
  updateStatus: (id, status, response) => api.put(`/research/requests/${id}`, { status, response }),
  getPending: () => api.get('/research/pending'),
}

export const studyRoomAPI = {
  getAvailable: (params) => api.get('/study-rooms/available', { params }),
  bookRoom: (data) => api.post('/study-rooms/book', data),
  getMyBookings: () => api.get('/study-rooms/my-bookings'),
  getRequests: (params) => api.get('/study-rooms/requests', { params }),
  updateStatus: (id, status) => api.put(`/study-rooms/requests/${id}`, { status }),
  cancelBooking: (id) => api.delete(`/study-rooms/bookings/${id}`),
}

export const servicesAPI = {
  createRequest: (formData) => api.post('/services/requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllRequests: () => api.get('/services/requests'),
  getMyRequests: () => api.get('/services/my-requests'),
  updateStatus: (id, status) => api.put(`/services/requests/${id}/status`, { status }),
  getPendingRequests: () => api.get('/services/requests?status=Pending'),
}

export const allRequestsAPI = {
  // Get all types of pending requests for admin dashboard
  getAllPendingRequests: async () => {
    try {
      const [borrowing, printing, research, studyRoom] = await Promise.all([
        borrowingAPI.getPendingRequests().catch(() => ({ data: { data: [] } })),
        printingAPI.getPending().catch(() => ({ data: { data: [] } })),
        researchAPI.getPending().catch(() => ({ data: { data: [] } })),
        studyRoomAPI.getRequests({ status: 'Pending' }).catch(() => ({ data: { data: [] } })),
      ])
      
      return {
        borrowing: borrowing.data.data || [],
        printing: printing.data.data || [],
        research: research.data.data || [],
        studyRoom: studyRoom.data.data || [],
      }
    } catch (error) {
      console.error('Error fetching all pending requests:', error)
      return {
        borrowing: [],
        printing: [],
        research: [],
        studyRoom: [],
      }
    }
  },
  
  // Get all user requests across all types
  getAllUserRequests: async () => {
    try {
      const [borrowing, printing, research, studyRoom] = await Promise.all([
        borrowingAPI.getMyRequests().catch(() => ({ data: { data: [] } })),
        printingAPI.getMyRequests().catch(() => ({ data: { data: [] } })),
        researchAPI.getMyRequests().catch(() => ({ data: { data: [] } })),
        studyRoomAPI.getMyBookings().catch(() => ({ data: { data: [] } })),
      ])
      
      return {
        borrowing: borrowing.data.data || [],
        printing: printing.data.data || [],
        research: research.data.data || [],
        studyRoom: studyRoom.data.data || [],
      }
    } catch (error) {
      console.error('Error fetching all user requests:', error)
      return {
        borrowing: [],
        printing: [],
        research: [],
        studyRoom: [],
      }
    }
  },
}

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export const eventsAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  register: (id) => api.post(`/events/${id}/register`),
  cancelRegistration: (id) => api.delete(`/events/${id}/cancel`),
  getMyRegistrations: () => api.get('/events/my-registrations'),
}

export const reviewsAPI = {
  getAll: () => api.get('/reviews'),
  create: (data) => api.post('/reviews', data),
  remove: (id) => api.delete(`/reviews/${id}`),
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
}


export const analyticsAPI = {
  getDashboard: () => api.get('/admin/stats'),
  getUserStats: () => api.get('/analytics/users'),
  getBookStats: () => api.get('/analytics/books'),
  getBorrowingStats: () => api.get('/analytics/borrowings'),
  getEventStats: () => api.get('/analytics/events'),
}

export default api
