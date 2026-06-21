import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { priceLabel } from '../../utils/format';

export default function PropertyCard({ property, onFavoriteToggle, isFavorited }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favLoading, setFavLoading] = useState(false);

  const photo = property.photos?.[0];
  const photoUrl = photo ? photo.filePath : null;

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
    <Link
      to={`/property/${property.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 block group border border-gray-100"
    >
      {/* Photo */}
      <div className="relative" style={{ paddingBottom: '75%' }}>
        <div className="absolute inset-0 bg-gray-100">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs">No photo</span>
            </div>
          )}
        </div>

        {/* Top-left badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${property.listingType === 'rent' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
            {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>

        {/* Top-right favorite */}
        <button
          onClick={handleFavorite}
          disabled={favLoading}
          className="absolute top-3 right-3 w-9 h-9 bg-white/95 rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all duration-200 backdrop-blur-sm"
          title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          {isFavorited ? (
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xl font-bold text-gray-900">{priceLabel(property.price, property.listingType, property.rentFrequency)}</p>
          {!property.unlocked && (
            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 border border-gray-200 flex-shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Contact hidden
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-800 truncate mb-1 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.locationGeneral}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {property.bedrooms} bed
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            {property.bathrooms} bath
          </span>
        </div>

        {property.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map(a => (
              <span key={a.id} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                {a.amenityName}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="text-xs text-gray-400 px-1 py-0.5">+{property.amenities.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
