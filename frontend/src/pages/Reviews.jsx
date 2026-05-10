import { useState, useEffect } from 'react'
import { Star, Trash2, MessageSquare } from 'lucide-react'
import { reviewsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'

const serviceColors = {
  // New short names (from RatingBanner)
  'Printing Services': 'from-orange-500 to-amber-500',
  'Inter-Library Loan': 'from-blue-500 to-cyan-500',
  'Study Room Booking': 'from-purple-500 to-violet-500',
  'Research Support': 'from-green-500 to-emerald-500',
  'Library Service Request': 'from-indigo-500 to-blue-600',
  // Legacy names (in case old reviews exist)
  'Printing Services Request': 'from-orange-500 to-amber-500',
  'Inter-Library Loan Request': 'from-blue-500 to-cyan-500',
  'Research Support Inquiry': 'from-green-500 to-emerald-500',
  'Book Borrowing': 'from-red-500 to-rose-500',
}

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={16}
        fill={n <= rating ? '#FBBF24' : 'none'}
        className={n <= rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ))}
  </div>
)

const Reviews = () => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [filterService, setFilterService] = useState('All')

  const isAdmin = user?.Role?.toLowerCase() === 'admin'

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await reviewsAPI.getAll()
      setReviews(res.data?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await reviewsAPI.remove(id)
      setToast('Review deleted successfully.')
      setReviews((prev) => prev.filter((r) => r.ReviewID !== id))
    } catch (e) {
      alert('Failed to delete review.')
    }
  }

  // Average rating
  const avg =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.Rating, 0) / reviews.length).toFixed(1)
      : '—'

  // Unique services for filter
  const services = ['All', ...new Set(reviews.map((r) => r.Service))]

  const filtered =
    filterService === 'All' ? reviews : reviews.filter((r) => r.Service === filterService)

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-20 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star size={32} fill="#FBBF24" className="text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">Ratings & Reviews</h1>
            <Star size={32} fill="#FBBF24" className="text-yellow-400" />
          </div>
          <p className="text-white/60 text-lg mb-6">
            Real feedback from our library community
          </p>
          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-yellow-400">{avg}</p>
              <p className="text-white/50 text-sm mt-1">Average Rating</p>
              {reviews.length > 0 && <StarDisplay rating={Math.round(parseFloat(avg))} />}
            </div>
            <div className="w-px bg-white/10 hidden md:block" />
            <div className="text-center">
              <p className="text-4xl font-extrabold text-white">{reviews.length}</p>
              <p className="text-white/50 text-sm mt-1">Total Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 mb-8 flex flex-wrap gap-2 justify-center">
        {services.map((s) => (
          <button
            key={s}
            onClick={() => setFilterService(s)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={
              filterService === s
                ? { background: '#f59e0b', color: '#0f172a' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center text-white/50 py-20">
            <div className="w-12 h-12 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
            Loading reviews...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-lg">No reviews yet. Be the first to rate a service!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((review) => {
              const gradient = serviceColors[review.Service] || 'from-slate-500 to-slate-600'
              return (
                <div
                  key={review.ReviewID}
                  className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {/* Service badge */}
                  <div className={`bg-gradient-to-r ${gradient} px-5 py-3 flex items-center justify-between`}>
                    <span className="text-white text-sm font-semibold truncate">{review.Service}</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(review.ReviewID)}
                        title="Delete review"
                        className="ml-2 text-white/70 hover:text-white transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Stars */}
                    <StarDisplay rating={review.Rating} />

                    {/* Comment */}
                    {review.Comment && (
                      <p className="mt-3 text-white/75 text-sm leading-relaxed line-clamp-4">
                        "{review.Comment}"
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div>
                        <p className="text-white font-semibold text-sm">{review.UserName || 'Anonymous'}</p>
                        {review.UserEmail && (
                          <p className="text-white/40 text-xs">{review.UserEmail}</p>
                        )}
                      </div>
                      <p className="text-white/30 text-xs">
                        {review.CreatedAt ? new Date(review.CreatedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

export default Reviews
