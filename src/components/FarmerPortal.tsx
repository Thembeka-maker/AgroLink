import React, { useState, useEffect } from 'react';
import { FarmerProfile, ProduceListing, DealOffer, BuyerProfile } from '../types';
import { MOCK_CROPS } from '../mockData';
import { aiEngine } from '../services/aiEngine';
import {
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Inbox,
  Check,
  X,
  Plus,
  Edit2,
  Calendar,
  AlertCircle,
  BarChart2
} from 'lucide-react';

interface FarmerPortalProps {
  activeFarmer: FarmerProfile;
  setActiveFarmer: (farmer: FarmerProfile) => void;
  listings: ProduceListing[];
  setListings: React.Dispatch<React.SetStateAction<ProduceListing[]>>;
  deals: DealOffer[];
  setDeals: React.Dispatch<React.SetStateAction<DealOffer[]>>;
  buyers: BuyerProfile[];
  addNotification: (userId: string, title: string, message: string, type: 'deal_offer' | 'deal_status' | 'matching_alert') => void;
}

type TabType = 'dashboard' | 'list-produce' | 'intelligence' | 'deals';

export const FarmerPortal: React.FC<FarmerPortalProps> = ({
  activeFarmer,
  setActiveFarmer,
  listings,
  setListings,
  deals,
  setDeals,
  buyers,
  addNotification,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: activeFarmer.name,
    location: activeFarmer.location,
    farmSize: activeFarmer.farmSize,
    cropTypes: activeFarmer.cropTypes.join(', '),
    contact: activeFarmer.contact,
  });

  // Listing Form State
  const [selectedCrop, setSelectedCrop] = useState(MOCK_CROPS[0]);
  const [quantity, setQuantity] = useState<number>(1000);
  const [price, setPrice] = useState<number>(1.20);
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [listingSuccess, setListingSuccess] = useState(false);

  // AI Price Advice State
  const [aiAdvice, setAiAdvice] = useState(() => aiEngine.getDemandForecast(MOCK_CROPS[0]));

  useEffect(() => {
    setAiAdvice(aiEngine.getDemandForecast(selectedCrop));
  }, [selectedCrop]);

  // Price intelligence page crop select
  const [intelCrop, setIntelCrop] = useState(MOCK_CROPS[0]);
  const intelData = aiEngine.getDemandForecast(intelCrop);

  // Filter listings and deals for this farmer
  const farmerListings = listings.filter((l) => l.farmerId === activeFarmer.id);
  const farmerDeals = deals.filter((d) => d.farmerId === activeFarmer.id);

  // Stats calculation
  const activeDealsCount = farmerDeals.filter(d => d.status === 'pending').length;
  const completedDealsCount = farmerDeals.filter(d => d.status === 'accepted').length;
  const totalRevenue = farmerDeals
    .filter(d => d.status === 'accepted')
    .reduce((sum, d) => sum + d.totalAmount, 0);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFarmer({
      ...activeFarmer,
      name: profileForm.name,
      location: profileForm.location,
      farmSize: parseFloat(profileForm.farmSize.toString()) || 0,
      cropTypes: profileForm.cropTypes.split(',').map((c) => c.trim()).filter(Boolean),
      contact: profileForm.contact,
    });
    setIsEditingProfile(false);
    addNotification(activeFarmer.id, 'Profile Updated', 'Your farm profile has been stored successfully.', 'deal_status');
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    const newListing: ProduceListing = {
      id: 'l_' + Date.now(),
      farmerId: activeFarmer.id,
      farmerName: activeFarmer.name,
      farmerRating: activeFarmer.rating,
      crop: selectedCrop,
      quantity,
      price,
      grade,
      location: activeFarmer.location,
      dateListed: new Date().toISOString().split('T')[0],
    };

    setListings((prev) => [newListing, ...prev]);
    setListingSuccess(true);
    setTimeout(() => setListingSuccess(false), 3000);

    // Simulate smart matching alerting in the background (AI Engine matched notifications)
    addNotification(
      activeFarmer.id,
      'Produce Listed',
      `Your listing for ${quantity}kg of ${selectedCrop} is live. AI Engine is matching buyers.`,
      'matching_alert'
    );
  };

  const handleDealAction = (dealId: string, action: 'accept' | 'reject') => {
    setDeals((prev) =>
      prev.map((deal) => {
        if (deal.id === dealId) {
          const updatedStatus = action === 'accept' ? 'accepted' : 'rejected';
          const updatedDeliveryStatus = action === 'accept' ? 'scheduled' : 'none';
          
          // Notify buyer of decision
          addNotification(
            deal.buyerId,
            `Deal Offer ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
            `${activeFarmer.name} has ${action}ed your offer of ${deal.quantity}kg ${deal.crop}.`,
            'deal_status'
          );

          return {
            ...deal,
            status: updatedStatus,
            deliveryStatus: updatedDeliveryStatus,
            deliveryDate: action === 'accept' 
              ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 5 days out
              : '',
          };
        }
        return deal;
      })
    );
  };

  // Custom Line Chart rendering using SVG
  const renderPriceChart = () => {
    const points = intelData.history;
    if (!points || points.length === 0) return null;

    const width = 500;
    const height = 150;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    // Find min and max price for scaling
    const prices = points.map((p) => p.price);
    const maxVal = Math.max(...prices) * 1.1;
    const minVal = Math.min(...prices) * 0.9;
    const priceDiff = maxVal - minVal;

    const getX = (index: number) => {
      const step = (width - paddingLeft - paddingRight) / (points.length - 1);
      return paddingLeft + index * step;
    };

    const getY = (price: number) => {
      const scale = (height - paddingTop - paddingBottom) / priceDiff;
      return height - paddingBottom - (price - minVal) * scale;
    };

    // Construct path d attribute
    let pathD = `M ${getX(0)} ${getY(points[0].price)}`;
    let areaD = `M ${getX(0)} ${height - paddingBottom} L ${getX(0)} ${getY(points[0].price)}`;

    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${getX(i)} ${getY(points[i].price)}`;
      areaD += ` L ${getX(i)} ${getY(points[i].price)}`;
    }
    areaD += ` L ${getX(points.length - 1)} ${height - paddingBottom} Z`;

    return (
      <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* X and Y Grid Lines */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#cbd5e1" strokeWidth={1} />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#cbd5e1" strokeWidth={1} />

        {/* Horizontal reference lines */}
        {[0, 0.5, 1].map((ratio) => {
          const val = minVal + priceDiff * ratio;
          const y = getY(val);
          return (
            <g key={ratio}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-gridline" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">
                ${val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Line Fill Area */}
        <path d={areaD} fill="url(#chart-gradient)" />

        {/* Line Path */}
        <path d={pathD} className="chart-line" />

        {/* Data points & X Labels */}
        {points.map((p, idx) => {
          const cx = getX(idx);
          const cy = getY(p.price);
          return (
            <g key={idx}>
              <circle cx={cx} cy={cy} className="chart-dot" />
              <text x={cx} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)" fontWeight="600">
                {p.month}
              </text>
              {/* Tooltip on top of dots */}
              <text x={cx} y={cy - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--color-primary-dark)">
                ${p.price.toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="dashboard-grid">
      {/* Sidebar Tabs Navigation */}
      <aside className="card" style={{ height: 'fit-content' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Farmer Portal</h3>
        <nav className="sidebar-tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <Layers size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('list-produce')}
            className={`tab-btn ${activeTab === 'list-produce' ? 'active' : ''}`}
          >
            <Plus size={18} />
            List Produce
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`tab-btn ${activeTab === 'intelligence' ? 'active' : ''}`}
          >
            <TrendingUp size={18} />
            AI Price Intel
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
          >
            <Inbox size={18} />
            Deals inbox
            {activeDealsCount > 0 && (
              <span className="badge-pill badge-pending" style={{ marginLeft: 'auto' }}>
                {activeDealsCount}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(82, 183, 136, 0.15)', color: 'var(--color-primary-light)' }}>
                  <Package size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-val">{farmerListings.length}</span>
                  <span className="stat-lbl">Active Listings</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: 'var(--color-accent-gold)' }}>
                  <Inbox size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-val">{activeDealsCount}</span>
                  <span className="stat-lbl">Pending Offers</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                  <Check size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-val">{completedDealsCount}</span>
                  <span className="stat-lbl">Completed Deals</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-info)' }}>
                  <DollarSign size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-val">${totalRevenue.toLocaleString()}</span>
                  <span className="stat-lbl">Revenue Generated</span>
                </div>
              </div>
            </div>

            {/* Profile Detail Card */}
            <div className="card">
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <h3>Farm Profile & Info</h3>
                {!isEditingProfile && (
                  <button onClick={() => setIsEditingProfile(true)} className="btn btn-secondary flex-gap-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <Edit2 size={12} />
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Farmer/Farm Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location (City, State)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Farm Size (Acres)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={profileForm.farmSize}
                      onChange={(e) => setProfileForm({ ...profileForm, farmSize: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Crops (comma separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.cropTypes}
                      onChange={(e) => setProfileForm({ ...profileForm, cropTypes: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Contact Info</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.contact}
                      onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Profile</button>
                  </div>
                </form>
              ) : (
                <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Farm Name</p>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{activeFarmer.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Location</p>
                    <p style={{ fontWeight: 700 }}>{activeFarmer.location}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Cultivated Area</p>
                    <p style={{ fontWeight: 700 }}>{activeFarmer.farmSize} Acres</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Active Crop Specializations</p>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {activeFarmer.cropTypes.map((c) => (
                        <span key={c} className="badge-pill" style={{ backgroundColor: 'rgba(82, 183, 136, 0.1)', color: 'var(--color-primary-light)' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Contact Information</p>
                    <p style={{ fontWeight: 600 }}>{activeFarmer.contact}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Active Listings Table */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Active Live Listings</h3>
              {farmerListings.length === 0 ? (
                <div style={{ padding: '2rem 0', textDecoration: 'none', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  No active crop listings. Go to "List Produce" to create your first listing!
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Crop</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Grade</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Quantity</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Asking Price</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Listed Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmerListings.map((l) => (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{l.crop}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span className="badge-pill" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>Grade {l.grade}</span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{l.quantity.toLocaleString()} kg</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-primary-light)', fontWeight: 700 }}>${l.price.toFixed(2)} /kg</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)' }}>{l.dateListed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: List Produce */}
        {activeTab === 'list-produce' && (
          <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'stretch' }}>
            {/* Listing Form */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ marginBottom: '1.25rem' }}>Create Produce Listing</h3>
                {listingSuccess && (
                  <div style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Check size={16} /> Listing uploaded to database successfully!
                  </div>
                )}
                <form onSubmit={handleCreateListing}>
                  <div className="form-group">
                    <label className="form-label">Crop Type</label>
                    <select
                      className="form-control"
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                    >
                      {MOCK_CROPS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quality Grade</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(['A', 'B', 'C'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGrade(g)}
                          className={`btn ${grade === g ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, padding: '0.5rem' }}
                        >
                          Grade {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Listing Quantity (kg)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Asking Price per kg ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={price}
                      onChange={(e) => setPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
                      min="0.01"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Plus size={16} /> Live List Produce
                  </button>
                </form>
              </div>
            </div>

            {/* AI Advisor Panel */}
            <div className="ai-recommendation-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="ai-header">
                  <BarChart2 size={20} color="var(--color-secondary)" />
                  <span className="ai-title">AI Engine Intelligence</span>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Crop</p>
                  <h2 style={{ color: 'white', marginTop: '0.15rem' }}>{selectedCrop}</h2>
                </div>

                <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'block' }}>Recommended Price</span>
                    <strong style={{ fontSize: '1.4rem' }}>${aiAdvice.recommendedPrice.toFixed(2)}/kg</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'block' }}>Demand Index</span>
                    <strong style={{ fontSize: '1.4rem' }}>{aiAdvice.forecastDemandIndex}/10</strong>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'block', marginBottom: '0.25rem' }}>AI Price Range Estimate</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', opacity: 0.9 }}>
                    <span>Min: ${aiAdvice.minPrice.toFixed(2)}</span>
                    <span style={{ fontWeight: 700 }}>Avg: ${aiAdvice.avgPrice.toFixed(2)}</span>
                    <span>Max: ${aiAdvice.maxPrice.toFixed(2)}</span>
                  </div>
                  {/* Visual gauge representation */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '15%',
                      right: '15%',
                      height: '100%',
                      background: 'var(--color-secondary)',
                      borderRadius: '3px'
                    }}></div>
                    {/* User's current price pointer */}
                    {price && (
                      <div style={{
                        position: 'absolute',
                        left: `${Math.min(100, Math.max(0, ((price - aiAdvice.minPrice) / (aiAdvice.maxPrice - aiAdvice.minPrice)) * 100))}%`,
                        top: '-4px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'white',
                        border: '3px solid var(--color-primary-light)',
                        transform: 'translateX(-7px)',
                        transition: 'left var(--transition-fast)'
                      }}></div>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', display: 'block', marginBottom: '0.25rem' }}>Market Forecast Insights</span>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.4', opacity: 0.95 }}>{aiAdvice.marketInsights}</p>
                </div>
              </div>

              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '1.5rem', textAlign: 'right' }}>
                Historical prices database synced. Updated 2 mins ago.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Price Intelligence page */}
        {activeTab === 'intelligence' && (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2>Price Intelligence & Demand Forecasting</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Historical prices & AI generated market forecasts</p>
              </div>
              <select
                className="form-control"
                style={{ width: '200px' }}
                value={intelCrop}
                onChange={(e) => setIntelCrop(e.target.value)}
              >
                {MOCK_CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Price Intelligence Stats */}
            <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--color-border)', background: 'var(--color-background)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary-dark)' }}>Historical Spot Prices ($/kg)</h4>
                
                {/* SVG Chart */}
                <div className="chart-container">
                  {renderPriceChart()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card" style={{ flex: 1, boxShadow: 'none', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Market Demand Outlook</span>
                    <strong style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)' }}>{intelData.forecastDemandIndex}/10</strong>
                    <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--color-success)', marginTop: '0.25rem', fontWeight: 600 }}>
                      High sourcing interest detected
                    </span>
                  </div>
                  <div
                    className="stat-icon-wrapper"
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--color-success)',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%'
                    }}
                  >
                    <TrendingUp size={28} />
                  </div>
                </div>

                <div className="card" style={{ flex: 1, boxShadow: 'none', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>AI Target Selling Price</span>
                    <strong style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)' }}>${intelData.recommendedPrice.toFixed(2)}/kg</strong>
                    <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Optimized for 96% match rating
                    </span>
                  </div>
                  <div
                    className="stat-icon-wrapper"
                    style={{
                      backgroundColor: 'rgba(219, 234, 254, 0.8)',
                      color: 'var(--color-info)',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%'
                    }}
                  >
                    <DollarSign size={28} />
                  </div>
                </div>
              </div>
            </div>

            <div className="ai-recommendation-panel">
              <div className="ai-header">
                <AlertCircle size={18} color="var(--color-secondary)" />
                <span className="ai-title">AI Engine Market Insights - {intelCrop}</span>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{intelData.marketInsights}</p>
            </div>
          </div>
        )}

        {/* Tab 4: Deal Offers inbox */}
        {activeTab === 'deals' && (
          <div className="card">
            <h2 style={{ marginBottom: '1.25rem' }}>Deal Offers Inbox</h2>
            {farmerDeals.length === 0 ? (
              <div style={{ padding: '3rem 0', textDecoration: 'none', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                Your deals inbox is empty. When buyers place matching orders, their requests will appear here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {farmerDeals.map((deal) => {
                  const buyer = buyers.find((b) => b.id === deal.buyerId);
                  return (
                    <div
                      key={deal.id}
                      className={`card deal-offer-card ${deal.status === 'accepted' ? 'accepted' : deal.status === 'rejected' ? 'rejected' : ''}`}
                      style={{ padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div className="flex-gap-sm" style={{ marginBottom: '0.25rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{deal.crop} Demand Offer</h3>
                            <span className={`badge-pill badge-${deal.status}`}>{deal.status.toUpperCase()}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            From: <strong style={{ color: 'var(--color-primary-dark)' }}>{deal.buyerName}</strong> ({buyer?.category})
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Total Deal Value</span>
                          <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>${deal.totalAmount.toLocaleString()}</strong>
                        </div>
                      </div>

                      <hr style={{ border: '0', borderTop: '1px solid var(--color-border)', margin: '1rem 0' }} />

                      <div className="grid-cols-2" style={{ gap: '1rem', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)' }}>Requested Quantity: </span>
                          <strong>{deal.quantity.toLocaleString()} kg</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)' }}>Proposed Unit Price: </span>
                          <strong style={{ color: 'var(--color-primary-light)' }}>${deal.price.toFixed(2)}/kg</strong>
                        </div>
                        {deal.status === 'accepted' && (
                          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--color-success-light)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                            <Calendar size={16} />
                            <span>
                              <strong>Deal Confirmed:</strong> Delivery scheduled for <strong>{deal.deliveryDate}</strong>. Tracking is active in the Buyer portal.
                            </span>
                          </div>
                        )}
                        {deal.status === 'rejected' && (
                          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--color-danger-light)', color: '#b91c1c', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                            <X size={16} />
                            <span>Offer declined by you. Buyer has been notified.</span>
                          </div>
                        )}
                      </div>

                      {deal.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                          <button
                            onClick={() => handleDealAction(deal.id, 'reject')}
                            className="btn btn-secondary flex-gap-sm"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          >
                            <X size={14} /> Decline Offer
                          </button>
                          <button
                            onClick={() => handleDealAction(deal.id, 'accept')}
                            className="btn btn-primary flex-gap-sm"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          >
                            <Check size={14} /> Accept & Confirm Deal
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
