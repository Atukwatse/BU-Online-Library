import { useState } from 'react'
import Toast from '../components/Toast'
import RatingBanner from '../components/RatingBanner'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, Upload } from 'lucide-react'
import { servicesAPI } from '../services/api'

const ServiceRequest = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const type = searchParams.get('type') || 'general'
  const { user } = useAuth()

  const [submitted, setSubmitted] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Always show the rating banner when visiting a service page
  const [showRating, setShowRating] = useState(true)

  const titles = {
    printing: 'Printing Services',
    interlibrary: 'Inter-Library Loan',
    studyroom: 'Study Room Booking',
    research: 'Research Support',
    general: 'Library Service Request',
  }
  const title = titles[type] || titles.general

  const [formData, setFormData] = useState({
    name: user?.FullName || '',
    email: user?.Email || '',
    details: '',
    file: null,
    startTime: '',
    endTime: '',
    room: '',
    bookTitle: '',
    bookAuthor: '',
  })

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = new FormData()
      data.append('UserName', formData.name)
      data.append('UserEmail', formData.email)
      data.append('Type', type)
      data.append('Details', formData.details)
      if (type === 'studyroom') {
        data.append('Room', formData.room)
        data.append('StartTime', formData.startTime)
        data.append('EndTime', formData.endTime)
      }
      if (type === 'interlibrary') {
        data.append('BookTitle', formData.bookTitle)
        data.append('BookAuthor', formData.bookAuthor)
      }
      if (formData.file) {
        data.append('file', formData.file)
      }
      await servicesAPI.createRequest(data)
      setSubmitted(true)
      setToastMsg('Your request has been submitted. You will be notified when approved.')
      setTimeout(() => navigate('/user/dashboard'), 3000)
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-xl shadow-lg">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-3xl font-extrabold text-gray-900">Request Submitted!</h2>
          <p className="text-gray-600">
            Your {title.toLowerCase()} request has been received. You will be redirected to your
            dashboard shortly.
          </p>
        </div>
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        {/* ── Rating Banner (appears ON TOP of service form) ── */}
        {showRating && (
          <RatingBanner
            serviceName={title}
            onDone={(saved) => {
              // Mark rated so it doesn't reappear this session
              sessionStorage.setItem(`rated_${type}`, 'true')
              setShowRating(false)
            }}
          />
        )}

        {/* ── Service Form Card ── */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-primary px-6 py-8 text-center text-white">
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="mt-2 opacity-80">Please fill out the details below.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-10 space-y-6">
            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                />
              </div>
            </div>

            {/* Study Room fields */}
            {type === 'studyroom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Study Room A"
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inter-Library Loan fields */}
            {type === 'interlibrary' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    📚 Please provide the book details you need from another library.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Book Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Introduction to Algorithms"
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Book Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bookAuthor"
                    value={formData.bookAuthor}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Thomas H. Cormen"
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* Printing fields */}
            {type === 'printing' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">🖨️ Printing Charges</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• <strong>Black &amp; White:</strong> UGX 200 per page</li>
                    <li>• <strong>Colour:</strong> UGX 500 per page</li>
                    <li>• <strong>Binding:</strong> UGX 2,000 per document</li>
                  </ul>
                  <p className="text-xs text-amber-600 mt-3 font-medium">
                    💡 Payment is made at the library on the day you pick up your hard copies.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Document to Print
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOCX, PNG up to 10MB</p>
                      {formData.file && (
                        <p className="text-sm font-semibold text-green-600 mt-2">
                          Selected: {formData.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Details / Notes
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows="4"
                className="input mt-1"
                placeholder="Provide any specific instructions, quantities, dates, or details for your request..."
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full md:w-auto disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  )
}

export default ServiceRequest
