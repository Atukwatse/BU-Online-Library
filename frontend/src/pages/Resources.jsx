import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { booksAPI, borrowingAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Book, Search, Filter, Plus, Edit, Trash2, X } from 'lucide-react'

const Resources = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  // Admin states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [formData, setFormData] = useState({ Title: '', Author: '', Category: 'General', CoverImage: '', FileURL: '', Status: 'Available' })
  const [coverImageFile, setCoverImageFile] = useState(null)

  const isAdmin = user?.Role === 'Admin'

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await booksAPI.getAll()
      // The API returns { status: 'success', data: [...] }
      const bookList = response.data?.data || response.data || []
      setBooks(Array.isArray(bookList) ? bookList : [])
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }
  console.log("books:", books)

  const handleBorrow = async (bookId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      await borrowingAPI.createRequest({ bookId })
      alert('Borrowing request submitted successfully!')
    } catch (error) {
      alert('Failed to submit borrowing request')
    }
  }

  // --- Admin Functions ---
  const openModal = (book = null) => {
    if (book) {
      setEditingBook(book)
      setFormData(book)
    } else {
      setEditingBook(null)
      setFormData({ Title: '', Author: '', Category: 'General', CoverImage: '', FileURL: '', Status: 'Available' })
      setCoverImageFile(null)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let submitData = { ...formData }
      
      // Handle image upload
      if (coverImageFile) {
        const formDataToSend = new FormData()
        formDataToSend.append('image', coverImageFile)
        
        // For now, create a local URL for the image
        // In production, you'd upload to a server and get back the URL
        const imageUrl = URL.createObjectURL(coverImageFile)
        submitData.CoverImage = imageUrl
      }
      
      if (editingBook) {
        await booksAPI.update(editingBook.BookID, submitData)
      } else {
        await booksAPI.create(submitData)
      }
      setIsModalOpen(false)
      fetchBooks()
    } catch (err) {
      console.error('Failed to save book:', err)
      alert('Failed to save book')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksAPI.delete(id)
        fetchBooks()
      } catch (err) {
        alert('Failed to delete book')
      }
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.Author?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || book.Status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">E-Books Collection</h1>
          {isAdmin && (
            <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
              <Plus size={20} /> Add Book
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Books</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Book size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No books found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div key={book.BookID} className="card hover:shadow-xl transition-shadow flex flex-col relative group">
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => openModal(book)} className="p-2 bg-white rounded-full shadow hover:text-blue-600">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(book.BookID)} className="p-2 bg-white rounded-full shadow hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {book.CoverImage ? (
                    <img src={book.CoverImage} alt={book.Title} className="w-full h-full object-cover" />
                  ) : (
                    <Book size={48} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary mb-1 line-clamp-2">{book.Title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{book.Author}</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    book.Status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {book.Status}
                  </span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => handleBorrow(book.BookID)}
                    disabled={book.Status !== 'Available'}
                    className={`flex-1 text-sm py-2 rounded font-semibold text-white ${
                      book.Status === 'Available' ? 'bg-primary hover:bg-primary/90' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Borrow
                  </button>
                  <button 
                    onClick={() =>
                      book.FileURL
                        ? window.open(book.FileURL, '_blank', 'noopener,noreferrer')
                        : alert('No online version available for this book yet.')
                    }
                    className={`flex-1 text-sm py-2 rounded font-semibold border ${
                      book.FileURL
                        ? 'border-primary text-primary hover:bg-primary/10'
                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-primary">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="text-gray-500" size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Book Title</label>
                <input required type="text" className="input" placeholder="e.g. Advanced Mathematics" value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Author</label>
                  <input required type="text" className="input" placeholder="John Doe" value={formData.Author} onChange={e => setFormData({...formData, Author: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                  <select className="input" value={formData.Category} onChange={e => setFormData({...formData, Category: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Science">Science</option>
                    <option value="Technology">Technology</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="History">History</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Paste Image Link (Cover)</label>
                <input 
                  type="url" 
                  className="input" 
                  placeholder="https://example.com/book-cover.jpg"
                  value={formData.CoverImage || ''} 
                  onChange={e => setFormData({...formData, CoverImage: e.target.value})} 
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Copy an image address from Google and paste it here.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-Book File URL (PDF/Drive)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://drive.google.com/..."
                  value={formData.FileURL || ''}
                  onChange={e => setFormData({...formData, FileURL: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Students will use this to read the book online.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Availability Status</label>
                <select className="input" value={formData.Status} onChange={e => setFormData({...formData, Status: e.target.value})}>
                  <option value="Available">Available ✅</option>
                  <option value="Unavailable">Unavailable ❌</option>
                </select>
              </div>

              {/* Footer - inside the form but at the bottom */}
              <div className="pt-4 border-t border-gray-50">
                <button type="submit" className="btn btn-primary w-full py-3 text-lg shadow-lg hover:shadow-primary/20 transition-all">
                  {editingBook ? 'Update Book Details' : 'Save New Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Resources
