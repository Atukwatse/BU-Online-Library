import { Mail, Phone, MapPin } from 'lucide-react'

const Contact = () => {
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
              Help &amp; Support
            </h1>
            <p className="hero-subtitle text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md opacity-90">
              We're here to help. Reach out to our library support team.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">Get in Touch</h2>
              <p className="text-gray-600 mb-6">
                Need help? Contact our library support team for assistance.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Email</h3>
                    <a href="mailto:library@bugema.ac.ug" className="text-gray-600 hover:text-primary transition-colors break-all">
                      library@bugema.ac.ug
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Phone</h3>
                    <a href="tel:0769559707" className="text-gray-600 hover:text-primary transition-colors">
                      0769559707
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Location</h3>
                    <p className="text-gray-600">Bugema University Main Campus</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary mb-2">How do I access e-books?</h3>
                  <p className="text-gray-600">
                    Log in to your account and navigate to the E-Books section to browse and access available resources.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">How do I borrow a physical book?</h3>
                  <p className="text-gray-600">
                    Submit a borrow request through your dashboard. Staff will review and approve your request.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">What if I forget my password?</h3>
                  <p className="text-gray-600">
                    Use the "Forgot Password" link on the login page to reset your password via email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact

