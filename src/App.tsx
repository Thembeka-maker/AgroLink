import { useState, useEffect } from 'react';
import { Clock, Shield, FileText } from 'lucide-react';
import { Header } from './components/Header';
import { FarmerPortal } from './components/FarmerPortal';
import { BuyerPortal } from './components/BuyerPortal';
import { LandingPage } from './components/LandingPage';
import { AdminPortal } from './components/AdminPortal';
import { PaymentModal } from './components/PaymentModal';
import {
  INITIAL_FARMERS,
  INITIAL_BUYERS,
  INITIAL_LISTINGS,
  INITIAL_DEMANDS,
  INITIAL_DEALS,
} from './mockData';
import {
  FarmerProfile,
  BuyerProfile,
  AdminProfile,
  ProduceListing,
  DemandRequirement,
  DealOffer,
  Notification,
  PaymentDetails,
} from './types';
import {
  seedIfEmpty,
  farmerStore,
  buyerStore,
  adminStore,
  listingStore,
  demandStore,
  dealStore,
} from './services/storageService';
import { emailService } from './services/emailService';

// Seed initial data into localStorage only on first launch
seedIfEmpty(INITIAL_FARMERS, INITIAL_BUYERS, INITIAL_LISTINGS, INITIAL_DEMANDS, INITIAL_DEALS);

type CurrentView = 'landing' | 'farmer' | 'buyer' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('landing');
  const [activeFarmerId, setActiveFarmerId] = useState<string | null>(null);
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null);
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(null);

  // All data sourced from localStorage (persistent)
  const [farmers, setFarmersState] = useState<FarmerProfile[]>(() => farmerStore.getAll());
  const [buyers, setBuyersState] = useState<BuyerProfile[]>(() => buyerStore.getAll());
  const [listings, setListingsState] = useState<ProduceListing[]>(() => listingStore.getAll());
  const [demands, setDemandsState] = useState<DemandRequirement[]>(() => demandStore.getAll());
  const [deals, setDealsState] = useState<DealOffer[]>(() => dealStore.getAll());

  // Payment modal state
  const [paymentDeal, setPaymentDeal] = useState<DealOffer | null>(null);

  // Notifications (session-level, no need to persist)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n_welcome_f1',
      userId: 'f1',
      title: 'Welcome to AgroLink',
      message: 'Your farm profile is active. AI Smart Matcher is searching for buyers.',
      timestamp: '10 mins ago',
      read: false,
      type: 'matching_alert',
    },
  ]);

  // ─── Persistence wrappers ─────────────────────────────────────────────────

  const setFarmers = (updater: FarmerProfile[] | ((prev: FarmerProfile[]) => FarmerProfile[])) => {
    setFarmersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      farmerStore.save(next);
      return next;
    });
  };

  const setBuyers = (updater: BuyerProfile[] | ((prev: BuyerProfile[]) => BuyerProfile[])) => {
    setBuyersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      buyerStore.save(next);
      return next;
    });
  };

  const setListings = (updater: ProduceListing[] | ((prev: ProduceListing[]) => ProduceListing[])) => {
    setListingsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      listingStore.save(next);
      return next;
    });
  };

  const setDemands = (updater: DemandRequirement[] | ((prev: DemandRequirement[]) => DemandRequirement[])) => {
    setDemandsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      demandStore.save(next);
      return next;
    });
  };

  const setDeals = (updater: DealOffer[] | ((prev: DealOffer[]) => DealOffer[])) => {
    setDealsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      dealStore.save(next);
      return next;
    });
  };

  // ─── Notifications ────────────────────────────────────────────────────────

  const addNotification = (
    userId: string,
    title: string,
    message: string,
    type: Notification['type']
  ) => {
    const newNotif: Notification = {
      id: 'n_' + Date.now(),
      userId,
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // ─── Auth ─────────────────────────────────────────────────────────────────

  const handleLogin = (role: 'farmer' | 'buyer', userId: string) => {
    if (role === 'farmer') {
      setActiveFarmerId(userId);
      setActiveBuyerId(null);
      setCurrentView('farmer');
    } else {
      setActiveBuyerId(userId);
      setActiveFarmerId(null);
      setCurrentView('buyer');
    }
    addNotification(userId, 'Session Started', 'Secure connection established. AI Smart Matcher is active.', 'deal_status');
  };

  const handleAdminLogin = (username: string, password: string): boolean => {
    const admins = adminStore.getAll();
    const match = admins.find(a => a.username === username && a.password === password);
    if (match) {
      setActiveAdmin(match);
      setCurrentView('admin');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setActiveFarmerId(null);
    setActiveBuyerId(null);
    setActiveAdmin(null);
    setCurrentView('landing');
  };

  // ─── Registration ─────────────────────────────────────────────────────────

  const handleRegisterFarmer = (details: Omit<FarmerProfile, 'id' | 'rating' | 'ratingCount' | 'registeredDate'>) => {
    const newId = 'farmer_' + Date.now();
    const newFarmer: FarmerProfile = {
      ...details,
      id: newId,
      rating: 5.0,
      ratingCount: 0,
      registeredDate: new Date().toISOString().split('T')[0],
    };
    setFarmers(prev => [...prev, newFarmer]);
    setActiveFarmerId(newId);
    setActiveBuyerId(null);
    setCurrentView('farmer');
    addNotification(newId, 'Registration Success', `Welcome ${details.name}! Your farm profile in ${details.country} has been saved.`, 'deal_status');
  };

  const handleRegisterBuyer = (details: Omit<BuyerProfile, 'id' | 'registeredDate'>) => {
    const newId = 'buyer_' + Date.now();
    const newBuyer: BuyerProfile = {
      ...details,
      id: newId,
      registeredDate: new Date().toISOString().split('T')[0],
    };
    setBuyers(prev => [...prev, newBuyer]);
    setActiveBuyerId(newId);
    setActiveFarmerId(null);
    setCurrentView('buyer');
    addNotification(newId, 'Registration Success', `Welcome ${details.company}! Sourcing credentials recorded in SADC ledger.`, 'deal_status');
  };

  // ─── Admin Actions ────────────────────────────────────────────────────────

  const handleSuspendFarmer = (id: string, suspend: boolean) => {
    setFarmers(prev => prev.map(f => f.id === id ? { ...f, suspended: suspend } : f));
    const farmer = farmers.find(f => f.id === id);
    if (farmer) {
      emailService.sendEmail(
        farmer.contact,
        suspend ? 'Account Suspended — AgroLink' : 'Account Reinstated — AgroLink',
        suspend
          ? `Dear ${farmer.name}, your AgroLink account has been suspended by the administration. Your listings are no longer visible to buyers. Contact support to appeal.`
          : `Dear ${farmer.name}, your AgroLink account has been reinstated. Your listings are now visible again.`
      );
      addNotification(id, suspend ? 'Account Suspended' : 'Account Reinstated',
        suspend ? 'Your account has been suspended by admin. Contact support.' : 'Your account has been reinstated and is now active.',
        'admin');
    }
  };

  const handleSuspendBuyer = (id: string, suspend: boolean) => {
    setBuyers(prev => prev.map(b => b.id === id ? { ...b, suspended: suspend } : b));
    const buyer = buyers.find(b => b.id === id);
    if (buyer) {
      emailService.sendEmail(
        buyer.contact,
        suspend ? 'Account Suspended — AgroLink' : 'Account Reinstated — AgroLink',
        suspend
          ? `Dear ${buyer.company}, your AgroLink buyer account has been suspended. Please contact support.`
          : `Dear ${buyer.company}, your AgroLink buyer account has been reinstated.`
      );
      addNotification(id, suspend ? 'Account Suspended' : 'Account Reinstated',
        suspend ? 'Your account has been suspended by admin. Contact support.' : 'Your account has been reinstated and is now active.',
        'admin');
    }
  };

  const handleDeleteFarmer = (id: string) => {
    setFarmers(prev => prev.filter(f => f.id !== id));
    setListings(prev => prev.filter(l => l.farmerId !== id));
  };

  const handleDeleteBuyer = (id: string) => {
    setBuyers(prev => prev.filter(b => b.id !== id));
    setDemands(prev => prev.filter(d => d.buyerId !== id));
  };

  const handleApproveFarmer = (id: string) => {
    setFarmers(prev => prev.map(f => f.id === id ? { ...f, approved: true } : f));
    const farmer = farmers.find(f => f.id === id);
    if (farmer) {
      emailService.sendEmail(
        farmer.contact,
        'Account Approved — AgroLink',
        `Dear ${farmer.name}, your AgroLink farmer account has been verified and approved. You can now list your produce and receive buyer offers.`
      );
    }
    addNotification(id, 'Account Approved', 'Your SADC farmer exchange account has been verified and approved.', 'admin');
  };

  const handleApproveBuyer = (id: string) => {
    setBuyers(prev => prev.map(b => b.id === id ? { ...b, approved: true } : b));
    const buyer = buyers.find(b => b.id === id);
    if (buyer) {
      emailService.sendEmail(
        buyer.contact,
        'Account Approved — AgroLink',
        `Dear ${buyer.company}, your AgroLink buyer account has been verified and approved. You can now post sourcing demands and connect with farmers.`
      );
    }
    addNotification(id, 'Account Approved', 'Your SADC buyer procurement account has been verified and approved.', 'admin');
  };

  // ─── Payment ──────────────────────────────────────────────────────────────

  const handleOpenPayment = (deal: DealOffer) => {
    setPaymentDeal(deal);
  };

  const handlePaymentConfirm = (details: PaymentDetails) => {
    const ref = `AGL-${details.dealId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    setDeals(prev =>
      prev.map(d =>
        d.id === details.dealId
          ? {
              ...d,
              paymentStatus: 'paid',
              paymentMethod: details.method,
              paymentReference: ref,
              paymentDate: new Date().toISOString().split('T')[0],
            }
          : d
      )
    );
    const deal = deals.find(d => d.id === details.dealId);
    if (deal) {
      const buyer = buyers.find(b => b.id === deal.buyerId);
      const farmer = farmers.find(f => f.id === deal.farmerId);
      // Simulated email notifications for payment
      if (buyer) {
        emailService.sendEmail(
          buyer.contact,
          'Payment Confirmed — AgroLink',
          `Dear ${buyer.company}, your payment for ${deal.quantity}kg of ${deal.crop} has been confirmed. Reference: ${ref}. Delivery tracking is now active.`
        );
      }
      if (farmer) {
        emailService.sendEmail(
          farmer.contact,
          'Payment Received — AgroLink',
          `Dear ${farmer.name}, the buyer ${deal.buyerName} has completed payment for your ${deal.quantity}kg ${deal.crop}. Reference: ${ref}.`
        );
      }
      addNotification(deal.buyerId, 'Payment Confirmed', `Payment for ${deal.crop} confirmed. Ref: ${ref}`, 'payment');
      addNotification(deal.farmerId, 'Payment Received', `Buyer has completed payment for ${deal.crop}. Ref: ${ref}`, 'payment');
    }
  };

  const handleClosePayment = () => setPaymentDeal(null);

  // ─── Derived state ────────────────────────────────────────────────────────

  const activeFarmer = farmers.find(f => f.id === activeFarmerId);
  const activeBuyer = buyers.find(b => b.id === activeBuyerId);
  const activeUserId = currentView === 'farmer' ? activeFarmerId : activeBuyerId;
  const filteredNotifications = activeUserId ? notifications.filter(n => n.userId === activeUserId) : [];

  // Keep latest deal payment state in payment modal
  const currentPaymentDeal = paymentDeal ? deals.find(d => d.id === paymentDeal.id) ?? paymentDeal : null;

  return (
    <div className="app-container">
      {/* Header — shown only for farmer/buyer sessions */}
      {(currentView === 'farmer' || currentView === 'buyer') && (
        <Header
          currentView={currentView}
          onLogout={handleLogout}
          activeFarmer={activeFarmer}
          activeBuyer={activeBuyer}
          notifications={filteredNotifications}
          onMarkAsRead={handleMarkAsRead}
        />
      )}

      {/* ── View Router ── */}
      {currentView === 'landing' && (
        <LandingPage
          farmers={farmers}
          buyers={buyers}
          onLogin={handleLogin}
          onAdminLogin={handleAdminLogin}
          onRegisterFarmer={handleRegisterFarmer}
          onRegisterBuyer={handleRegisterBuyer}
        />
      )}

      {currentView === 'admin' && activeAdmin && (
        <AdminPortal
          admin={activeAdmin}
          farmers={farmers}
          buyers={buyers}
          deals={deals}
          listings={listings}
          onSuspendFarmer={handleSuspendFarmer}
          onSuspendBuyer={handleSuspendBuyer}
          onDeleteFarmer={handleDeleteFarmer}
          onDeleteBuyer={handleDeleteBuyer}
          onApproveFarmer={handleApproveFarmer}
          onApproveBuyer={handleApproveBuyer}
          onLogout={handleLogout}
        />
      )}

      {(currentView === 'farmer' || currentView === 'buyer') && (
        <div className="main-content">
          {((currentView === 'farmer' && activeFarmer && !activeFarmer.approved) ||
            (currentView === 'buyer' && activeBuyer && !activeBuyer.approved)) ? (
            <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#f59e0b' }}>
                <Clock size={40} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a3c2a', marginBottom: '1rem' }}>Account Pending Approval</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Hello <strong>{currentView === 'farmer' ? activeFarmer?.name : activeBuyer?.company}</strong>, your SADC trading profile is currently under review by our operations team.
              </p>
              
              <div style={{ textAlign: 'left', backgroundColor: '#f9fafb', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', fontSize: '0.85rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={14} color="#f59e0b" /> Verification Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Country:</span>
                  <span style={{ fontWeight: 600 }}>{currentView === 'farmer' ? activeFarmer?.country : activeBuyer?.country}</span>
                  
                  <span style={{ color: 'var(--color-text-muted)' }}>Reg Number:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{currentView === 'farmer' ? activeFarmer?.regNumber : activeBuyer?.regNumber}</span>
                  
                  <span style={{ color: 'var(--color-text-muted)' }}>Verification Document:</span>
                  <span style={{ fontWeight: 600, color: '#2d6a4f', display: 'flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <FileText size={13} /> {currentView === 'farmer' ? activeFarmer?.docName : activeBuyer?.docName}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                We verify all cooperative registries, National ID numbers, and tax registry codes to protect buyers and farmers on the AgroLink SADC corridor. Reviews are normally processed within 2 hours.
              </p>
              
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>
                Sign Out / Return to Landing
              </button>
            </div>
          ) : currentView === 'farmer' && activeFarmer ? (
            <FarmerPortal
              activeFarmer={activeFarmer}
              setActiveFarmer={updated => setFarmers(prev => prev.map(f => f.id === updated.id ? updated : f))}
              listings={listings}
              setListings={setListings}
              deals={deals}
              setDeals={setDeals}
              buyers={buyers}
              addNotification={addNotification}
            />
          ) : currentView === 'buyer' && activeBuyer ? (
            <BuyerPortal
              activeBuyer={activeBuyer}
              listings={listings}
              farmers={farmers}
              setFarmers={setFarmers}
              demands={demands}
              setDemands={setDemands}
              deals={deals}
              setDeals={setDeals}
              addNotification={addNotification}
              onOpenPayment={handleOpenPayment}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
              Loading portal session...
            </div>
          )}
        </div>
      )}

      {/* Payment Modal (global — rendered above all content) */}
      {paymentDeal && currentPaymentDeal && currentPaymentDeal.paymentStatus !== 'paid' && (
        <PaymentModal
          deal={currentPaymentDeal}
          buyerCurrency={activeBuyer?.currency ?? 'USD'}
          preferredMethod={activeBuyer?.preferredPaymentMethod}
          onConfirm={handlePaymentConfirm}
          onClose={handleClosePayment}
        />
      )}

      {/* Footer */}
      {currentView !== 'admin' && (
        <footer style={{
          textAlign: 'center', padding: '2rem 1.5rem', fontSize: '0.8rem',
          color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)',
          backgroundColor: '#ffffff', marginTop: 'auto',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div><strong>AgroLink System © 2026</strong> &bull; SADC Agricultural Exchange Ledger</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ cursor: 'help' }}>Eswatini Sugar Board Sync</span>
              <span style={{ cursor: 'help' }}>AI Smart Matcher Active</span>
              <span style={{ cursor: 'help' }}>Secure Payments</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
