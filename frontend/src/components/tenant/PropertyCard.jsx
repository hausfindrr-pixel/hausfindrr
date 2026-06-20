import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function PropertyCard({ property, onFavoriteToggle, isFavorited }) {
  const { user } = useAuth();
  const [favLoading, setFavLoading] = useState(false);

  const photo = property.photos?.[0];
  const photoUrl = photo ? `/uploads/photos/${photo.filePath.split('/').pop()}` : null;

  async function handleFavorite(e) {
    e.preventDefault();
    if (!user) return toast.error('Sign in to save favorites');
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
    <Link to={`/property/${property.id}`} className="card hover:shadow-lg transition-shadow block group">
      <div className="relative h-48 bg-gray-100">
        {photoUrl ? (
          <img src={photoUrl} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-md uppercase">
            {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
          {!property.unlocked && (
            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
              🔒 Locked
            </span>
          )}
        </div>
        {user?.role === 'tenant' && (
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            {isFavorited ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
          {property.title}
        </h3>
        <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
          <span>📍</span> {property.locationGeneral}
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-primary font-bold text-lg">K{Number(property.price).toLocaleString()}</p>
          <div className="text-gray-400 text-sm">
            {property.bedrooms}bd · {property.bathrooms}ba
          </div>
        </div>
        {property.amenities?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map(a => (
              <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {a.amenityName}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="text-xs text-gray-400">+{property.amenities.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
