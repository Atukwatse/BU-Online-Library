import { Link } from 'react-router-dom'
import { BookOpen, Printer, Calendar, Search, FileText, Users } from 'lucide-react'

const Services = () => {
  const services = [
    {
      icon: BookOpen,
      title: 'Book Borrowing',
      description: 'Borrow physical books from the library collection with our easy request system.',
      link: '/resources',
    },
    {
      icon: Printer,
      title: 'Printing Services',
      description: 'Access printing and copying services at competitive rates.',
      link: '/service-request?type=printing',
    },
    {
      icon: Calendar,
      title: 'Event Registration',
      description: 'Register for library events, workshops, and seminars.',
      link: '/events',
    },
    {
      icon: Search,
      title: 'Research Support',
      description: 'Get help with your research from our expert librarians.',
      link: '/service-request?type=research',
    },
    {
      icon: FileText,
      title: 'Inter-Library Loan',
      description: 'Request books from other libraries through our network.',
      link: '/service-request?type=interlibrary',
    },
    {
      icon: Users,
      title: 'Study Rooms',
      description: 'Book study rooms and spaces for group collaboration.',
      link: '/service-request?type=studyroom',
    },
  ]

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
              Library Services
            </h1>
            <p className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md opacity-90">
              Explore the wide range of services available to support your academic journey.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <Link
                  key={index}
                  to={service.link}
                  className="card hover:shadow-xl transition-shadow group"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="text-primary" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
