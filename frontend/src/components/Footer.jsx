import { Link } from 'react-router-dom'
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen size={22} className="text-white" />
              </div>
              <span className="text-xl font-bold">Bugema E-Library</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Empowering students, faculty, and researchers with seamless access to a world of academic knowledge.
            </p>
            {/* Social Links */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
              <a href="https://www.facebook.com/BugemaUniv/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 md:w-11 md:h-11 bg-white/10 hover:bg-white/25 hover:text-blue-400 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg active:scale-95">
                <Facebook size={18} className="md:w-5 md:h-5" />
              </a>
              <a href="https://twitter.com/BugemaUniv" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-10 h-10 md:w-11 md:h-11 bg-white/10 hover:bg-white/25 hover:text-sky-400 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg active:scale-95">
                <Twitter size={18} className="md:w-5 md:h-5" />
              </a>
              <a href="https://www.instagram.com/bugemauniversity_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 md:w-11 md:h-11 bg-white/10 hover:bg-white/25 hover:text-pink-400 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg active:scale-95">
                <Instagram size={18} className="md:w-5 md:h-5" />
              </a>
              <a href="https://www.youtube.com/results?search_query=bugema+university" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 md:w-11 md:h-11 bg-white/10 hover:bg-white/25 hover:text-red-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-lg active:scale-95">
                <Youtube size={18} className="md:w-5 md:h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              {[
                { label: 'Home', path: '/' },
                { label: 'E-Books & Resources', path: '/resources' },
                { label: 'Library Services', path: '/services' },
                { label: 'Digital Events', path: '/events' },
                { label: 'Ratings & Reviews', path: '/reviews' },
                { label: 'About Us', path: '/about' },
              ].map(({ label, path }) => (
                <li key={path}>
                  <Link to={path} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2 text-white/70 text-sm">
              {[
                { label: 'Book Borrowing', path: '/resources' },
                { label: 'Printing Services', path: '/service-request?type=printing' },
                { label: 'Study Room Booking', path: '/service-request?type=studyroom' },
                { label: 'Research Support', path: '/service-request?type=research' },
                { label: 'Inter-Library Loan', path: '/service-request?type=interlibrary' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-white/70 text-sm inline-block text-left">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="shrink-0 mt-0.5" />
                <span>Bugema University Main Campus, Uganda</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0" />
                <a href="tel:0769559707" className="hover:text-white transition-colors">0769559707</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0" />
                <a href="mailto:library@bugema.ac.ug" className="hover:text-white transition-colors break-all">
                  library@bugema.ac.ug
                </a>
              </li>
            </ul>
            <Link
              to="/contact"
              className="inline-block mt-5 px-5 py-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg text-sm font-medium transition-colors mx-auto"
            >
              Get Help &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center gap-2 text-white/60 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Bugema University E-Library. All rights reserved.</p>
          <p>Built for academic excellence 📚</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
