import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MessageThread from '../components/tenant/MessageThread';
import FeedbackBubble from '../components/shared/FeedbackBubble';
import GuideBox from '../components/shared/GuideBox';
import { priceLabel } from '../utils/format';

const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState('listing_details_incorrect');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const osmLayerRef = useRef(null);
  const satLayerRef = useRef(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => setProperty(r.data.property))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!property || !mapRef.current) return;
    if (leafletRef.current) return;
    const lat = property.locationLat;
    const lng = property.locationLng;
    if (!lat || !lng) return;

    async function initMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([lat, lng], 16);

      osmLayerRef.current = L.tileLayer(OSM_TILE_URL, {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      satLayerRef.current = L.tileLayer(SAT_TILE_URL, {
        attribution: 'Tiles &copy; Esri',
      });

      L.marker([lat, lng]).addTo(map);
      leafletRef.current = map;
    }

    initMap().catch(console.error);
    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, [property]);

  function toggleSatellite() {
    const map = leafletRef.current;
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

  async function handleReport(e) {
    e.preventDefault();
    if (!reportDetails.trim()) return toast.error('Please describe the issue');
    setReportLoading(true);
    try {
      await api.post('/complaints', {
        propertyId: id,
        landlordId: property?.landlord?.id || null,
        type: reportType,
        details: reportDetails,
        context: 'listing',
      });
      toast.success('Report submitted. Thank you.');
      setShowReport(false);
      setReportDetails('');
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  }

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
  const hasLandlord = !!property.landlord;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        {/* Photo carousel */}
        <div className="mb-5">
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

            <div className="absolute top-4 left-4">
              <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-primary text-white">
                For Rent
              </span>
            </div>

            {photos.length > 1 && (
              <div className="md:hidden absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {activePhoto + 1} / {photos.length}
              </div>
            )}

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

            {/* Exact address — visible to signed-in tenants */}
            {property.locationExact && (
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

            {/* Map — visible to signed-in tenants */}
            {hasCoords && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Property Location</h2>
                  <button
                    onClick={toggleSatellite}
                    className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isSatellite ? 'Map View' : 'Satellite'}
                  </button>
                </div>
                <div ref={mapRef} style={{ height: 300 }} />
              </div>
            )}

            {/* Landlord contact — visible to signed-in tenants */}
            {hasLandlord && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">Landlord Contact</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-lg">{property.landlord.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{property.landlord.name}</p>
                      {property.landlordVerified && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {property.landlordVerified && (
                  <p className="text-xs text-gray-400 mt-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2 leading-relaxed">
                    HausFindrr has reviewed and accepted this landlord&apos;s identity documents. This does not guarantee the accuracy of this listing or confirm ownership of the property. Always verify in person before signing any agreement.
                  </p>
                )}
                <GuideBox guideKey="propertyContact" className="mt-3" />
              </div>
            )}

            {/* Messages */}
            {hasLandlord && user?.role === 'tenant' && (
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
            {hasLandlord ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Landlord</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">{property.landlord.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{property.landlord.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMessages(true)}
                  className="btn-secondary w-full py-2.5 text-sm"
                >
                  Send a Message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">Sign in to view landlord details</h3>
                <p className="text-gray-500 text-xs mb-4">Create a free account to message the landlord.</p>
                <Link to="/tenant/register" className="btn-secondary w-full py-2.5 text-sm block text-center">
                  Sign up — it's free
                </Link>
                <Link to="/tenant/login" className="text-xs text-gray-400 hover:text-gray-600 mt-2 block">
                  Already have an account? Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasLandlord && user?.role === 'tenant' && property?.landlord && (
        <FeedbackBubble
          mode="landlord"
          landlordId={property.landlord.id}
          propertyId={id}
        />
      )}

      {/* Report button — visible to signed-in tenants */}
      {user?.role === 'tenant' && (
        <div className="max-w-5xl mx-auto px-4 pb-6 flex justify-end">
          <button
            onClick={() => setShowReport(true)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.072 16.5C3.302 18.333 4.264 20 5.804 20z" />
            </svg>
            Report this listing
          </button>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Report Listing</h2>
              <button onClick={() => setShowReport(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="label">What is the issue?</label>
                <select
                  className="input"
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                >
                  <option value="listing_details_incorrect">Listing details are incorrect</option>
                  <option value="landlord_not_responding">Landlord is not responding</option>
                  <option value="suspicious_activity">Suspicious or fraudulent activity</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Describe the issue</label>
                <textarea
                  className="input h-24 resize-none"
                  required
                  placeholder="Please describe what you observed…"
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReport(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={reportLoading} className="flex-[2] btn-primary py-2.5 text-sm">
                  {reportLoading ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
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
