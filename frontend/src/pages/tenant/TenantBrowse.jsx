import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/shared/Navbar';
import PropertyCard from '../../components/tenant/PropertyCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Apartments', value: 'apartment' },
  { label: 'Houses', value: 'house' },
  { label: 'Land', value: 'land' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Other', value: 'other' },
];

const AMENITY_OPTIONS = [
  'WiFi', 'Generator', 'Parking', 'Security Guard',
  'Furnished', 'Air Conditioning', 'Water Tank', 'Garden',
  'Laundry', 'CCTV', 'Swimming Pool', 'Gym',
];

function CategoryIcon({ type }) {
  const cls = 'w-3.5 h-3.5 flex-shrink-0';
  switch (type) {
    case '':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'apartment':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'house':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'land':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case 'commercial':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      );
  }
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-2xl" style={{ paddingBottom: '66%' }} />
          <div className="mt-3 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="text-center py-24">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">No properties found</h3>
      <p className="text-sm text-gray-400 mb-5">Try adjusting your filters or searching a different area.</p>
      {hasFilters && (
        <button onClick={onClear} className="text-sm font-semibold text-primary hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );
}

const EMPTY_PANEL = { location: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', amenities: [] };

export default function TenantBrowse() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  // Instant-apply (change triggers fetch)
  const [listingType, setListingType] = useState('');
  const [category, setCategory] = useState('');

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [pending, setPending] = useState(EMPTY_PANEL);
  const [applied, setApplied] = useState(EMPTY_PANEL);

  const activeFilterCount =
    [applied.location, applied.minPrice, applied.maxPrice, applied.bedrooms, applied.bathrooms].filter(Boolean).length +
    applied.amenities.length;

  const hasAnyFilter = !!(listingType || category || activeFilterCount);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (listingType) params.type = listingType;
      if (category) params.propertyType = category;
      if (applied.location) params.location = applied.location;
      if (applied.minPrice) params.minPrice = applied.minPrice;
      if (applied.maxPrice) params.maxPrice = applied.maxPrice;
      if (applied.bedrooms) params.bedrooms = applied.bedrooms;
      if (applied.bathrooms) params.bathrooms = applied.bathrooms;
      if (applied.amenities.length) params.amenities = applied.amenities.join(',');
      const { data } = await api.get('/properties', { params });
      setProperties(data.properties);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [listingType, category, applied]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

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

  function openFilter() {
    setPending({ ...applied });
    setFilterOpen(true);
  }

  function applyFilter() {
    setApplied({ ...pending });
    setFilterOpen(false);
  }

  function clearAll() {
    setPending(EMPTY_PANEL);
    setApplied(EMPTY_PANEL);
    setListingType('');
    setCategory('');
    setFilterOpen(false);
  }

  function toggleAmenity(a) {
    setPending(p => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a],
    }));
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Sticky filter header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3 space-y-3">

          {/* Search + filter button row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Search by location, suburb or area..."
                value={pending.location}
                onChange={e => setPending(p => ({ ...p, location: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') applyFilter(); }}
              />
            </div>
            <button
              onClick={openFilter}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex-shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Rent/Sale toggle + category pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {/* Toggle */}
            <div className="flex-shrink-0 flex bg-gray-100 rounded-lg p-0.5">
              {[['', 'All'], ['rent', 'Rent'], ['sale', 'Buy']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setListingType(val)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    listingType === val
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

            {/* Category pills */}
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  category === cat.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                }`}
              >
                <CategoryIcon type={cat.value} />
                {cat.label}
              </button>
            ))}

            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="flex-shrink-0 ml-2 text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <SkeletonGrid />
        ) : properties.length === 0 ? (
          <EmptyState hasFilters={hasAnyFilter} onClear={clearAll} />
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5">
              {total} propert{total !== 1 ? 'ies' : 'y'} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
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

      {/* Filter modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white w-full sm:w-[480px] rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-sm font-bold text-gray-900">Filters</span>
              <button
                onClick={() => setPending(EMPTY_PANEL)}
                className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
              >
                Reset all
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-7">

              {/* Price range */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Price range (K)</h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1.5 block">Minimum</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={pending.minPrice}
                      onChange={e => setPending(p => ({ ...p, minPrice: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <span className="text-gray-300 mb-3 font-light">—</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1.5 block">Maximum</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Any"
                      value={pending.maxPrice}
                      onChange={e => setPending(p => ({ ...p, maxPrice: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Bedrooms</h3>
                <div className="flex flex-wrap gap-2">
                  {['', '1', '2', '3', '4', '5'].map(n => (
                    <button
                      key={n}
                      onClick={() => setPending(p => ({ ...p, bedrooms: n }))}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        pending.bedrooms === n
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {n === '' ? 'Any' : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Bathrooms</h3>
                <div className="flex flex-wrap gap-2">
                  {['', '1', '2', '3'].map(n => (
                    <button
                      key={n}
                      onClick={() => setPending(p => ({ ...p, bathrooms: n }))}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        pending.bathrooms === n
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {n === '' ? 'Any' : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map(a => {
                    const active = pending.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm transition-all text-left ${
                          active
                            ? 'bg-primary/5 border-primary text-primary font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          active ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}>
                          {active && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={applyFilter}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Show properties
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
