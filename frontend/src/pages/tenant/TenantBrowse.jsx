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

  function clearFilters() {
    setFilters({ type: '', location: '', minPrice: '', maxPrice: '', bedrooms: '' });
    setApplied({});
  }

  const hasFilters = Object.values(filters).some(v => v);
  const set = k => e => setFilters(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Properties</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {total > 0 ? `${total} propert${total === 1 ? 'y' : 'ies'} across PNG` : 'Search for your next home'}
              </p>
            </div>
            {user?.role === 'tenant' && (
              <Link to="/tenant/dashboard" className="btn-outline text-sm py-2 px-4 whitespace-nowrap">
                My Dashboard
              </Link>
            )}
          </div>

          {/* Filter bar */}
          <form onSubmit={applyFilters} className="mt-5">
            <div className="flex flex-wrap gap-2">
              <select
                className="input text-sm py-2 w-auto flex-shrink-0"
                value={filters.type}
                onChange={set('type')}
              >
                <option value="">All Types</option>
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </select>

              <div className="relative flex-1 min-w-36">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  className="input text-sm py-2 pl-9"
                  placeholder="Location (e.g. Boroko)"
                  value={filters.location}
                  onChange={set('location')}
                />
              </div>

              <input
                className="input text-sm py-2 w-28 flex-shrink-0"
                type="number"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={set('minPrice')}
              />
              <input
                className="input text-sm py-2 w-28 flex-shrink-0"
                type="number"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={set('maxPrice')}
              />

              <select className="input text-sm py-2 w-auto flex-shrink-0" value={filters.bedrooms} onChange={set('bedrooms')}>
                <option value="">Any Beds</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ bed</option>)}
              </select>

              <button type="submit" className="btn-primary py-2 px-5 text-sm flex-shrink-0">
                Search
              </button>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="text-sm text-gray-400 hover:text-gray-600 px-2 flex-shrink-0">
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="bg-gray-200 animate-pulse" style={{ paddingBottom: '75%' }} />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No properties found</h3>
            <p className="text-gray-400 text-sm mb-5">Try adjusting your search filters.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-outline text-sm py-2 px-5">Clear Filters</button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">{total} result{total !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isFavorited={favorites.has(p.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
