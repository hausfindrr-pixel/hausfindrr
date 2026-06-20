import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import PropertyCard from '../../components/tenant/PropertyCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function TenantBrowse() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({ type: '', location: '', minPrice: '', maxPrice: '', bedrooms: '' });

  const [applied, setApplied] = useState({});

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v));
      const { data } = await api.get('/properties', { params });
      setProperties(data.properties);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { loadListings(); }, [loadListings]);

  useEffect(() => {
    if (user?.role !== 'tenant') return;
    api.get('/tenant/favorites').then(r => {
      setFavorites(new Set(r.data.favorites.map(f => f.propertyId)));
    }).catch(() => {});
  }, [user]);

  function handleFavoriteToggle(propertyId, isFav) {
    setFavorites(prev => {
      const next = new Set(prev);
      isFav ? next.add(propertyId) : next.delete(propertyId);
      return next;
    });
  }

  function applyFilters(e) {
    e.preventDefault();
    setApplied({ ...filters });
  }

  const set = k => e => setFilters(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Browse Properties</h1>
            <p className="text-gray-500 text-sm">{total} properties available across PNG</p>
          </div>
          {user?.role === 'tenant' && (
            <Link to="/tenant/dashboard" className="btn-outline text-sm px-4 py-2">My Dashboard</Link>
          )}
        </div>

        {/* Filters */}
        <form onSubmit={applyFilters} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <select className="input text-sm" value={filters.type} onChange={set('type')}>
              <option value="">All Types</option>
              <option value="rent">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
            <input className="input text-sm" placeholder="Location…" value={filters.location} onChange={set('location')} />
            <input className="input text-sm" type="number" placeholder="Min price (K)" value={filters.minPrice} onChange={set('minPrice')} />
            <input className="input text-sm" type="number" placeholder="Max price (K)" value={filters.maxPrice} onChange={set('maxPrice')} />
            <select className="input text-sm" value={filters.bedrooms} onChange={set('bedrooms')}>
              <option value="">Any Bedrooms</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ bed</option>)}
            </select>
          </div>
          <button className="btn-primary mt-3 px-6 py-2 text-sm">Search</button>
        </form>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🏘️</div>
            <p className="text-lg">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p}
                isFavorited={favorites.has(p.id)}
                onFavoriteToggle={handleFavoriteToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
