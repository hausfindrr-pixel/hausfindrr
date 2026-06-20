import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/shared/Navbar';
import api from '../../services/api';

const AMENITY_OPTIONS = [
  'Parking', 'Water Tank', 'Generator/Backup Power', 'Security/Fenced Compound',
  'Furnished', 'WiFi/Internet Ready', 'Kitchen', 'Aircon',
];

const PROPERTY_TYPES = ['house', 'apartment', 'land', 'commercial', 'other'];

export default function LandlordNewListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [form, setForm] = useState({
    listingType: 'rent',
    title: '',
    description: '',
    price: '',
    locationGeneral: '',
    locationExact: '',
    bedrooms: '1',
    bathrooms: '1',
    propertyType: 'house',
  });

  function toggleAmenity(a) {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  }

  function addCustomAmenity() {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities(prev => [...prev, trimmed]);
    }
    setCustomAmenity('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (photos.length === 0) return toast.error('Please add at least one property photo');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('amenities', JSON.stringify(selectedAmenities));
      photos.forEach(f => fd.append('photos', f));

      await api.post('/properties', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Listing submitted for review!');
      navigate('/landlord/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">New Property Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Listing Type */}
          <div className="card p-5">
            <h2 className="font-semibold text-primary mb-3">Listing Type</h2>
            <div className="flex gap-4">
              {['rent', 'sale'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="listingType" value={t}
                    checked={form.listingType === t} onChange={set('listingType')} />
                  <span className="capitalize font-medium">{t === 'rent' ? 'For Rent' : 'For Sale'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* General Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-primary">Property Details</h2>
            <div>
              <label className="label">Title</label>
              <input className="input" required value={form.title} onChange={set('title')} placeholder="e.g. Modern 3-bedroom house in Boroko" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input h-28 resize-none" required value={form.description} onChange={set('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Price (Kina)</label>
                <input className="input" type="number" required min="1" value={form.price} onChange={set('price')} />
              </div>
              <div>
                <label className="label">Property Type</label>
                <select className="input" value={form.propertyType} onChange={set('propertyType')}>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Bedrooms</label>
                <input className="input" type="number" min="0" required value={form.bedrooms} onChange={set('bedrooms')} />
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <input className="input" type="number" min="0" required value={form.bathrooms} onChange={set('bathrooms')} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-primary">Location</h2>
            <div>
              <label className="label">General Area <span className="text-gray-400 font-normal">(shown publicly)</span></label>
              <input className="input" required value={form.locationGeneral} onChange={set('locationGeneral')} placeholder="e.g. Boroko, NCD" />
            </div>
            <div>
              <label className="label">Exact Address <span className="text-gray-400 font-normal">(only revealed after unlock)</span></label>
              <input className="input" required value={form.locationExact} onChange={set('locationExact')} placeholder="Full street address" />
            </div>
          </div>

          {/* Amenities */}
          <div className="card p-5">
            <h2 className="font-semibold text-primary mb-3">Amenities</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {AMENITY_OPTIONS.map(a => (
                <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedAmenities.includes(a)}
                    onChange={() => toggleAmenity(a)} className="accent-secondary" />
                  {a}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" value={customAmenity} onChange={e => setCustomAmenity(e.target.value)}
                placeholder="Add custom amenity…" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())} />
              <button type="button" onClick={addCustomAmenity} className="btn-outline px-4">Add</button>
            </div>
            {selectedAmenities.filter(a => !AMENITY_OPTIONS.includes(a)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedAmenities.filter(a => !AMENITY_OPTIONS.includes(a)).map(a => (
                  <span key={a} className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {a}
                    <button type="button" onClick={() => toggleAmenity(a)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="card p-5">
            <h2 className="font-semibold text-primary mb-3">Property Photos</h2>
            <input type="file" className="input py-2" accept="image/*" multiple
              onChange={e => setPhotos(Array.from(e.target.files))} />
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((f, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(f)} className="w-20 h-20 object-cover rounded-lg" alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            Your listing will be reviewed by our team before it appears on the platform.
          </div>

          <button className="btn-primary w-full py-3 text-base" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Listing for Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
