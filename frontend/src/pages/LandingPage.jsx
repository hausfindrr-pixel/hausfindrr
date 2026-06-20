import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'landlord') navigate('/landlord/dashboard');
      else if (user.role === 'tenant') navigate('/tenant/dashboard');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-primary px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold tracking-tight">HausFindrr</h1>
          <span className="text-white/70 text-sm">PNG Property Marketplace</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <span className="inline-block bg-secondary/10 text-secondary font-semibold px-4 py-1.5 rounded-full text-sm">
              Papua New Guinea's #1 Property Platform
            </span>
          </div>
          <h2 className="text-5xl font-extrabold text-primary leading-tight mb-6">
            Find Your Next<br />
            <span className="text-secondary">Haus in PNG</span>
          </h2>
          <p className="text-gray-600 text-lg mb-12 leading-relaxed">
            Rent or buy property anywhere in Papua New Guinea. Connect verified landlords
            with tenants safely and transparently.
          </p>

          {/* Role Choice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            <div className="card p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary group"
                 onClick={() => navigate('/landlord/login')}>
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-primary mb-2">I'm a Landlord</h3>
              <p className="text-gray-500 text-sm mb-6">List and manage your properties. Reach verified tenants.</p>
              <button className="btn-primary w-full">Continue as Landlord</button>
            </div>

            <div className="card p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-secondary group"
                 onClick={() => navigate('/tenant/login')}>
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-primary mb-2">I'm a Tenant</h3>
              <p className="text-gray-500 text-sm mb-6">Browse properties for rent or sale across PNG.</p>
              <button className="btn-secondary w-full">Continue as Tenant</button>
            </div>
          </div>

          <p className="mt-8 text-gray-400 text-sm">
            Admin?{' '}
            <button onClick={() => navigate('/admin/login')} className="text-secondary hover:underline">
              Sign in here
            </button>
          </p>
        </div>
      </main>

      <footer className="bg-primary text-white/60 text-center py-4 text-sm">
        © {new Date().getFullYear()} HausFindrr — Papua New Guinea
      </footer>
    </div>
  );
}
