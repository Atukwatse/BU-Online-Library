import { BookOpen, Users, Globe, Clock, Printer, Search } from 'lucide-react'

const About = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative w-full" style={{ minHeight: '60vh' }}>
        <img
          src="/Nuese student.png"
          alt="Bugema University Students"
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90"></div>
        <div className="relative z-10 flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
              About Bugema E-Library
            </h1>
            <p className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md opacity-90">
              A state-of-the-art digital library system designed to provide students, faculty, and researchers with seamless access to a vast collection of academic resources.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Our Mission</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              To provide comprehensive access to digital information resources that support teaching, learning, and research at Bugema University, fostering academic excellence and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">What We Offer</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore the wide range of services available to our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">E-Books</h3>
              <p className="text-gray-600">
                Thousands of e-books across all disciplines available at your fingertips.
              </p>
            </div>

            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Academic Databases</h3>
              <p className="text-gray-600">
                Access to premium academic databases for deep research.
              </p>
            </div>

            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Research Support</h3>
              <p className="text-gray-600">
                Research support and inter-library loan services.
              </p>
            </div>

            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Events & Workshops</h3>
              <p className="text-gray-600">
                Digital events and workshops to boost your learning.
              </p>
            </div>

            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Printing Services</h3>
              <p className="text-gray-600">
                Convenient printing and copying services on campus.
              </p>
            </div>

            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">24/7 Access</h3>
              <p className="text-gray-600">
                Round-the-clock access to all digital resources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Assistance?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            For inquiries or support, please visit our Help page or contact the library directly.
          </p>
          <a
            href="/contact"
            className="bg-secondary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white transition-colors duration-300 inline-block"
          >
            Get Help
          </a>
        </div>
      </section>
    </div>
  )
}

export default About
