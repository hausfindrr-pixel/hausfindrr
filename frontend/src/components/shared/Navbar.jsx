import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const dashLink = user?.role === 'landlord' ? '/landlord/dashboard'
                 : user?.role === 'tenant' ? '/tenant/dashboard'
                 : '/admin';

  return (
    <nav className="bg-primary text-white px-6 py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to={user ? dashLink : '/'} className="text-xl font-bold">HausFindrr</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white/70 text-sm capitalize">{user.role}</span>
              <span className="text-white font-medium text-sm">{user.name}</span>
              <button onClick={handleLogout} className="text-white/70 hover:text-white text-sm transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/" className="text-white/70 hover:text-white text-sm">Home</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
