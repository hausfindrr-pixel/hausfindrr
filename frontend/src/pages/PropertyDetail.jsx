import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MessageThread from '../components/tenant/MessageThread';
import { priceLabel } from '../utils/format';

const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showMobilePayment, setShowMobilePayment] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [paying, setPaying] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const fuzzyMapRef = useRef(null);
  const fuzzyLeafletRef = useRef(null);
  const exactMapRef = useRef(null);
  const exactLeafletRef = useRef(null);
  const exactOsmLayerRef = useRef(null);
  const exactSatLayerRef = useRef(null);
  const [isSatelliteExact, setIsSatelliteExact] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => { setProperty(r.data.property); setUnlocked(r.data.unlocked); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!property || unlocked || !fuzzyMapRef.current) return;
    if (fuzzyLeafletRef.current) return;
    const lat = property.approxLat;
    const lng = property.approxLng;
    if (!lat || !lng) return;

    async function initFuzzyMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      const map = L.map(fuzzyMapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([lat, lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      L.circle([lat, lng], { color: '#975536', fillColor: '#975536', fillOpacity: 0.15, radius: 1000 }).addTo(map);
      fuzzyLeafletRef.current = map;
    }

    initFuzzyMap().catch(console.error);
    return () => {
      if (fuzzyLeafletRef.current) { fuzzyLeafletRef.current.remove(); fuzzyLeafletRef.current = null; }
    };
  }, [property, unlocked]);

  useEffect(() => {
    if (!property || !unlocked || !exactMapRef.current) return;
    if (exactLeafletRef.current) return;
    const lat = property.locationLat;
    const lng = property.locationLng;
    if (!lat || !lng) return;

    async function initExactMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(exactMapRef.current, { scrollWheelZoom: false }).setView([lat, lng], 16);

      exactOsmLayerRef.current = L.tileLayer(OSM_TILE_URL, {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      exactSatLayerRef.current = L.tileLayer(SAT_TILE_URL, {
        attribution: 'Tiles &copy; Esri',
      });

      L.marker([lat, lng]).addTo(map);
      exactLeafletRef.current = map;
    }

    initExactMap().catch(console.error);
    return () => {
      if (exactLeafletRef.current) { exactLeafletRef.current.remove(); exactLeafletRef.current = null; }
    };
  }, [property, unlocked]);

  function toggleExactSatellite() {
    const map = exactLeafletRef.current;
    if (!map) return;
    if (isSatelliteExact) {
      if (exactSatLayerRef.current) map.removeLayer(exactSatLayerRef.current);
      if (exactOsmLayerRef.current) exactOsmLayerRef.current.addTo(map);
    } else {
      if (exactOsmLayerRef.current) map.removeLayer(exactOsmLayerRef.current);
      if (exactSatLayerRef.current) exactSatLayerRef.current.addTo(map);
    }
    setIsSatelliteExact(s => !s);
  }

  async function handleUnlock() {
    if (!user) return navigate('/tenant/login');
    setPaying(true);
    try {
      const { data } = await api.post(`/tenant/unlock/${id}`, {
        cardNumber: card.number, cardExpiry: card.expiry, cardCvv: card.cvv, cardName: card.name,
      });
      if (data.unlocked || data.already_unlocked) {
        toast.success('Property unlocked! Full details revealed.');
        const r = await api.get(`/properties/${id}`);
        setProperty(r.data.property);
        setUnlocked(true);
        setShowPayment(false);
        setShowMobilePayment(false);
        setShowMessages(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    const photos = property?.photos || [];
    if (dx < 0) setActivePhoto(p => Math.min(p + 1, photos.length - 1));
    else setActivePhoto(p => Math.max(p - 1, 0));
  }

  const setCard_ = k => e => setCard(p => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-64 sm:h-80 bg-gray-200 animate-pulse rounded-2xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
          </div>
          <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!property) return null;

  const photos = property.photos || [];
  const hasCoords = property.locationLat && property.locationLng;
  const hasApprox = property.approxLat && property.approxLng;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${!unlocked ? 'pb-36 md:pb-8' : 'pb-24 md:pb-8'}`}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        {/* Photo carousel */}
        <div className="mb-5">
          {/* Main photo — swipeable on mobile */}
          <div
            className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-sm"
            style={{ paddingBottom: photos.length > 0 ? '58%' : '40%' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {photos.length > 0 ? (
              <img
                src={photos[activePhoto].filePath}
                className="absolute inset-0 w-full h-full object-cover select-none"
                alt={property.title}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}

            {/* Listing type badge */}
            <div className="absolute top-4 left-4">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${property.listingType === 'rent' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
                {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>

            {/* Photo counter — mobile only */}
            {photos.length > 1 && (
              <div className="md:hidden absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {activePhoto + 1} / {photos.length}
              </div>
            )}

            {/* Swipe arrows — desktop only */}
            {photos.length > 1 && (
              <>
                {activePhoto > 0 && (
                  <button
                    onClick={() => setActivePhoto(p => p - 1)}
                    className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full items-center justify-center shadow hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {activePhoto < photos.length - 1 && (
                  <button
                    onClick={() => setActivePhoto(p => p + 1)}
                    className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full items-center justify-center shadow hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Dots indicator — mobile only */}
          {photos.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-2.5 md:hidden">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`rounded-full transition-all ${
                    i === activePhoto ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Thumbnails — desktop only */}
          {photos.length > 1 && (
            <div className="hidden md:flex gap-2 mt-2.5 overflow-x-auto scrollbar-hide">
              {photos.map((ph, i) => (
                <img
                  key={i}
                  src={ph.filePath}
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-12 object-cover rounded-xl cursor-pointer flex-shrink-0 transition-all ${
                    i === activePhoto ? 'ring-2 ring-secondary opacity-100' : 'opacity-60 hover:opacity-80'
                  }`}
                  alt=""
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main content */}
          <div className="md:col-span-2 space-y-4">

            {/* Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 mb-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property.locationGeneral}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
                {priceLabel(property.price, property.listingType, property.rentFrequency)}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {/* House / Apartment: beds + baths */}
                {['house', 'apartment'].includes(property.propertyType) && (
                  <>
                    {property.bedrooms != null && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                    {property.bathrooms != null && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        {property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                  </>
                )}
                {/* Land metadata */}
                {property.propertyType === 'land' && property.metadata && (
                  <>
                    {property.metadata.landSize && <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>{property.metadata.landSize}</span>}
                    {property.metadata.landType && <span className="capitalize">{property.metadata.landType} land</span>}
                    {property.metadata.titleType && <span>{property.metadata.titleType} title</span>}
                  </>
                )}
                {/* Commercial metadata */}
                {property.propertyType === 'commercial' && property.metadata && (
                  <>
                    {property.metadata.floorArea && <span>{property.metadata.floorArea} floor area</span>}
                    {property.metadata.commercialType && <span className="capitalize">{property.metadata.commercialType}</span>}
                    {property.metadata.floorLevel && <span>{property.metadata.floorLevel}</span>}
                  </>
                )}
                <span className="capitalize flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {property.propertyType}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">What this place offers</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map(a => (
                    <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {a.amenityName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlocked: exact address */}
            {unlocked && property.locationExact && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-secondary border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Exact Address
                </h2>
                <p className="text-gray-700 font-medium text-sm">{property.locationExact}</p>
              </div>
            )}

            {/* Unlocked: type-specific metadata details */}
            {unlocked && property.propertyType === 'land' && property.metadata && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">Land Details</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {property.metadata.landSize && <MetaItem label="Land Size" value={property.metadata.landSize} />}
                  {property.metadata.landType && <MetaItem label="Terrain" value={property.metadata.landType} />}
                  {property.metadata.titleType && <MetaItem label="Title Type" value={property.metadata.titleType} />}
                  <MetaItem label="Fenced" value={property.metadata.fenced ? 'Yes' : 'No'} />
                  <MetaItem label="Road Access" value={property.metadata.roadAccess ? 'Yes' : 'No'} />
                  <MetaItem label="Water Available" value={property.metadata.water ? 'Yes' : 'No'} />
                  <MetaItem label="Electricity" value={property.metadata.electricity ? 'Yes' : 'No'} />
                </div>
              </div>
            )}
            {unlocked && property.propertyType === 'commercial' && property.metadata && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">Commercial Details</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {property.metadata.floorArea && <MetaItem label="Floor Area" value={property.metadata.floorArea} />}
                  {property.metadata.commercialType && <MetaItem label="Type" value={property.metadata.commercialType} />}
                  {property.metadata.floorLevel && <MetaItem label="Floor Level" value={property.metadata.floorLevel} />}
                  {property.metadata.rooms && <MetaItem label="Rooms" value={property.metadata.rooms} />}
                  {property.metadata.cubicles && <MetaItem label="Cubicles" value={property.metadata.cubicles} />}
                  {property.metadata.toilets && <MetaItem label="Toilets" value={property.metadata.toilets} />}
                  {property.metadata.parking && <MetaItem label="Parking Spaces" value={property.metadata.parking} />}
                </div>
              </div>
            )}
            {unlocked && property.propertyType === 'other' && property.metadata?.otherDescription && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">Property Details</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{property.metadata.otherDescription}</p>
              </div>
            )}

            {/* Unlocked: Leaflet exact map with satellite toggle */}
            {unlocked && hasCoords && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Property Location</h2>
                  <button
                    onClick={toggleExactSatellite}
                    className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isSatelliteExact ? 'Map View' : 'Satellite'}
                  </button>
                </div>
                <div ref={exactMapRef} style={{ height: 300 }} />
              </div>
            )}

            {/* Unlocked: landlord contact */}
            {unlocked && property.landlord && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">Landlord Contact</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-lg">{property.landlord.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{property.landlord.name}</p>
                    <p className="text-gray-500 text-sm">{property.landlord.phone}</p>
                    <p className="text-gray-500 text-sm">{property.landlord.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {unlocked && user?.role === 'tenant' && property.landlord && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className="w-full px-5 py-4 text-left font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message Landlord
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showMessages ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMessages && (
                  <MessageThread
                    propertyId={id}
                    otherUserId={property.landlord.id}
                    otherName={property.landlord.name}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:sticky md:top-24 self-start space-y-4">
            {!unlocked ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                {/* Fuzzy map */}
                {hasApprox && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Approximate Area</p>
                    <div ref={fuzzyMapRef} className="w-full rounded-xl overflow-hidden border border-gray-100" style={{ height: 150 }} />
                    <p className="text-xs text-gray-400 mt-1">Exact location revealed after unlock</p>
                  </div>
                )}

                {/* Blurred landlord preview */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Landlord Info</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded blur-sm w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded blur-sm w-1/2" />
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded blur-sm" />
                  <div className="h-2.5 bg-gray-100 rounded blur-sm w-2/3" />
                </div>

                <div className="text-center mb-5">
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Unlock Full Details</h3>
                  <p className="text-gray-500 text-sm">Exact address, landlord contact, and messaging</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-3">K25</p>
                  <p className="text-xs text-gray-400">one-time payment</p>
                </div>

                {!showPayment ? (
                  <button
                    onClick={() => user ? setShowPayment(true) : navigate('/tenant/login')}
                    className="btn-secondary w-full py-3"
                  >
                    {user ? 'Unlock Now — K25' : 'Sign in to Unlock'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Card Details</p>
                    <input className="input text-sm" placeholder="Card number" maxLength={19} value={card.number} onChange={setCard_('number')} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="MM/YY" value={card.expiry} onChange={setCard_('expiry')} />
                      <input className="input text-sm" placeholder="CVV" maxLength={4} value={card.cvv} onChange={setCard_('cvv')} />
                    </div>
                    <input className="input text-sm" placeholder="Name on card" value={card.name} onChange={setCard_('name')} />
                    <button onClick={handleUnlock} disabled={paying || !card.number} className="btn-secondary w-full py-3">
                      {paying ? 'Processing…' : 'Pay K25 & Unlock'}
                    </button>
                    <button onClick={() => setShowPayment(false)} className="text-gray-400 text-xs w-full text-center hover:text-gray-600 py-1">
                      Cancel
                    </button>
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Simulated payment — use any card number <em>not</em> ending in 0000 to test success
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 rounded-2xl p-5 border border-green-200 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-green-800 mb-1">Unlocked</p>
                <p className="text-green-600 text-sm">Full details are visible</p>
                {!showMessages && (
                  <button
                    onClick={() => setShowMessages(true)}
                    className="mt-4 w-full bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
                  >
                    Open Chat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky unlock button — fixed above bottom nav */}
      {!unlocked && (
        <div
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 px-4 pt-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => user ? setShowMobilePayment(true) : navigate('/tenant/login')}
            className="w-full py-3.5 bg-secondary text-white rounded-xl text-base font-semibold hover:bg-secondary/90 transition-colors shadow-sm"
          >
            {user ? 'Unlock Landlord Details — K25' : 'Sign In to Unlock — K25'}
          </button>
        </div>
      )}

      {/* Mobile payment bottom sheet */}
      {showMobilePayment && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobilePayment(false)} />
          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl px-6 pb-8 pt-4">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Unlock Property</h3>
              <button onClick={() => setShowMobilePayment(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mb-5 bg-gray-50 rounded-2xl p-4">
              <div>
                <p className="text-sm text-gray-600">One-time unlock fee</p>
                <p className="text-xs text-gray-400">Reveals landlord contact &amp; exact address</p>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">K25</p>
            </div>
            <div className="space-y-3">
              <input className="input text-sm" placeholder="Card number" maxLength={19} value={card.number} onChange={setCard_('number')} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input text-sm" placeholder="MM/YY" value={card.expiry} onChange={setCard_('expiry')} />
                <input className="input text-sm" placeholder="CVV" maxLength={4} value={card.cvv} onChange={setCard_('cvv')} />
              </div>
              <input className="input text-sm" placeholder="Name on card" value={card.name} onChange={setCard_('name')} />
              <button
                onClick={handleUnlock}
                disabled={paying || !card.number}
                className="btn-secondary w-full py-3.5 text-base mt-2"
              >
                {paying ? 'Processing…' : 'Pay K25 & Unlock'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Simulated payment — use any card number not ending in 0000
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}
