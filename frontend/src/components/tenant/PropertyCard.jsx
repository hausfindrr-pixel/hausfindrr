import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { priceLabel } from '../../utils/format';

const PROPERTY_TYPE_LABELS = {
  apartment: 'Apartment',
  house: 'House',
  land: 'Land',
  commercial: 'Commercial',
  other: 'Property',
};

export default function PropertyCard({ property, onFavoriteToggle, isFavorited }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favLoading, setFavLoading] = useState(false);

  const photoUrl = property.photos?.[0]?.filePath ?? null;
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] ?? 'Property';

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to save favorites');
      navigate('/tenant/login');
      return;
    }
    setFavLoading(true);
    try {
      const { data } = await api.post(`/tenant/favorite/${property.id}`);
      onFavoriteToggle?.(property.id, data.favorited);
    } catch {
      toast.error('Failed to update favorite');
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <Link to={`/property/${property.id}`} className="block group">
      {/* Photo */}
      <div className="relative rounded-2xl overflow-hidden mb-3" style={{ paddingBottom: '66%' }}>
        <div className="absolute inset-0 bg-gray-100">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs">No photo</span>
            </div>
          )}
        </div>

        {/* Listing type badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
            property.listingType === 'rent' ? 'bg-primary text-white' : 'bg-secondary text-white'
          }`}>
            {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          disabled={favLoading}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all duration-200 backdrop-blur-sm"
          title={isFavorited ? 'Remove from saved' : 'Save'}
        >
          {isFavorited ? (
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Info below photo */}
      <div>
        {/* Type + location */}
        <p className="text-sm text-gray-500 truncate">
          {typeLabel}
          {property.locationGeneral && <> · {property.locationGeneral}</>}
        </p>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        {/* Bed / Bath */}
        <p className="text-xs text-gray-400 mt-0.5">
          {property.bedrooms} bed · {property.bathrooms} bath
        </p>

        {/* Price + lock */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <p className="text-sm font-bold text-gray-900">
            {priceLabel(property.price, property.listingType, property.rentFrequency)}
          </p>
          {!property.unlocked && (
            <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              K25 to unlock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
