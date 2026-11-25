import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { priceLabel } from '../../utils/format';

// Inject Cloudinary transform for a ~400px wide thumbnail (f_auto, q_auto).
// Falls back to original URL for non-Cloudinary hosts.
function thumbUrl(url) {
  if (!url) return null;
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!match) return url;
  return `${match[1]}w_400,f_auto,q_auto/${match[2]}`;
}

export default function PropertyCard({ property, onFavoriteToggle, isFavorited }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favLoading, setFavLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const photoUrl = thumbUrl(property.photos?.[0]?.filePath ?? null);

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast(t => (
        <span className="flex flex-col gap-1.5">
          <span className="font-semibold text-gray-900">Save this home</span>
          <span className="text-gray-500 text-xs">Sign up free to save homes and pick up where you left off.</span>
          <span className="flex gap-2 mt-1">
            <button
              onClick={() => { toast.dismiss(t.id); navigate('/tenant/register'); }}
              className="text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg"
            >
              Sign up — it&apos;s free
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); navigate('/tenant/login'); }}
              className="text-xs font-semibold text-gray-600 px-2 py-1.5"
            >
              Sign in
            </button>
          </span>
        </span>
      ), { duration: 6000 });
      return;
    }
    setFavLoading(true);
    try {
      const { data } = await api.post(`/tenant/favorite/${property.id}`);
      onFavoriteToggle?.(property.id, data.favorited);
      toast.success(data.favorited ? 'Saved to your homes' : 'Removed from saved');
    } catch {
      toast.error('Could not save. Try again.');
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <Link to={`/property/${property.id}`} className="block group">
      {/* Photo — 4:3 ratio */}
      <div className="relative rounded-xl overflow-hidden" style={{ paddingBottom: '75%' }}>
        <div className="absolute inset-0 bg-gray-100">
          {/* Skeleton shown until image loads */}
          {!imgLoaded && photoUrl && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={property.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[10px]">No photo</span>
            </div>
          )}
        </div>

        {/* Verified tick — icon only on card, full label on listing page */}
        {property.landlordVerified && (
          <div className="absolute top-1.5 left-1.5">
            <span
              className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm"
              title="Verified landlord"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
        )}

        {/* Heart — visually 20px icon, 44px tap area */}
        <button
          onClick={handleFavorite}
          disabled={favLoading}
          aria-label={isFavorited ? 'Remove from saved' : 'Save'}
          className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
        >
          <span className="w-7 h-7 bg-white/85 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm hover:bg-white transition-colors">
            {isFavorited ? (
              <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Info below photo */}
      <div className="mt-1.5 px-0.5">
        {/* Price — primary info */}
        <p className="text-xs font-bold text-gray-900 leading-tight truncate">
          {priceLabel(property.price, property.listingType, property.rentFrequency)}
        </p>

        {/* Title */}
        <p className="text-[11px] text-gray-700 truncate mt-0.5 leading-tight group-hover:text-primary transition-colors">
          {property.title}
        </p>

        {/* Area + beds/baths */}
        <p className="text-[10px] text-gray-400 truncate mt-0.5 leading-tight">
          {[
            property.locationGeneral,
            property.bedrooms && property.bathrooms
              ? `${property.bedrooms} bd · ${property.bathrooms} ba`
              : null,
          ].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  );
}
