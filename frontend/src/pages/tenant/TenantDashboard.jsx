import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('unlocked');
  const [unlocked, setUnlocked] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenant/unlocked'),
      api.get('/tenant/favorites'),
      api.get('/messages/inbox'),
    ]).then(([u, f, m]) => {
      setUnlocked(u.data.unlocks);
      setFavorites(f.data.favorites);
      setThreads(m.data.threads);
    }).finally(() => setLoading(false));
  }, []);

  const TABS = [
    { key: 'unlocked', label: `Unlocked (${unlocked.length})` },
    { key: 'favorites', label: `Favorites (${favorites.length})` },
    { key: 'messages', label: `Messages (${threads.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Hi, {user?.name}</h1>
            <p className="text-gray-500 text-sm">Your property dashboard</p>
          </div>
          <Link to="/browse" className="btn-secondary text-sm px-4 py-2">Browse More</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-gray-400">Loading…</p> : (
          <>
            {tab === 'unlocked' && (
              unlocked.length === 0 ? (
                <EmptyState icon="🔓" text="No unlocked properties yet. Unlock a listing to see full details." link="/browse" linkText="Browse listings" />
              ) : (
                <div className="space-y-4">
                  {unlocked.map(u => <PropertyRow key={u.id} property={u.property} badge="Unlocked" badgeColor="bg-green-100 text-green-700" />)}
                </div>
              )
            )}
            {tab === 'favorites' && (
              favorites.length === 0 ? (
                <EmptyState icon="❤️" text="No saved properties yet. Tap the heart icon on any listing." link="/browse" linkText="Browse listings" />
              ) : (
                <div className="space-y-4">
                  {favorites.map(f => <PropertyRow key={f.id} property={f.property} badge="Saved" badgeColor="bg-red-100 text-red-600" />)}
                </div>
              )
            )}
            {tab === 'messages' && (
              threads.length === 0 ? (
                <EmptyState icon="💬" text="No conversations yet. Unlock a property to start chatting." />
              ) : (
                <div className="space-y-3">
                  {threads.map((t, i) => (
                    <Link key={i} to={`/property/${t.propertyId}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">💬</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{t.property?.title}</p>
                        <p className="text-gray-500 text-sm">With {t.otherUser?.name}</p>
                        <p className="text-gray-400 text-xs truncate">{t.latestMessage?.content}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PropertyRow({ property, badge, badgeColor }) {
  const photo = property?.photos?.[0];
  return (
    <Link to={`/property/${property.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {photo ? (
        <img src={photo.filePath} className="w-20 h-16 object-cover rounded-lg flex-shrink-0" alt="" />
      ) : (
        <div className="w-20 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">🏠</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 truncate">{property.title}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>
        </div>
        <p className="text-gray-500 text-sm">📍 {property.locationGeneral}</p>
        <p className="text-primary font-bold text-sm">K{Number(property.price).toLocaleString()}</p>
      </div>
    </Link>
  );
}

function EmptyState({ icon, text, link, linkText }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="mb-4">{text}</p>
      {link && <Link to={link} className="btn-secondary text-sm px-5 py-2">{linkText}</Link>}
    </div>
  );
}
