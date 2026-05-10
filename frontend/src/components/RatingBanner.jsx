import { useState } from 'react'
import { Star, X, CheckCircle } from 'lucide-react'

/**
 * RatingBanner - renders inline inside the service page.
 * Shows a rating card on TOP of the service form.
 * Props:
 *   serviceName  - string label of the service
 *   onDone(saved) - called when user submits (saved=true) or skips (saved=false)
 */
const RatingBanner = ({ serviceName, onDone }) => {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [userName, setUserName] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  const handleSubmit = async () => {
    if (!rating) {
      setErrorMsg('Please tap a star to give your rating.')
      return
    }
    setErrorMsg('')
    setStatus('submitting')

    try {
      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('https://bu-online-library.onrender.com/api/reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          comment,
          service: serviceName,
          userName,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `Server error ${res.status}`)
      }

      setStatus('success')
      // Mark session so modal won't auto-reopen for this service
      sessionStorage.setItem(`rated_${serviceName}`, 'true')
      // Auto-close after 2s
      setTimeout(() => onDone(true), 2000)
    } catch (err) {
      console.error('Review error:', err)
      setStatus('error')
      setErrorMsg(err.message || 'Failed to submit. Please try again.')
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div
        className="w-full rounded-2xl mb-6 p-8 flex flex-col items-center gap-3 text-center"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          border: '2px solid #34d399',
        }}
      >
        <CheckCircle size={48} className="text-green-400" />
        <h3 className="text-xl font-bold text-white">Thank you for your feedback! ⭐</h3>
        <p className="text-green-200 text-sm">Your rating has been saved. Proceeding to the service form…</p>
      </div>
    )
  }

  // ── Rating card ────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full rounded-2xl mb-6 overflow-hidden shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.14)',
      }}
    >
      {/* Top bar */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.25)' }}
      >
        <div className="flex items-center gap-2">
          <Star size={20} fill="#FBBF24" className="text-yellow-400" />
          <span className="font-bold text-white text-sm">Quick Rating</span>
        </div>
        <button
          onClick={() => onDone(false)}
          className="text-white/40 hover:text-white transition-colors"
          title="Skip rating"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Prompt */}
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">
            How do you find our{' '}
            <span className="text-yellow-400">{serviceName}</span> service?
          </h3>
          <p className="text-white/50 text-xs mt-1">
            Takes 10 seconds — rate before you submit your request
          </p>
        </div>

        {/* Stars */}
        <div>
          <div className="flex gap-3 mb-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => { setRating(n); setErrorMsg('') }}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-125 focus:outline-none"
                type="button"
              >
                <Star
                  size={34}
                  fill={(hovered || rating) >= n ? '#FBBF24' : 'none'}
                  className={(hovered || rating) >= n ? 'text-yellow-400' : 'text-white/25'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <p className="text-yellow-400 text-sm font-semibold h-5">
            {labels[hovered || rating]}
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="text-red-400 text-xs font-medium">{errorMsg}</p>
        )}

        {/* Name */}
        <input
          type="text"
          placeholder="Your name (optional)"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)' }}
        />

        {/* Comment */}
        <textarea
          placeholder="Share your experience… (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)' }}
        />

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => onDone(false)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'submitting'}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-all"
            style={{
              background:
                status === 'submitting'
                  ? 'rgba(245,158,11,0.5)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
              cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'submitting' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              'Submit Rating ⭐'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingBanner
