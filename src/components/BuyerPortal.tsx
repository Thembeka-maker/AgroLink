import React, { useState, useEffect } from 'react';
import { BuyerProfile, DemandRequirement, ProduceListing, FarmerProfile, DealOffer, Review } from '../types';
import { MOCK_CROPS } from '../mockData';
import { aiEngine } from '../services/aiEngine';
import {
  Plus,
  Compass,
  FileText,
  Star,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  PackageCheck,
  X,
  MessageSquare,
} from 'lucide-react';
import { formatCurrency } from '../services/currencyService';

interface BuyerPortalProps {
  activeBuyer: BuyerProfile;
  listings: ProduceListing[];
  farmers: FarmerProfile[];
  setFarmers: React.Dispatch<React.SetStateAction<FarmerProfile[]>>;
  demands: DemandRequirement[];
  setDemands: React.Dispatch<React.SetStateAction<DemandRequirement[]>>;
  deals: DealOffer[];
  setDeals: React.Dispatch<React.SetStateAction<DealOffer[]>>;
  addNotification: (userId: string, title: string, message: string, type: 'deal_offer' | 'deal_status' | 'matching_alert' | 'payment' | 'admin') => void;
  onOpenPayment: (deal: DealOffer) => void;
}

type TabType = 'post-demand' | 'explore-matches' | 'deals-orders';

export const BuyerPortal: React.FC<BuyerPortalProps> = ({
  activeBuyer,
  listings,
  farmers,
  setFarmers,
  demands,
  setDemands,
  deals,
  setDeals,
  addNotification,
  onOpenPayment,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('post-demand');

  // New Demand Form State
  const [crop, setCrop] = useState(MOCK_CROPS[0]);
  const [quantity, setQuantity] = useState<number>(1000);
  const [budget, setBudget] = useState<number>(1.40);
  const [deadline, setDeadline] = useState('');
  const [postSuccess, setPostSuccess] = useState(false);

  // Active Selected Demand for Matching
  const [selectedDemandId, setSelectedDemandId] = useState<string>('');

  // Rating Modal / State
  const [ratingDealId, setRatingDealId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');

  // View Reviews Modal for a specific farmer
  const [viewReviewsFarmer, setViewReviewsFarmer] = useState<FarmerProfile | null>(null);

  const buyerDemands = demands.filter((d) => d.buyerId === activeBuyer.id);
  const buyerDeals = deals.filter((d) => d.buyerId === activeBuyer.id);

  // Set default selected demand if demands exist
  useEffect(() => {
    if (buyerDemands.length > 0 && !selectedDemandId) {
      setSelectedDemandId(buyerDemands[0].id);
    }
  }, [buyerDemands, selectedDemandId]);

  const handlePostDemand = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDeadline = deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newDemand: DemandRequirement = {
      id: 'd_' + Date.now(),
      buyerId: activeBuyer.id,
      buyerName: activeBuyer.company,
      crop,
      quantity,
      budget,
      deadline: targetDeadline,
      location: activeBuyer.location,
      datePosted: new Date().toISOString().split('T')[0],
    };

    setDemands((prev) => [newDemand, ...prev]);
    setSelectedDemandId(newDemand.id);
    setPostSuccess(true);
    setTimeout(() => {
      setPostSuccess(false);
      setActiveTab('explore-matches');
    }, 1500);

    // AI matching alert simulation
    addNotification(
      activeBuyer.id,
      'Demand Posted',
      `Requirements for ${quantity}kg ${crop} published. AI is matching available farm listings.`,
      'matching_alert'
    );
  };

  const handleInitiateDeal = (listing: ProduceListing, _matchedScore: number) => {
    // Check if deal already exists for this listing to prevent duplicate deals
    const existing = deals.find(d => d.listingId === listing.id && d.buyerId === activeBuyer.id && d.status === 'pending');
    if (existing) {
      alert('You have already initiated a pending offer for this crop listing.');
      return;
    }

    const newDeal: DealOffer = {
      id: 'deal_' + Date.now(),
      buyerId: activeBuyer.id,
      buyerName: activeBuyer.company,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      listingId: listing.id,
      crop: listing.crop,
      quantity: Math.min(listing.quantity, quantity), // purchase listing amount or matching requirement amount
      price: listing.price, // initiate at listing price
      totalAmount: Math.min(listing.quantity, quantity) * listing.price,
      status: 'pending',
      deliveryDate: '',
      deliveryStatus: 'none',
      ratingGiven: false,
      dateCreated: new Date().toISOString().split('T')[0],
      paymentStatus: 'unpaid',
    };

    setDeals((prev) => [newDeal, ...prev]);

    // Send Notification to Farmer (Sequence Diagram: notify farmer of deal offer)
    addNotification(
      listing.farmerId,
      'New Deal Offer',
      `${activeBuyer.company} initiated an offer for ${newDeal.quantity}kg of your ${newDeal.crop} at ${formatCurrency(newDeal.price, activeBuyer.currency)}/kg.`,
      'deal_offer'
    );

    setActiveTab('deals-orders');
  };

  // Helper to trigger progress tracking steps for testing
  const advanceDeliveryStatus = (dealId: string) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          let nextStatus: typeof d.deliveryStatus = 'none';
          if (d.deliveryStatus === 'scheduled') nextStatus = 'in-transit';
          else if (d.deliveryStatus === 'in-transit') nextStatus = 'delivered';
          else return d;

          return {
            ...d,
            deliveryStatus: nextStatus,
          };
        }
        return d;
      })
    );
  };

  // Buyer confirms delivery was received
  const handleConfirmDelivery = (dealId: string) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          return { ...d, deliveryStatus: 'delivered' };
        }
        return d;
      })
    );
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      addNotification(
        deal.farmerId,
        'Delivery Confirmed',
        `${activeBuyer.company} has confirmed receipt of ${deal.quantity}kg ${deal.crop}. Transaction is now complete.`,
        'deal_status'
      );
    }
  };

  const submitFarmerRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingDealId) return;

    const deal = deals.find((d) => d.id === ratingDealId);
    if (deal) {
      const newReview: Review = {
        id: 'rev_' + Date.now(),
        buyerName: activeBuyer.company,
        rating: ratingStars,
        comment: ratingComment.trim() || 'Smooth transaction, great quality produce.',
        date: new Date().toISOString().split('T')[0],
      };

      // Update farmer rating calculation and add review in state
      setFarmers((prev) =>
        prev.map((f) => {
          if (f.id === deal.farmerId) {
            const currentTotalStars = f.rating * f.ratingCount;
            const newCount = f.ratingCount + 1;
            const newRating = parseFloat(((currentTotalStars + ratingStars) / newCount).toFixed(1));
            return {
              ...f,
              rating: newRating,
              ratingCount: newCount,
              reviews: [newReview, ...(f.reviews ?? [])],
            };
          }
          return f;
        })
      );

      // Record transaction review complete
      setDeals((prev) =>
        prev.map((d) => (d.id === ratingDealId ? { ...d, ratingGiven: true } : d))
      );

      addNotification(
        deal.farmerId,
        'Rating Received',
        `${activeBuyer.company} left a ${ratingStars} ⭐ review for your crop transaction.`,
        'deal_status'
      );
    }

    setRatingDealId(null);
    setRatingStars(5);
    setRatingComment('');
  };

  // Get current active matches — suspended farmers are filtered by aiEngine
  const currentDemand = demands.find((d) => d.id === selectedDemandId);
  const matchedResults = currentDemand
    ? aiEngine.runSmartMatching(currentDemand, listings, farmers)
    : [];

  return (
    <div className="dashboard-grid">
      {/* Sidebar Tabs */}
      <aside className="card" style={{ height: 'fit-content' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Buyer Portal</h3>
        <nav className="sidebar-tabs">
          <button
            onClick={() => setActiveTab('post-demand')}
            className={`tab-btn ${activeTab === 'post-demand' ? 'active' : ''}`}
          >
            <Plus size={18} />
            Post Demand
          </button>
          <button
            onClick={() => setActiveTab('explore-matches')}
            className={`tab-btn ${activeTab === 'explore-matches' ? 'active' : ''}`}
          >
            <Compass size={18} />
            Explore Matches
            {matchedResults.length > 0 && (
              <span className="badge-pill badge-accepted" style={{ marginLeft: 'auto' }}>
                {matchedResults.length} AI matches
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('deals-orders')}
            className={`tab-btn ${activeTab === 'deals-orders' ? 'active' : ''}`}
          >
            <FileText size={18} />
            Deals & Orders
          </button>
        </nav>
      </aside>

      {/* Main Content Workspace */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Tab 1: Post Demand Requirements */}
        {activeTab === 'post-demand' && (
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Post Sourcing Demand</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Publish your requirements. The AI Matcher will cross-reference live crops to rank local and regional farm profiles.
            </p>

            {postSuccess && (
              <div style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle size={16} /> Sourcing demand uploaded. Running smart matching algorithm...
              </div>
            )}

            <form onSubmit={handlePostDemand} autoComplete="off">
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Crop Type Required</label>
                  <select
                    className="form-control"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    autoComplete="off"
                  >
                    {MOCK_CROPS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Needed (kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    min="1"
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Budget Limit ({activeBuyer.currency} per kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={budget}
                    onChange={(e) => setBudget(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    min="0.01"
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Deadline Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                Run Smart Matching Algorithm
              </button>
            </form>

            {/* Buyer's Active Demands */}
            {buyerDemands.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Your Active Demands</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {buyerDemands.map((d) => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid var(--color-border)' }}>
                      <span style={{ fontWeight: 600 }}>{d.crop} — {d.quantity.toLocaleString()} kg</span>
                      <span style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>{formatCurrency(d.budget, activeBuyer.currency)}/kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Explore Matches / Smart Matcher */}
        {activeTab === 'explore-matches' && (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2>AI Smart Matching Engine</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Ranked active farmer crop listings matching your search demands</p>
              </div>

              {buyerDemands.length > 0 && (
                <div className="flex-gap-sm">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Requirement:</span>
                  <select
                    className="form-control"
                    style={{ width: '220px' }}
                    value={selectedDemandId}
                    onChange={(e) => setSelectedDemandId(e.target.value)}
                  >
                    {buyerDemands.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.quantity}kg {d.crop} ({formatCurrency(d.budget, activeBuyer.currency)}/kg)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {buyerDemands.length === 0 ? (
              <div style={{ padding: '3rem 0', textDecoration: 'none', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                Please "Post Demand" first to match you against registered farmers.
              </div>
            ) : matchedResults.length === 0 ? (
              <div style={{ padding: '3rem 0', textDecoration: 'none', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                No active farmers listing {currentDemand?.crop} currently. We have alerted registered growers of this crop shortage.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {matchedResults.map(({ listing, farmer, matchScore, reasons }) => {
                  const isHighMatch = matchScore >= 80;
                  const isMedMatch = matchScore >= 50 && matchScore < 80;
                  
                  return (
                    <div
                      key={listing.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        background: 'white'
                      }}
                    >
                      {/* Top Header Card */}
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div className="flex-gap-md">
                          <img src={farmer.avatar} alt={farmer.name} className="avatar" style={{ width: '40px', height: '40px' }} />
                          <div>
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>{listing.farmerName}</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} /> {listing.location}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                              <Star size={12} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{farmer.rating}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>({farmer.ratingCount} reviews)</span>
                            </div>
                          </div>
                        </div>

                        {/* Match score Badge */}
                        <div className="flex-gap-sm">
                          <button
                            onClick={() => setViewReviewsFarmer(farmer)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)', background: 'var(--color-background)',
                              cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)',
                            }}
                          >
                            <MessageSquare size={12} /> View Reviews
                          </button>
                          <div className={`match-score-badge ${isHighMatch ? 'match-high' : isMedMatch ? 'match-med' : 'match-low'}`}>
                            <TrendingUp size={14} />
                            {matchScore}% Match
                          </div>
                        </div>
                      </div>

                      {/* Detail Section */}
                      <div className="grid-cols-2" style={{ gap: '1.5rem', background: 'var(--color-background)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                        <div>
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Crop Quality / Quantity</p>
                          <strong>Grade {listing.grade} &bull; {listing.quantity.toLocaleString()} kg available</strong>
                        </div>
                        <div>
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Price Sourcing</p>
                          <strong style={{ color: 'var(--color-primary-light)', fontSize: '1.05rem' }}>
                            {formatCurrency(listing.price, activeBuyer.currency)}/kg
                          </strong>
                          {activeBuyer.currency !== 'USD' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block' }}>≈ ${listing.price.toFixed(2)} USD/kg</span>
                          )}
                        </div>
                      </div>

                      {/* Reason chips */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {reasons.map((r, i) => (
                          <span
                            key={i}
                            className="badge-pill"
                            style={{
                              backgroundColor: 'rgba(27, 77, 62, 0.05)',
                              color: 'var(--color-primary-light)',
                              fontSize: '0.7rem'
                            }}
                          >
                            &bull; {r}
                          </span>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button
                          onClick={() => handleInitiateDeal(listing, matchScore)}
                          className="btn btn-primary flex-gap-sm"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          Initiate Deal & Settle
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Deals & Orders Tracker */}
        {activeTab === 'deals-orders' && (
          <div className="card">
            <h2>Track Active Deals & Orders</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Monitor transaction statuses, delivery schedules, and rate farmers post-delivery.
            </p>

            {buyerDeals.length === 0 ? (
              <div style={{ padding: '3rem 0', textDecoration: 'none', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                You have no active deals. Go to "Explore Matches" to initiate a deal.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {buyerDeals.map((deal) => {
                  // Determine status step indices:
                  // 1: Offer Sent (Pending confirmation)
                  // 2: Accepted / Confirmed
                  // 3: Scheduled
                  // 4: In Transit
                  // 5: Delivered
                  let currentStep = 1; // Offer Sent
                  if (deal.status === 'accepted') {
                    currentStep = 2; // Confirmed
                    if (deal.deliveryStatus === 'scheduled') currentStep = 3;
                    if (deal.deliveryStatus === 'in-transit') currentStep = 4;
                    if (deal.deliveryStatus === 'delivered') currentStep = 5;
                  } else if (deal.status === 'rejected') {
                    currentStep = 0; // Rejected offer
                  }

                  const canConfirmDelivery = deal.status === 'accepted'
                    && deal.paymentStatus === 'paid'
                    && deal.deliveryStatus === 'in-transit';

                  const canRate = deal.deliveryStatus === 'delivered'
                    && deal.paymentStatus === 'paid'
                    && !deal.ratingGiven;

                  return (
                    <div
                      key={deal.id}
                      className="card"
                      style={{
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)',
                        background: 'white',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                            {deal.quantity.toLocaleString()}kg {deal.crop} Deal
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Farmer: <strong>{deal.farmerName}</strong> &bull; Date: {deal.dateCreated}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>Contract Value</span>
                          <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary-light)' }}>
                            {formatCurrency(deal.totalAmount, activeBuyer.currency)}
                          </strong>
                          {activeBuyer.currency !== 'USD' && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>
                              ≈ ${deal.totalAmount.toLocaleString()} USD
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tracker Line rendering */}
                      {deal.status !== 'rejected' ? (
                        <div style={{ margin: '2rem 0' }}>
                          <div className="step-tracker-container">
                            <div className="step-tracker-line"></div>
                            <div
                              className="step-tracker-progress"
                              style={{ width: `${((currentStep - 1) / 4) * 94}%` }}
                            ></div>

                            {/* Node 1: Offer Sent */}
                            <div className={`step-node ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
                              <div className="step-dot">
                                {currentStep > 1 ? <CheckCircle size={14} /> : '1'}
                              </div>
                              <span className="step-label">Offer Sent</span>
                            </div>

                            {/* Node 2: Confirmed */}
                            <div className={`step-node ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
                              <div className="step-dot">
                                {currentStep > 2 ? <CheckCircle size={14} /> : '2'}
                              </div>
                              <span className="step-label">Accepted</span>
                            </div>

                            {/* Node 3: Scheduled */}
                            <div className={`step-node ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
                              <div className="step-dot">
                                {currentStep > 3 ? <CheckCircle size={14} /> : '3'}
                              </div>
                              <span className="step-label">Scheduled</span>
                            </div>

                            {/* Node 4: In Transit */}
                            <div className={`step-node ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}`}>
                              <div className="step-dot">
                                {currentStep > 4 ? <CheckCircle size={14} /> : '4'}
                              </div>
                              <span className="step-label">In Transit</span>
                            </div>

                            {/* Node 5: Delivered */}
                            <div className={`step-node ${currentStep >= 5 ? 'completed' : ''} ${currentStep === 5 ? 'active' : ''}`}>
                              <div className="step-dot">
                                {currentStep === 5 ? <CheckCircle size={14} /> : '5'}
                              </div>
                              <span className="step-label">Delivered</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--color-danger-light)', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', margin: '1rem 0', fontSize: '0.85rem' }}>
                          <Clock size={16} />
                          <span><strong>Offer Declined:</strong> The farmer declined this deal. Please adjust pricing or quantity and initiate a new matcher query.</span>
                        </div>
                      )}

                      {/* Action buttons on trackers */}
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                          {/* Advance Logistics (test/demo button) */}
                          {deal.status === 'accepted' && deal.deliveryStatus !== 'delivered' && deal.deliveryStatus !== 'in-transit' && (
                            <button
                              onClick={() => advanceDeliveryStatus(deal.id)}
                              className="btn btn-secondary flex-gap-sm"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <Truck size={12} />
                              Advance Logistics (Test)
                            </button>
                          )}
                          
                          {/* Advance to In-Transit if scheduled */}
                          {deal.status === 'accepted' && deal.deliveryStatus === 'scheduled' && (
                            <button
                              onClick={() => advanceDeliveryStatus(deal.id)}
                              className="btn btn-secondary flex-gap-sm"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              <Truck size={12} />
                              Mark In-Transit (Test)
                            </button>
                          )}

                          {/* Pay Now — only if accepted and unpaid */}
                          {deal.status === 'accepted' && deal.paymentStatus === 'unpaid' && (
                            <button
                              onClick={() => onOpenPayment(deal)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.4rem 0.9rem', fontSize: '0.75rem', fontWeight: 700,
                                borderRadius: 'var(--radius-md)', border: 'none',
                                background: 'linear-gradient(135deg, #1a3c2a, #2d6a4f)',
                                color: '#fff', cursor: 'pointer',
                              }}
                            >
                              <CreditCard size={12} /> Pay Now
                            </button>
                          )}

                          {/* Payment Complete badge */}
                          {deal.paymentStatus === 'paid' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                              <CheckCircle size={13} /> Payment Complete
                            </span>
                          )}

                          {/* Confirm Delivery — buyer confirms they received goods (requires paid) */}
                          {canConfirmDelivery && (
                            <button
                              onClick={() => handleConfirmDelivery(deal.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.4rem 0.9rem', fontSize: '0.75rem', fontWeight: 700,
                                borderRadius: 'var(--radius-md)', border: 'none',
                                background: 'linear-gradient(135deg, #059669, #10b981)',
                                color: '#fff', cursor: 'pointer',
                              }}
                            >
                              <PackageCheck size={12} /> Confirm Delivery Received
                            </button>
                          )}

                          {/* If in-transit but not paid, show notice */}
                          {deal.status === 'accepted' && deal.deliveryStatus === 'in-transit' && deal.paymentStatus !== 'paid' && (
                            <span style={{ fontSize: '0.74rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                              <Clock size={12} /> Pay to confirm delivery
                            </span>
                          )}
                        </div>

                        {/* Rating block — only after delivery confirmed AND payment made */}
                        <div>
                          {canRate && (
                            <button
                              onClick={() => setRatingDealId(deal.id)}
                              className="btn btn-success flex-gap-sm"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                            >
                              <Star size={12} />
                              Rate Transaction & Farmer
                            </button>
                          )}
                          {deal.deliveryStatus === 'delivered' && deal.paymentStatus !== 'paid' && !deal.ratingGiven && (
                            <span style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={12} /> Complete payment to rate
                            </span>
                          )}
                          {deal.ratingGiven && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} /> Rating Registered (Transaction Complete)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rating Modal */}
        {ratingDealId && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ marginBottom: '0.75rem' }}>Rate Farmer & Transaction</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Confirm details to finalize order. Leaving feedback adjusts global AI matcher ratings.
              </p>

              <form onSubmit={submitFarmerRating} autoComplete="off">
                <div className="form-group" style={{ textAlign: 'center' }}>
                  <label className="form-label">Farmer Rating Score</label>
                  <div className="star-rating-selector" style={{ justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStars(star)}
                        className={`star-btn ${ratingStars >= star ? 'selected' : ''}`}
                      >
                        <Star fill={ratingStars >= star ? 'var(--color-warning)' : 'none'} size={28} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="form-label">Leave a Comment (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe your experience with this farmer and the quality of produce..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    autoComplete="off"
                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => { setRatingDealId(null); setRatingComment(''); }} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Farmer Reviews Modal */}
        {viewReviewsFarmer && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{viewReviewsFarmer.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <Star size={14} fill="var(--color-accent-gold)" color="var(--color-accent-gold)" />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{viewReviewsFarmer.rating}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({viewReviewsFarmer.ratingCount} reviews)</span>
                  </div>
                </div>
                <button onClick={() => setViewReviewsFarmer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {(!viewReviewsFarmer.reviews || viewReviewsFarmer.reviews.length === 0) ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    No reviews yet for this farmer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {viewReviewsFarmer.reviews.map((rev) => (
                      <div key={rev.id} style={{ padding: '0.85rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-background)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--color-primary-dark)' }}>{rev.buyerName}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            {Array.from({ length: 5 }, (_, idx) => (
                              <Star key={idx} size={12} fill={Math.round(rev.rating) > idx ? 'var(--color-accent-gold)' : 'none'} color="var(--color-accent-gold)" />
                            ))}
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, marginLeft: '0.2rem' }}>{rev.rating}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', margin: 0, fontStyle: 'italic', lineHeight: '1.45' }}>
                          "{rev.comment}"
                        </p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', display: 'block' }}>{rev.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)', marginTop: '1rem' }}>
                <button onClick={() => setViewReviewsFarmer(null)} className="btn btn-secondary" style={{ width: '100%' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
