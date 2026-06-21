import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MessageThread from '../components/tenant/MessageThread';
import { priceLabel } from '../utils/format';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [paying, setPaying] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const fuzzyMapRef = useRef(null);
  const fuzzyLeafletRef = useRef(null);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => { setProperty(r.data.property); setUnlocked(r.data.unlocked); })
      .catch(() => navigate('/browse'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fuzzy map (before unlock)
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

      // Approximate circle overlay — not a precise pin
      L.circle([lat, lng], {
        color: '#975536',
        fillColor: '#975536',
        fillOpacity: 0.15,
        radius: 1000,
      }).addTo(map);

      fuzzyLeafletRef.current = map;
    }

    initFuzzyMap().catch(console.error);

    return () => {
      if (fuzzyLeafletRef.current) {
        fuzzyLeafletRef.current.remove();
        fuzzyLeafletRef.current = null;
      }
    };
  }, [property, unlocked]);

  async function handleUnlock() {
    if (!user) return navigate('/tenant/login');
    setPaying(true);
    try {
      const { data } = await api.post(`/tenant/unlock/${id}`, {
        cardNumber: card.number, cardExpiry: card.expiry,
        cardCvv: card.cvv, cardName: card.name,
      });
      if (data.unlocked || data.already_unlocked) {
        toast.success('Property unlocked! Full details revealed.');
        const r = await api.get(`/properties/${id}`);
        setProperty(r.data.property);
        setUnlocked(true);
        setShowPayment(false);
        setShowMessages(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  const setCard_ = k => e => setCard(p => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-80 bg-gray-200 animate-pulse rounded-2xl mb-6" />
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        {/* Photo gallery */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
          <div className="relative bg-gray-100" style={{ paddingBottom: photos.length > 0 ? '55%' : '40%' }}>
            {photos.length > 0 ? (
              <img
                src={photos[activePhoto].filePath}
                className="absolute inset-0 w-full h-full object-cover"
                alt={property.title}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${property.listingType === 'rent' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
                {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
              {photos.map((ph, i) => (
                <img
                  key={i}
                  src={ph.filePath}
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-12 object-cover rounded-xl cursor-pointer flex-shrink-0 transition-all ${i === activePhoto ? 'ring-2 ring-secondary opacity-100' : 'opacity-60 hover:opacity-80'}`}
                  alt=""
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property.locationGeneral}
              </p>
              <p className="text-3xl font-extrabold text-gray-900 mb-4">{priceLabel(property.price, property.listingType, property.rentFrequency)}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {property.bedrooms} Bedrooms
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  {property.bathrooms} Bathrooms
                </span>
                <span className="capitalize flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {property.propertyType}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">What this place offers</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map(a => (
                    <div key={a.id} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-secondary border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Exact Address
                </h2>
                <p className="text-gray-700 font-medium">{property.locationExact}</p>
              </div>
            )}

            {/* Unlocked: Google Maps embed */}
            {unlocked && hasCoords && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900">Property Location</h2>
                </div>
                <iframe
                  src={`https://maps.google.com/maps?q=${property.locationLat},${property.locationLng}&output=embed`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Property location map"
                />
              </div>
            )}

            {/* Unlocked: landlord contact */}
            {unlocked && property.landlord && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50 transition-colors"
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                {/* Fuzzy map */}
                {hasApprox && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Approximate Area</p>
                    <div
                      ref={fuzzyMapRef}
                      className="w-full rounded-xl overflow-hidden border border-gray-100"
                      style={{ height: 160 }}
                    />
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
                    <input
                      className="input text-sm"
                      placeholder="Card number"
                      maxLength={19}
                      value={card.number}
                      onChange={setCard_('number')}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="MM/YY" value={card.expiry} onChange={setCard_('expiry')} />
                      <input className="input text-sm" placeholder="CVV" maxLength={4} value={card.cvv} onChange={setCard_('cvv')} />
                    </div>
                    <input className="input text-sm" placeholder="Name on card" value={card.name} onChange={setCard_('name')} />
                    <button
                      onClick={handleUnlock}
                      disabled={paying || !card.number}
                      className="btn-secondary w-full py-3"
                    >
                      {paying ? 'Processing…' : 'Pay K25 & Unlock'}
                    </button>
                    <button
                      onClick={() => setShowPayment(false)}
                      className="text-gray-400 text-xs w-full text-center hover:text-gray-600 py-1"
                    >
                      Cancel
                    </button>
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Simulated payment — use any card number <em>not</em> ending in 0000 to test success
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
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
    </div>
  );
}
