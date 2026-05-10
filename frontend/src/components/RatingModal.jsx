import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { reviewsAPI } from '../services/api';
import Toast from './Toast';

const RatingModal = ({ isOpen, onClose, serviceName }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleSubmit = async () => {
    if (!rating) {
      alert('Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewsAPI.create({ rating, comment, service: serviceName, userName });
      setToastMsg('Thank you for your feedback! ⭐');
      // Mark as rated for this service so modal won't auto-pop again this session
      sessionStorage.setItem(`rated_${serviceName}`, 'true');
      setTimeout(() => {
        setToastMsg('');
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">How was your experience?</h3>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Rate our <span className="font-semibold text-yellow-400">{serviceName}</span> service
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors rounded-full p-1 ml-4 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stars */}
        <div className="px-6 py-2">
          <div className="flex gap-2 justify-center mb-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  size={36}
                  fill={(hovered || rating) >= n ? '#FBBF24' : 'none'}
                  className={(hovered || rating) >= n ? 'text-yellow-400' : 'text-white/30'}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-yellow-400 h-5">
            {labels[hovered || rating]}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 space-y-3 mt-2">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          />
          <textarea
            placeholder="Tell us what you think... (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          />

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Maybe Later
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      )}
    </div>
  );
};

export default RatingModal;
