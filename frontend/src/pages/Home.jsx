import { Link } from 'react-router-dom'
import { BookOpen, Database, Calendar, Users, HelpCircle } from 'lucide-react'

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative w-full" style={{ minHeight: '80vh' }}>
        <img
          src="/Home page lib.png"
          alt="Bugema University Library Banner"
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-transparent"></div>
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
              Welcome to Bugema E-Library
            </h1>
            <p className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
              Explore knowledge from thousands of books
            </p>
            <div className="hero-actions mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/resources"
                className="bg-secondary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors duration-300"
              >
                Browse E-Books
              </Link>
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Student Resources Banner */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Explore Our Collection
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover thousands of books and resources to support your academic journey.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/student1.png"
              alt="Students exploring library resources"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Library Services
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Access a wide range of digital services to enhance your learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link to="/resources" className="card text-center hover:shadow-xl transition-shadow block">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">E-Books</h3>
              <p className="text-gray-600">
                Access thousands of electronic books across all disciplines.
              </p>
            </Link>

            <Link to="/resources" className="card text-center hover:shadow-xl transition-shadow block">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Databases</h3>
              <p className="text-gray-600">
                Connect to premium academic databases for research.
              </p>
            </Link>

            <Link to="/events" className="card text-center hover:shadow-xl transition-shadow block">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Events</h3>
              <p className="text-gray-600">
                Participate in digital events and workshops.
              </p>
            </Link>

            <Link to="/contact" className="card text-center hover:shadow-xl transition-shadow block">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Help</h3>
              <p className="text-gray-600">
                Get assistance and support from our library team.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students and faculty accessing our digital library.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-secondary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors duration-300"
            >
              Create Account
            </Link>
            <Link
              to="/resources"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors duration-300"
            >
              Browse Resources
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
