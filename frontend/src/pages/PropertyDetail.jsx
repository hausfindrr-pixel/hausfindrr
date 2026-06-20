import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/shared/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MessageThread from '../components/tenant/MessageThread';

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

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => { setProperty(r.data.property); setUnlocked(r.data.unlocked); })
      .catch(() => navigate('/browse'))
      .finally(() => setLoading(false));
  }, [id]);

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
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center py-20 text-gray-400">Loading…</div>
    </div>
  );
  if (!property) return null;

  const photos = property.photos || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/browse" className="text-secondary text-sm hover:underline mb-4 inline-block">← Back to listings</Link>

        {/* Photo Gallery */}
        <div className="card overflow-hidden mb-6">
          <div className="relative h-72 bg-gray-200">
            {photos.length > 0 ? (
              <img src={`/uploads/photos/${photos[activePhoto].filePath.split('/').pop()}`}
                className="w-full h-full object-cover" alt={property.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🏠</div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-md uppercase">
                {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {photos.map((ph, i) => (
                <img key={i}
                  src={`/uploads/photos/${ph.filePath.split('/').pop()}`}
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 ${i === activePhoto ? 'ring-2 ring-secondary' : 'opacity-70'}`}
                  alt="" />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-5">
            <div className="card p-5">
              <h1 className="text-2xl font-bold text-primary mb-1">{property.title}</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">📍 {property.locationGeneral}</p>
              <p className="text-3xl font-extrabold text-secondary">K{Number(property.price).toLocaleString()}</p>
              <div className="flex gap-4 mt-3 text-sm text-gray-600">
                <span>🛏 {property.bedrooms} bedrooms</span>
                <span>🚿 {property.bathrooms} bathrooms</span>
                <span className="capitalize">🏘 {property.propertyType}</span>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-primary mb-2">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            {property.amenities?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-primary mb-3">Amenities</h2>
                <div className="grid grid-cols-2 gap-2">
                  {property.amenities.map(a => (
                    <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-secondary">✓</span> {a.amenityName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlocked: exact address + landlord */}
            {unlocked && property.locationExact && (
              <div className="card p-5 border-l-4 border-secondary">
                <h2 className="font-semibold text-primary mb-2">Full Address</h2>
                <p className="text-gray-700">{property.locationExact}</p>
              </div>
            )}

            {unlocked && property.landlord && (
              <div className="card p-5">
                <h2 className="font-semibold text-primary mb-3">Landlord Contact</h2>
                <p className="font-medium">{property.landlord.name}</p>
                <p className="text-gray-500 text-sm">{property.landlord.phone}</p>
                <p className="text-gray-500 text-sm">{property.landlord.email}</p>
              </div>
            )}

            {/* Messages */}
            {unlocked && user?.role === 'tenant' && property.landlord && (
              <div className="card overflow-hidden">
                <button onClick={() => setShowMessages(!showMessages)}
                  className="w-full p-4 text-left font-semibold text-primary flex items-center justify-between hover:bg-gray-50">
                  💬 Message Landlord
                  <span>{showMessages ? '▲' : '▼'}</span>
                </button>
                {showMessages && (
                  <MessageThread propertyId={id} otherUserId={property.landlord.id} otherName={property.landlord.name} />
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Unlock */}
          <div className="space-y-4">
            {!unlocked ? (
              <div className="card p-5">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🔒</div>
                  <h3 className="font-bold text-primary">Unlock Full Details</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Pay K25 to reveal the exact address, landlord contact, and open a conversation.
                  </p>
                  <p className="text-2xl font-extrabold text-secondary mt-3">K25.00</p>
                </div>

                {/* Blurred preview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                  <div className="h-3 bg-gray-300 rounded blur-sm" />
                  <div className="h-3 bg-gray-200 rounded blur-sm w-3/4" />
                  <div className="h-3 bg-gray-300 rounded blur-sm w-1/2" />
                </div>

                {!showPayment ? (
                  <button onClick={() => user ? setShowPayment(true) : navigate('/tenant/login')}
                    className="btn-secondary w-full">
                    {user ? 'Unlock Now — K25' : 'Sign in to Unlock'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Card Details</p>
                    <input className="input text-sm" placeholder="Card number" maxLength={19}
                      value={card.number} onChange={setCard_('number')} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="MM/YY" value={card.expiry} onChange={setCard_('expiry')} />
                      <input className="input text-sm" placeholder="CVV" maxLength={4} value={card.cvv} onChange={setCard_('cvv')} />
                    </div>
                    <input className="input text-sm" placeholder="Name on card" value={card.name} onChange={setCard_('name')} />
                    <button onClick={handleUnlock} disabled={paying || !card.number}
                      className="btn-secondary w-full">
                      {paying ? 'Processing…' : 'Pay K25 & Unlock'}
                    </button>
                    <button onClick={() => setShowPayment(false)} className="text-gray-400 text-xs w-full text-center hover:text-gray-600">
                      Cancel
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      Simulated payment — use any card number not ending in 0000 to test success
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-5 border-2 border-green-300 bg-green-50">
                <div className="text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-semibold text-green-800">Unlocked</p>
                  <p className="text-green-600 text-sm">Full details visible below</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
