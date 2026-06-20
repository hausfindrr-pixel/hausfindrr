import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'landlord') navigate('/landlord/dashboard');
      else if (user.role === 'tenant') navigate('/browse');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-bold text-primary tracking-tight">HausFindrr</span>
          <div className="flex items-center gap-4">
            <Link to="/browse" className="text-sm text-gray-600 hover:text-primary transition-colors font-medium">Browse</Link>
            <Link to="/tenant/login" className="text-sm text-gray-600 hover:text-primary transition-colors font-medium">Sign in</Link>
            <Link to="/landlord/register" className="btn-primary text-sm py-2 px-4">List a Property</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #41271b 0%, #5a3828 30%, #975536 60%, #b36b4a 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block bg-white/20 text-white font-medium px-4 py-1.5 rounded-full text-sm mb-6 backdrop-blur-sm">
            Papua New Guinea's Property Marketplace
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-5">
            Find Your Next<br />
            <span className="text-orange-200">Haus in PNG</span>
          </h1>
          <p className="text-white/80 text-lg sm:text-xl mb-10 leading-relaxed max-w-xl mx-auto">
            Discover rentals and properties for sale across Papua New Guinea. Verified listings, direct contact with landlords.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/browse')}
              className="bg-white text-primary font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-lg text-base"
            >
              Browse Properties
            </button>
            <button
              onClick={() => navigate('/landlord/register')}
              className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              List a Property
            </button>
          </div>
        </div>
      </section>

      {/* CTA Cards */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">How would you like to use HausFindrr?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Landlord card */}
            <div
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-primary hover:-translate-y-1 group"
              onClick={() => navigate('/landlord/login')}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl" style={{ background: '#41271b15' }}>
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">I'm a Landlord</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                List your properties, manage inquiries, and reach thousands of verified tenants across PNG.
              </p>
              <span className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm group-hover:gap-2.5 transition-all">
                Get started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            {/* Tenant card */}
            <div
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-secondary hover:-translate-y-1 group"
              onClick={() => navigate('/tenant/login')}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-2xl" style={{ background: '#97553615' }}>
                <svg className="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">I'm a Tenant</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Browse properties for rent or sale. Unlock contact details to connect directly with landlords.
              </p>
              <span className="inline-flex items-center gap-1.5 text-secondary font-semibold text-sm group-hover:gap-2.5 transition-all">
                Start browsing
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Admin?{' '}
            <button onClick={() => navigate('/admin/login')} className="text-secondary hover:underline font-medium">
              Sign in here
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white/60 text-center py-5 text-sm">
        <p>&copy; {new Date().getFullYear()} HausFindrr &mdash; Papua New Guinea's Property Marketplace</p>
      </footer>
    </div>
  );
}
