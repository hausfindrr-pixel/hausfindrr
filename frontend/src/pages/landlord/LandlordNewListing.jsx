import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/shared/Navbar';
import api from '../../services/api';

// Port Moresby coordinates
const DEFAULT_LAT = -9.4438;
const DEFAULT_LNG = 147.1803;

const AMENITY_OPTIONS = [
  'Parking', 'Water Tank', 'Generator/Backup Power', 'Security/Fenced Compound',
  'Furnished', 'WiFi/Internet Ready', 'Kitchen', 'Aircon',
];

const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
];

export default function LandlordNewListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [titleDocs, setTitleDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [pinLat, setPinLat] = useState(DEFAULT_LAT);
  const [pinLng, setPinLng] = useState(DEFAULT_LNG);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

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

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

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

  // Initialize Leaflet map
  useEffect(() => {
    let map;
    let marker;

    async function initMap() {
      if (!mapRef.current || leafletMapRef.current) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix default icon paths (known Vite/Leaflet issue)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = L.map(mapRef.current).setView([DEFAULT_LAT, DEFAULT_LNG], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPinLat(parseFloat(pos.lat.toFixed(6)));
        setPinLng(parseFloat(pos.lng.toFixed(6)));
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setPinLat(parseFloat(lat.toFixed(6)));
        setPinLng(parseFloat(lng.toFixed(6)));
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    }

    initMap().catch(console.error);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (photos.length === 0) return toast.error('Please add at least one property photo');
    if (titleDocs.length === 0) return toast.error('Please upload your property title document');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('amenities', JSON.stringify(selectedAmenities));
      fd.append('location_lat', pinLat.toString());
      fd.append('location_lng', pinLng.toString());
      photos.forEach(f => fd.append('photos', f));
      titleDocs.forEach(f => fd.append('title_documents', f));
      supportingDocs.forEach(f => fd.append('title_documents', f));

      await api.post('/properties', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Listing submitted for review!');
      navigate('/landlord/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e) {
    const newFiles = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...newFiles].slice(0, 20));
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New Property Listing</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details below. Your listing will be reviewed before going live.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Listing basics */}
          <Section title="Listing Basics" number="1">
            {/* Listing type pill toggle */}
            <div>
              <label className="label">Listing Type</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                {[{ value: 'rent', label: 'For Rent' }, { value: 'sale', label: 'For Sale' }].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, listingType: t.value }))}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.listingType === t.value
                        ? 'bg-white text-primary shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Listing Title</label>
              <input className="input" required value={form.title} onChange={set('title')}
                placeholder="e.g. Modern 3-bedroom house in Boroko" />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input h-28 resize-none" required value={form.description} onChange={set('description')}
                placeholder="Describe your property — its features, condition, nearby amenities…" />
              <p className="text-xs text-gray-400 mt-1.5">
                Keep your description general. Avoid sharing exact addresses or contact details here — this helps your listing get approved faster.
              </p>
            </div>

            <div>
              <label className="label">Price (Kina)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">K</span>
                <input className="input pl-8" type="number" required min="1" value={form.price} onChange={set('price')} placeholder="0" />
              </div>
            </div>
          </Section>

          {/* Section 2: Property details */}
          <Section title="Property Details" number="2">
            <div>
              <label className="label">Property Type</label>
              <select className="input" value={form.propertyType} onChange={set('propertyType')}>
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
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
          </Section>

          {/* Section 3: Location */}
          <Section title="Location" number="3">
            <div>
              <label className="label">General Area <span className="text-gray-400 font-normal">(shown publicly)</span></label>
              <input className="input" required value={form.locationGeneral} onChange={set('locationGeneral')}
                placeholder="e.g. Boroko, NCD" />
            </div>
            <div>
              <label className="label">Exact Address <span className="text-gray-400 font-normal">(hidden until tenant unlocks)</span></label>
              <input className="input" required value={form.locationExact} onChange={set('locationExact')}
                placeholder="Full street address" />
            </div>

            {/* Leaflet map */}
            <div>
              <label className="label">Pin Location on Map</label>
              <p className="text-xs text-gray-400 mb-2">Click on the map or drag the pin to set the property location.</p>
              <div
                ref={mapRef}
                className="w-full rounded-xl overflow-hidden border border-gray-200"
                style={{ height: 280 }}
              />
              {mapReady && (
                <p className="text-xs text-gray-500 mt-2">
                  Coordinates: <span className="font-mono">{pinLat.toFixed(5)}, {pinLng.toFixed(5)}</span>
                </p>
              )}
            </div>
          </Section>

          {/* Section 4: Ownership documents */}
          <Section title="Ownership Documents" number="4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 mb-2">
              These documents are used for verification only and are never shared with tenants.
            </div>

            <div>
              <label className="label">Property Title Document <span className="text-red-400">*</span></label>
              <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${titleDocs.length > 0 ? 'border-secondary bg-secondary/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setTitleDocs(Array.from(e.target.files))} />
                {titleDocs.length > 0 ? (
                  <div className="text-center">
                    <svg className="w-6 h-6 text-secondary mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-xs text-secondary font-medium">{titleDocs.map(f => f.name).join(', ')}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-6 h-6 text-gray-300 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-gray-500">Upload title document</p>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="label">Supporting Ownership Documents <span className="text-gray-400 font-normal">(optional)</span></label>
              <label className="flex items-center gap-2 w-full border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-gray-300 bg-gray-50 transition-colors">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple
                  onChange={e => setSupportingDocs(Array.from(e.target.files))} />
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-xs text-gray-500">
                  {supportingDocs.length > 0 ? `${supportingDocs.length} file(s) selected` : 'Add supporting docs (multiple allowed)'}
                </span>
              </label>
            </div>
          </Section>

          {/* Section 5: Amenities */}
          <Section title="Amenities" number="5">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {AMENITY_OPTIONS.map(a => (
                <label key={a} className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedAmenities.includes(a) ? 'bg-secondary border-secondary' : 'border-gray-300 group-hover:border-secondary/50'
                  }`}>
                    {selectedAmenities.includes(a) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700" onClick={() => toggleAmenity(a)}>{a}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                className="input flex-1 text-sm"
                value={customAmenity}
                onChange={e => setCustomAmenity(e.target.value)}
                placeholder="Add custom amenity…"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
              />
              <button type="button" onClick={addCustomAmenity} className="btn-outline px-4 py-2 text-sm">Add</button>
            </div>

            {selectedAmenities.filter(a => !AMENITY_OPTIONS.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedAmenities.filter(a => !AMENITY_OPTIONS.includes(a)).map(a => (
                  <span key={a} className="bg-secondary/10 text-secondary text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                    {a}
                    <button type="button" onClick={() => toggleAmenity(a)} className="hover:text-red-500 text-base leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Section 6: Photos */}
          <Section title="Property Photos" number="6">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-colors bg-gray-50">
              <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoChange} />
              <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">Drag or click to upload photos</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — max 5MB each</p>
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {photos.map((f, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(f)} className="w-full aspect-square object-cover rounded-xl" alt="" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-md">Cover</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Use clear, well-lit photos. Listings with quality photos get rented or sold faster.
            </p>
          </Section>

          <button className="btn-primary w-full py-3.5 text-base" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, number, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}
