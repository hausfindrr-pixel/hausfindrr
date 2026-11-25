import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/shared/Navbar';
import api from '../../services/api';
import { PNG_CITIES } from '../../constants/pngCities';
import { LISTING_TAGS } from '../../constants/listingTags';
import { LANDMARKS, haversineKm } from '../../constants/landmarks';

const DEFAULT_LAT = -9.4438;
const DEFAULT_LNG = 147.1803;

const AMENITY_OPTIONS = [
  'Parking', 'Water Tank', 'Generator/Backup Power', 'Security/Fenced Compound',
  'Furnished', 'WiFi/Internet Ready', 'Kitchen', 'Aircon',
];

const PROPERTY_TYPES = [
  { value: 'house',      label: 'House' },
  { value: 'apartment',  label: 'Apartment' },
];

const PHOTO_SLOTS = ['Front', 'Back', 'Living', 'Kitchen', 'Bedroom', 'Bathroom'];

const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTRIBUTION = 'Tiles &copy; Esri';
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const EMPTY_FORM = {
  listingType: 'rent',
  title: '',
  description: '',
  price: '',
  rentFrequency: 'monthly',
  locationGeneral: '',
  locationExact: '',
  propertyType: 'house',
  bedrooms: '1',
  bathrooms: '1',
  furnishing: '',
  floorLevel: '',
  parkingAvailable: '',
};

async function compressPhoto(file, maxWidth = 1600) {
  return new Promise(resolve => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(src);
      const ratio = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        resolve({ file: compressed, width: w, height: h, label: '', preview: URL.createObjectURL(blob) });
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      resolve({ file, width: 0, height: 0, label: '', preview: URL.createObjectURL(file) });
    };
    img.src = src;
  });
}

export default function LandlordNewListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [titleDocs, setTitleDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [pinLat, setPinLat] = useState(DEFAULT_LAT);
  const [pinLng, setPinLng] = useState(DEFAULT_LNG);
  const [mapReady, setMapReady] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [cityChoice, setCityChoice] = useState('');

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const osmLayerRef = useRef(null);
  const satLayerRef = useRef(null);
  const dismissedRef = useRef([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const pt = form.propertyType;

  function toggleAmenity(a) {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  }

  function toggleTag(t) {
    const isSuggested = suggestedTags.some(s => s.tag === t);
    if (selectedTags.includes(t)) {
      setSelectedTags(prev => prev.filter(x => x !== t));
      if (isSuggested && !dismissedRef.current.includes(t)) {
        dismissedRef.current = [...dismissedRef.current, t];
      }
    } else {
      setSelectedTags(prev => [...prev, t]);
      dismissedRef.current = dismissedRef.current.filter(x => x !== t);
    }
  }

  function addCustomAmenity() {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities(prev => [...prev, trimmed]);
    }
    setCustomAmenity('');
  }

  // Map init
  useEffect(() => {
    let map;
    async function initMap() {
      if (!mapRef.current || leafletMapRef.current) return;
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      map = L.map(mapRef.current).setView([DEFAULT_LAT, DEFAULT_LNG], 13);

      osmLayerRef.current = L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
      satLayerRef.current = L.tileLayer(SAT_TILE_URL, { attribution: SAT_ATTRIBUTION });

      const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPinLat(parseFloat(pos.lat.toFixed(6)));
        setPinLng(parseFloat(pos.lng.toFixed(6)));
      });
      map.on('click', e => {
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
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  // Landmark suggestions on pin change
  useEffect(() => {
    const inRange = LANDMARKS
      .map(lm => ({ ...lm, distKm: haversineKm(pinLat, pinLng, lm.lat, lm.lng) }))
      .filter(lm => lm.distKm <= lm.radiusKm)
      .sort((a, b) => a.distKm - b.distKm);

    setSuggestedTags(inRange);

    setSelectedTags(prev => {
      const dismissed = dismissedRef.current;
      const toAdd = inRange
        .filter(lm => !dismissed.includes(lm.tag) && !prev.includes(lm.tag))
        .map(lm => lm.tag);
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  }, [pinLat, pinLng]);

  function toggleSatellite() {
    const map = leafletMapRef.current;
    if (!map) return;
    if (isSatellite) {
      if (satLayerRef.current) map.removeLayer(satLayerRef.current);
      if (osmLayerRef.current) osmLayerRef.current.addTo(map);
    } else {
      if (osmLayerRef.current) map.removeLayer(osmLayerRef.current);
      if (satLayerRef.current) satLayerRef.current.addTo(map);
    }
    setIsSatellite(s => !s);
  }

  function buildMetadata() {
    return {
      furnishing: form.furnishing || null,
      floorLevel: form.floorLevel || null,
      parkingAvailable: form.parkingAvailable || null,
      tags: selectedTags.length > 0 ? selectedTags : null,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cityChoice) return toast.error('Please select a city for your listing');
    if (cityChoice === '__other__' && !form.locationGeneral.trim()) return toast.error('Please enter your city or town name');
    if (photos.length === 0) return toast.error('Please add at least one property photo');
    if (titleDocs.length === 0) return toast.error('Please upload your property title document');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('listingType', form.listingType);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('rentFrequency', form.rentFrequency);
      fd.append('locationGeneral', form.locationGeneral);
      fd.append('locationExact', form.locationExact);
      fd.append('propertyType', form.propertyType);
      fd.append('bedrooms', form.bedrooms);
      fd.append('bathrooms', form.bathrooms);
      fd.append('amenities', JSON.stringify(selectedAmenities));
      fd.append('metadata', JSON.stringify(buildMetadata()));
      fd.append('location_lat', pinLat.toString());
      fd.append('location_lng', pinLng.toString());
      photos.forEach(p => fd.append('photos', p.file));
      titleDocs.forEach(f => fd.append('title_documents', f));
      supportingDocs.forEach(f => fd.append('title_documents', f));

      await api.post('/properties', fd);
      toast.success('Listing submitted for review!');
      sessionStorage.setItem('hf_just_published', '1');
      navigate('/landlord/properties');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const compressed = await Promise.all(files.map(f => compressPhoto(f)));
    setPhotos(prev => [...prev, ...compressed].slice(0, 20));
    e.target.value = '';
  }

  function removePhoto(index) {
    URL.revokeObjectURL(photos[index].preview);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  const fewPhotos = photos.length > 0 && photos.length < 5;
  const portraitCover = photos[0]?.height > photos[0]?.width;
  const hasNarrow = photos.some(p => p.width > 0 && p.width < 800);

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
            <div>
              <label className="label">Listing Type</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                {[{ value: 'rent', label: 'For Rent' }].map(t => (
                  <button
                    key={t.value} type="button"
                    onClick={() => setForm(p => ({ ...p, listingType: t.value }))}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.listingType === t.value ? 'bg-white text-primary shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >{t.label}</button>
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
                Keep your description general. Avoid sharing exact addresses or contact details here.
              </p>
            </div>

            <div>
              <label className="label">Price (Kina)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">K</span>
                  <input className="input pl-8" type="number" required min="1" value={form.price} onChange={set('price')} placeholder="0" />
                </div>
                {form.listingType === 'rent' && (
                  <select className="input w-auto flex-shrink-0" value={form.rentFrequency} onChange={set('rentFrequency')}>
                    <option value="weekly">/ week</option>
                    <option value="fortnightly">/ fortnight</option>
                    <option value="monthly">/ month</option>
                  </select>
                )}
              </div>
            </div>
          </Section>

          {/* Section 2: Property details */}
          <Section title="Property Details" number="2">
            <div>
              <label className="label">Property Type</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PROPERTY_TYPES.map(t => (
                  <button
                    key={t.value} type="button"
                    onClick={() => setForm(p => ({ ...p, propertyType: t.value }))}
                    className={`py-2.5 px-2 rounded-xl border text-sm font-semibold transition-all text-center ${
                      form.propertyType === t.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >{t.label}</button>
                ))}
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

            <div>
              <label className="label">Furnishing Status</label>
              <select className="input" value={form.furnishing} onChange={set('furnishing')}>
                <option value="">Select…</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            {pt === 'apartment' && (
              <div>
                <label className="label">Floor Level</label>
                <input className="input" type="number" min="0" value={form.floorLevel} onChange={set('floorLevel')}
                  placeholder="e.g. 3" />
              </div>
            )}

            <div>
              <label className="label">Parking Available</label>
              <div className="flex gap-2">
                {['yes', 'no'].map(v => (
                  <button key={v} type="button"
                    onClick={() => setForm(p => ({ ...p, parkingAvailable: v }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-all ${
                      form.parkingAvailable === v
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >{v === 'yes' ? 'Yes' : 'No'}</button>
                ))}
              </div>
            </div>
          </Section>

          {/* Section 3: Location */}
          <Section title="Location" number="3">
            <div>
              <label className="label">City <span className="text-gray-400 font-normal">(shown publicly)</span></label>
              <select
                className="input"
                value={cityChoice}
                onChange={e => {
                  const val = e.target.value;
                  setCityChoice(val);
                  if (val !== '__other__') {
                    setForm(p => ({ ...p, locationGeneral: val }));
                  } else {
                    setForm(p => ({ ...p, locationGeneral: '' }));
                  }
                }}
              >
                <option value="">Select city…</option>
                {PNG_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
                <option value="__other__">Other city / town</option>
              </select>
              {cityChoice === '__other__' && (
                <input
                  className="input mt-2"
                  required
                  placeholder="e.g. Bulolo, Morobe Province"
                  value={form.locationGeneral}
                  onChange={set('locationGeneral')}
                />
              )}
            </div>
            <div>
              <label className="label">Exact Address <span className="text-gray-400 font-normal">(visible to signed-in tenants)</span></label>
              <input className="input" required value={form.locationExact} onChange={set('locationExact')}
                placeholder="Full street address" />
            </div>

            <div>
              <label className="label">Pin Location on Map</label>
              <p className="text-xs text-gray-400 mb-2">Click on the map or drag the pin to mark the property's exact location.</p>
              <div className="relative">
                <div
                  ref={mapRef}
                  className="w-full rounded-xl overflow-hidden border border-gray-200"
                  style={{ height: 280 }}
                />
                {mapReady && (
                  <button
                    type="button"
                    onClick={toggleSatellite}
                    className="absolute top-2 right-2 z-[1000] bg-white/90 hover:bg-white rounded-lg shadow border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isSatellite ? 'Map View' : 'Satellite'}
                  </button>
                )}
              </div>
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
              <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                titleDocs.length > 0 ? 'border-secondary bg-secondary/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}>
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
                <label key={a} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleAmenity(a)}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedAmenities.includes(a) ? 'bg-secondary border-secondary' : 'border-gray-300 group-hover:border-secondary/50'
                  }`}>
                    {selectedAmenities.includes(a) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{a}</span>
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

          {/* Section 6: Property Tags */}
          <Section title="Property Tags" number="6">
            <p className="text-xs text-gray-500 -mt-1">
              Tags help tenants discover your listing. Select all that apply — tags only appear in search once enough listings use them.
            </p>

            {/* Landmark suggestions */}
            {suggestedTags.length > 0 && (
              <div className="bg-[#EDE0CE]/40 border border-[#EDE0CE] rounded-xl p-3">
                <p className="text-xs font-semibold text-[#41271B] mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#975536]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Suggested from your map pin
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map(s => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleTag(s.tag)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        selectedTags.includes(s.tag)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {s.tag}
                      <span className={`text-xs ${selectedTags.includes(s.tag) ? 'opacity-70' : 'text-gray-400'}`}>
                        {s.distKm.toFixed(1)} km
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {LISTING_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </Section>

          {/* Section 7: Photos */}
          <Section title="Property Photos" number="7">

            {/* Photo reminder */}
            <div className="bg-[#EDE0CE]/60 rounded-xl p-3 flex gap-2.5 items-start">
              <svg className="w-5 h-5 text-[#975536] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#41271B] font-medium leading-relaxed">
                  Photos sell your home. Use clear daylight shots, phone held sideways. Aim to include: front, back, living room, kitchen, bedroom, bathroom.
                </p>
                <button
                  type="button"
                  onClick={() => setTipsOpen(o => !o)}
                  className="text-xs text-[#975536] font-semibold mt-1.5 hover:underline flex items-center gap-1"
                >
                  {tipsOpen ? 'Show less' : 'More tips'}
                  <svg className={`w-3 h-3 transition-transform duration-150 ${tipsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {tipsOpen && (
                  <ul className="mt-2 text-xs text-[#41271B]/80 space-y-1 leading-relaxed">
                    <li>• Real property only — no faces, IDs or personal items in frame</li>
                    <li>• Best photo first — it becomes the cover</li>
                    <li>• 5 or more photos attract significantly more tenant enquiries</li>
                    <li>• Landscape (horizontal) photos look better on all screen sizes</li>
                  </ul>
                )}
              </div>
            </div>

            {/* Upload dropzone */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-colors bg-gray-50">
              <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoChange} />
              <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">Tap to add photos</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — compressed automatically</p>
            </label>

            {/* Checklist chips */}
            <div className="flex flex-wrap gap-1.5">
              {PHOTO_SLOTS.map(slot => {
                const done = photos.some(p => p.label === slot);
                return (
                  <span
                    key={slot}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      done
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {done ? '✓ ' : ''}{slot}
                  </span>
                );
              })}
            </div>

            {/* Thumbnail grid with label selects */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative group flex flex-col">
                    <div className="relative">
                      <img src={p.preview} className="w-full aspect-video object-cover rounded-xl" alt="" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-md">Cover</span>
                      )}
                    </div>
                    <select
                      value={p.label}
                      onChange={e => {
                        const val = e.target.value;
                        setPhotos(prev => prev.map((pp, ii) => ii === i ? { ...pp, label: val } : pp));
                      }}
                      className="mt-1 w-full text-xs rounded-lg border border-gray-200 px-1.5 py-1 bg-white text-gray-600 focus:outline-none focus:border-gray-400"
                    >
                      <option value="">Label…</option>
                      {PHOTO_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Soft warnings */}
            {fewPhotos && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Listings with 5+ photos attract more tenant enquiries. Consider adding a few more.
              </p>
            )}
            {portraitCover && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Your cover photo is portrait (vertical). Landscape photos look better as a cover.
              </p>
            )}
            {hasNarrow && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Some photos look low-resolution. Use photos taken on a modern phone for best results.
              </p>
            )}
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
