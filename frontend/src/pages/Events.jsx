import { useState, useEffect } from 'react'
import { eventsAPI } from '../services/api'
import { Calendar, Clock, MapPin, Users, CalendarPlus, Edit, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Events = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [newEvent, setNewEvent] = useState({ Title: '', Description: '', EventDate: '', StartTime: '', EndTime: '', Location: '', MaxAttendees: '' })
  const { isAuthenticated, user } = useAuth()
  const isAdmin = user?.Role === 'Admin'
  const isStaffOrAdmin = user?.Role === 'Admin' || user?.Role === 'Staff'

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll()
      setEvents(response.data.data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      await eventsAPI.register(eventId)
      alert('Registration successful!')
      fetchEvents()
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed')
    }
  }

  const openModal = (event = null) => {
    if (event) {
      setEditingEvent(event)
      setNewEvent(event)
    } else {
      setEditingEvent(null)
      setNewEvent({ Title: '', Description: '', EventDate: '', StartTime: '', EndTime: '', Location: '', MaxAttendees: '' })
    }
    setShowModal(true)
  }

  const handleSaveEvent = async (e) => {
    e.preventDefault()
    try {
      if (editingEvent) {
        await eventsAPI.update(editingEvent.EventID, newEvent)
      } else {
        await eventsAPI.create(newEvent)
      }
      setShowModal(false)
      fetchEvents()
    } catch (error) {
      alert('Failed to save event')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.delete(id)
        fetchEvents()
      } catch (err) {
        alert('Failed to delete event')
      }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative w-full" style={{ minHeight: '50vh' }}>
        <img
          src="/Nuese student.png"
          alt="Bugema University Students"
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90"></div>
        <div className="relative z-10 flex items-center justify-center min-h-[50vh] px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
              Digital Events
            </h1>
            <p className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md opacity-90">
              Register for library events, workshops, and seminars.
            </p>
          </div>
        </div>
      </section>

      {/* Events Content */}
      <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center mb-8">
          {isAuthenticated && isStaffOrAdmin && (
            <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
              <CalendarPlus size={20} />
              Create Event
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No events scheduled at this time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.EventID} className="card hover:shadow-xl transition-shadow relative group">
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => openModal(event)} className="p-2 bg-white rounded-full shadow hover:text-blue-600">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(event.EventID)} className="p-2 bg-white rounded-full shadow hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                
                {event.BannerImage && (
                  <img
                    src={event.BannerImage}
                    alt={event.Title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-primary mb-2">{event.Title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{event.Description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        {event.EventDate ? 
                          (new Date(event.EventDate).toString() !== 'Invalid Date' ? 
                            new Date(event.EventDate).toLocaleDateString() : 
                            'Date to be announced'
                          ) : 
                          'Date to be announced'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{event.StartTime} - {event.EndTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{event.Location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>{event.MaxAttendees || 'Unlimited'} attendees</span>
                    </div>
                  </div>

                  {isAuthenticated && !isAdmin && (
                    <button
                      onClick={() => handleRegister(event.EventID)}
                      className="w-full btn btn-primary"
                    >
                      Register Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Event Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-primary">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <button onClick={() => setShowModal(false)}><X className="text-gray-500" /></button>
              </div>
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Title</label>
                  <input type="text" required className="input mt-1" value={newEvent.Title} onChange={e => setNewEvent({...newEvent, Title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea required className="input mt-1" value={newEvent.Description} onChange={e => setNewEvent({...newEvent, Description: e.target.value})}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" required className="input mt-1" value={newEvent.EventDate} onChange={e => setNewEvent({...newEvent, EventDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Attendees</label>
                    <input type="number" className="input mt-1" value={newEvent.MaxAttendees} onChange={e => setNewEvent({...newEvent, MaxAttendees: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input type="time" required className="input mt-1" value={newEvent.StartTime} onChange={e => setNewEvent({...newEvent, StartTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input type="time" required className="input mt-1" value={newEvent.EndTime} onChange={e => setNewEvent({...newEvent, EndTime: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input type="text" required className="input mt-1" value={newEvent.Location} onChange={e => setNewEvent({...newEvent, Location: e.target.value})} />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn btn-primary w-full">{editingEvent ? 'Update' : 'Create'} Event</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </section>
    </div>
  )
}

export default Events
