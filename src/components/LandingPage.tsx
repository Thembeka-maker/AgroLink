import React, { useState } from 'react';
import {
  Sprout, Globe, User, Plus, AlertTriangle, Camera, LogIn,
  Leaf, ShoppingCart, Shield, Upload, FileText,
} from 'lucide-react';
import { FarmerProfile, BuyerProfile } from '../types';
import { AFRICAN_COUNTRIES } from '../services/currencyService';

interface LandingPageProps {
  farmers: FarmerProfile[];
  buyers: BuyerProfile[];
  onLogin: (role: 'farmer' | 'buyer', userId: string) => void;
  onAdminLogin: (username: string, password: string) => boolean;
  onRegisterFarmer: (farmer: Omit<FarmerProfile, 'id' | 'rating' | 'ratingCount' | 'registeredDate'>) => void;
  onRegisterBuyer: (buyer: Omit<BuyerProfile, 'id' | 'registeredDate'>) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
];

export const LandingPage: React.FC<LandingPageProps> = ({
  farmers, buyers, onLogin, onAdminLogin, onRegisterFarmer, onRegisterBuyer,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [registerRole, setRegisterRole] = useState<'farmer' | 'buyer'>('farmer');

  // Login Form State
  const [loginRole, setLoginRole] = useState<'farmer' | 'buyer' | 'admin'>('farmer');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Admin Login
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Farmer Register Form State
  const [farmerForm, setFarmerForm] = useState({
    name: '',
    country: 'Eswatini',
    currency: 'SZL',
    location: '',
    farmSize: 10,
    cropTypes: '',
    contact: '',
    avatar: AVATAR_OPTIONS[0],
    password: '',
    confirmPassword: '',
    regNumber: '',
    docName: '',
  });

  // Buyer Register Form State
  const [buyerForm, setBuyerForm] = useState({
    company: '',
    category: 'Retail' as BuyerProfile['category'],
    country: 'Eswatini',
    currency: 'SZL',
    location: '',
    contact: '',
    password: '',
    confirmPassword: '',
    regNumber: '',
    docName: '',
  });

  const handleCountryChange = (country: string, form: 'farmer' | 'buyer') => {
    const found = AFRICAN_COUNTRIES.find(c => c.name === country);
    const currency = found?.currency ?? 'USD';
    if (form === 'farmer') {
      setFarmerForm(prev => ({ ...prev, country, currency, location: country }));
    } else {
      setBuyerForm(prev => ({ ...prev, country, currency, location: country }));
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File size exceeds 2MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFarmerForm(prev => ({ ...prev, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleFarmerDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFarmerForm(prev => ({ ...prev, docName: file.name }));
  };

  const handleBuyerDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBuyerForm(prev => ({ ...prev, docName: file.name }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const id = loginIdentifier.trim().toLowerCase();

    if (loginRole === 'farmer') {
      const match = farmers.find(f => f.name.trim().toLowerCase() === id && f.password === loginPassword);
      if (match) {
        if (match.suspended) { setLoginError('Your account has been suspended. Please contact an administrator.'); return; }
        onLogin('farmer', match.id);
      } else {
        const exists = farmers.find(f => f.name.trim().toLowerCase() === id);
        setLoginError(exists ? 'Incorrect password. Please try again.' : 'No farmer account found with that name.');
      }
    } else {
      const match = buyers.find(b => b.company.trim().toLowerCase() === id && b.password === loginPassword);
      if (match) {
        if (match.suspended) { setLoginError('Your account has been suspended. Please contact an administrator.'); return; }
        onLogin('buyer', match.id);
      } else {
        const exists = buyers.find(b => b.company.trim().toLowerCase() === id);
        setLoginError(exists ? 'Incorrect password. Please try again.' : 'No buyer account found with that company name.');
      }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const success = onAdminLogin(adminUsername.trim(), adminPassword);
    if (!success) setAdminError('Invalid admin credentials.');
  };

  const handleFarmerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (farmerForm.password.length < 6) { alert('Password must be at least 6 characters.'); return; }
    if (farmerForm.password !== farmerForm.confirmPassword) { alert('Passwords do not match.'); return; }
    if (farmerForm.regNumber.trim() === '') { alert('Please enter your National ID or Cooperative Registration ID.'); return; }
    onRegisterFarmer({
      name: farmerForm.name,
      country: farmerForm.country,
      currency: farmerForm.currency,
      location: farmerForm.location || farmerForm.country,
      farmSize: parseFloat(farmerForm.farmSize.toString()) || 0,
      cropTypes: farmerForm.cropTypes.split(',').map(c => c.trim()).filter(Boolean),
      contact: farmerForm.contact,
      avatar: farmerForm.avatar,
      password: farmerForm.password,
      approved: false,
      regNumber: farmerForm.regNumber.trim(),
      docName: farmerForm.docName || 'not_uploaded.pdf',
    });
  };

  const handleBuyerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerForm.password.length < 6) { alert('Password must be at least 6 characters.'); return; }
    if (buyerForm.password !== buyerForm.confirmPassword) { alert('Passwords do not match.'); return; }
    if (buyerForm.regNumber.trim() === '') { alert('Please enter your Business Registry ID or TIN.'); return; }
    onRegisterBuyer({
      company: buyerForm.company,
      category: buyerForm.category,
      country: buyerForm.country,
      currency: buyerForm.currency,
      location: buyerForm.location || buyerForm.country,
      contact: buyerForm.contact,
      password: buyerForm.password,
      approved: false,
      regNumber: buyerForm.regNumber.trim(),
      docName: buyerForm.docName || 'not_uploaded.pdf',
    });
  };

  return (
    <div className="landing-split-container">
      {/* ── LEFT HERO ── */}
      <section className="hero-section">
        <div>
          <div className="brand-logo-circle" style={{ width: '56px', height: '56px', marginBottom: '2rem' }}>
            <Sprout size={30} />
          </div>
          <h1 className="hero-marketing-title">
            Empowering <span>SADC Agriculture</span> with AI Smart Sourcing
          </h1>
          <p className="hero-desc">
            AgroLink connects Eswatini growers directly to wholesale distributors, fresh markets, and processing hubs across South Africa, Mozambique, and the wider SADC region.
          </p>
          <div className="hero-stats">
            <div className="hero-stat-box">
              <span className="hero-stat-num">50k+ kg</span>
              <span className="hero-stat-desc">Regional Demand</span>
            </div>
            <div className="hero-stat-box">
              <span className="hero-stat-num">20 Countries</span>
              <span className="hero-stat-desc">African Markets</span>
            </div>
            <div className="hero-stat-box">
              <span className="hero-stat-num">98%</span>
              <span className="hero-stat-desc">Match Accuracy</span>
            </div>
          </div>
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'AI-powered smart buyer-farmer matching',
              'Local currency display for 20 African nations',
              'Secure payment gateway — Card, Mobile Money, Bank',
              'Admin-monitored deal ledger & delivery tracking',
            ].map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', opacity: 0.9 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                {feat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RIGHT AUTH PANEL ── */}
      <section className="auth-card-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sprout size={20} color="var(--color-primary-light)" />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>AgroLink</span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0 }}>
              {activeTab === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              SADC Agricultural Exchange Platform
            </p>
          </div>

          {/* Tab Headers */}
          <div className="auth-tab-headers">
            <button onClick={() => { setActiveTab('login'); setLoginError(''); }} className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}>
              <LogIn size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Sign In
            </button>
            <button onClick={() => setActiveTab('register')} className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}>
              <Plus size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Register
            </button>
          </div>

          {/* ── LOGIN TAB ── */}
          {activeTab === 'login' && (
            <div>
              {/* Role Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Login as</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {([
                    { id: 'farmer', label: 'Farmer', icon: <Leaf size={14} />, activeColor: 'var(--color-primary-light)', activeBg: 'rgba(82,183,136,0.08)' },
                    { id: 'buyer',  label: 'Buyer',  icon: <ShoppingCart size={14} />, activeColor: 'var(--color-info)', activeBg: 'rgba(59,130,246,0.08)' },
                    { id: 'admin',  label: 'Admin',  icon: <Shield size={14} />, activeColor: '#7c3aed', activeBg: 'rgba(124,58,237,0.08)' },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setLoginRole(opt.id); setLoginError(''); setAdminError(''); setLoginIdentifier(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '2px solid',
                        borderColor: loginRole === opt.id ? opt.activeColor : 'var(--color-border)',
                        backgroundColor: loginRole === opt.id ? opt.activeBg : 'transparent',
                        color: loginRole === opt.id ? opt.activeColor : 'var(--color-text-muted)',
                        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Farmer / Buyer Login */}
              {(loginRole === 'farmer' || loginRole === 'buyer') && (
                <form onSubmit={handleLogin}>
                  {loginError && (
                    <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                      <AlertTriangle size={15} /> {loginError}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">
                      {loginRole === 'farmer' ? 'Full Name / Cooperative Name' : 'Company Name'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={loginRole === 'farmer' ? 'e.g. Sibusiso Dlamini' : 'e.g. Eswatini Sugar Association'}
                      value={loginIdentifier}
                      onChange={e => { setLoginIdentifier(e.target.value); setLoginError(''); }}
                      required autoFocus autoComplete="username"
                    />
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label">Password</label>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                      required autoComplete="current-password"
                      style={{ paddingRight: '3.5rem' }}
                    />
                    <button type="button" onClick={() => setShowLoginPassword(v => !v)}
                      style={{ position: 'absolute', right: '0.75rem', top: '2.1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem' }}>
                      {showLoginPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>
                    <LogIn size={16} /> Sign In to AgroLink
                  </button>
                  <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setActiveTab('register')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                      Register here
                    </button>
                  </p>
                </form>
              )}

              {/* Admin Login */}
              {loginRole === 'admin' && (
                <form onSubmit={handleAdminLogin}>
                  {adminError && (
                    <div style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                      <AlertTriangle size={15} /> {adminError}
                    </div>
                  )}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(124,58,237,0.06)', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(124,58,237,0.2)', marginBottom: '1rem',
                    fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600,
                  }}>
                    <Shield size={15} /> System Administrator Access
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Username</label>
                    <input type="text" className="form-control" placeholder="Enter admin username"
                      value={adminUsername} onChange={e => { setAdminUsername(e.target.value); setAdminError(''); }}
                      required autoFocus autoComplete="username" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Password</label>
                    <input type="password" className="form-control" placeholder="Enter admin password"
                      value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setAdminError(''); }}
                      required autoComplete="current-password" />
                  </div>
                  <button type="submit" style={{
                    width: '100%', marginTop: '0.5rem', padding: '0.85rem', borderRadius: 'var(--radius-md)',
                    border: 'none', background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
                    color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}>
                    <Shield size={16} /> Access Admin Console
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── REGISTER TAB ── */}
          {activeTab === 'register' && (
            <div>
              <div className="register-role-toggle">
                <button type="button" onClick={() => setRegisterRole('farmer')} className={`register-role-btn ${registerRole === 'farmer' ? 'active' : ''}`}>
                  <Leaf size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Register as Farmer
                </button>
                <button type="button" onClick={() => setRegisterRole('buyer')} className={`register-role-btn ${registerRole === 'buyer' ? 'active' : ''}`}>
                  <Globe size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Register as Buyer
                </button>
              </div>

              {/* ── Farmer Form ── */}
              {registerRole === 'farmer' ? (
                <form onSubmit={handleFarmerSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Name / Cooperative Name</label>
                    <input type="text" className="form-control" placeholder="e.g. Sibusiso Dlamini"
                      value={farmerForm.name} onChange={e => setFarmerForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>

                  {/* Country Selector */}
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <select className="form-control" value={farmerForm.country}
                      onChange={e => handleCountryChange(e.target.value, 'farmer')}>
                      {AFRICAN_COUNTRIES.map(c => (
                        <option key={c.name} value={c.name}>{c.flag} {c.name} ({c.currency})</option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                      Your prices will display in <strong>{farmerForm.currency}</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Town / Region</label>
                    <input type="text" className="form-control" placeholder="e.g. Manzini, Lubombo Region"
                      value={farmerForm.location} onChange={e => setFarmerForm(p => ({ ...p, location: e.target.value }))} required />
                  </div>

                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Farm Size (Acres)</label>
                      <input type="number" className="form-control"
                        value={farmerForm.farmSize} onChange={e => setFarmerForm(p => ({ ...p, farmSize: parseFloat(e.target.value) || 0 }))} min="1" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Primary Crops (comma sep.)</label>
                      <input type="text" className="form-control" placeholder="e.g. Sugarcane, Maize"
                        value={farmerForm.cropTypes} onChange={e => setFarmerForm(p => ({ ...p, cropTypes: e.target.value }))} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Mobile</label>
                    <input type="text" className="form-control" placeholder="e.g. +268 7602-1234"
                      value={farmerForm.contact} onChange={e => setFarmerForm(p => ({ ...p, contact: e.target.value }))} required />
                  </div>

                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Password (min 6 chars)</label>
                      <input type="password" className="form-control" placeholder="Create password"
                        value={farmerForm.password} onChange={e => setFarmerForm(p => ({ ...p, password: e.target.value }))} minLength={6} required autoComplete="new-password" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input type="password" className="form-control" placeholder="Repeat password"
                        value={farmerForm.confirmPassword} onChange={e => setFarmerForm(p => ({ ...p, confirmPassword: e.target.value }))} minLength={6} required autoComplete="new-password" />
                    </div>
                  </div>

                  {/* Verification measures for Farmers */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Shield size={14} /> Identity & Cooperative Verification
                    </div>
                    <div className="form-group">
                      <label className="form-label">National ID / Cooperative Registration ID</label>
                      <input type="text" className="form-control" placeholder="e.g. SZ-COOP-5523"
                        value={farmerForm.regNumber} onChange={e => setFarmerForm(p => ({ ...p, regNumber: e.target.value }))} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Upload Verification Certificate (National ID / Land Permit)</label>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <label className="btn btn-secondary flex-gap-sm" style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                          <Upload size={13} /> Select File...
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFarmerDocChange} style={{ display: 'none' }} />
                        </label>
                        <span style={{ fontSize: '0.78rem', color: farmerForm.docName ? 'var(--color-primary-dark)' : 'var(--color-text-muted)', fontWeight: farmerForm.docName ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {farmerForm.docName ? farmerForm.docName : 'No file chosen'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="form-group">
                    <label className="form-label">Profile Photo</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--color-background)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '0.75rem' }}>
                      <img src={farmerForm.avatar} alt="preview" className="avatar" style={{ width: '48px', height: '48px', border: '2px solid var(--color-primary-light)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Upload Photo</span>
                        <label className="btn btn-secondary flex-gap-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', margin: 0 }}>
                          <Camera size={12} /> Browse...
                          <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>
                    <div className="avatar-selector-grid">
                      {AVATAR_OPTIONS.map((url, idx) => (
                        <button key={idx} type="button" onClick={() => setFarmerForm(p => ({ ...p, avatar: url }))}
                          className={`avatar-option-btn ${farmerForm.avatar === url ? 'selected' : ''}`}>
                          <img src={url} alt={`Preset ${idx + 1}`} className="avatar-option-img" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <User size={16} /> Create Farmer Account
                  </button>
                  <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Already registered?{' '}
                    <button type="button" onClick={() => setActiveTab('login')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                      Sign in here
                    </button>
                  </p>
                </form>
              ) : (
                /* ── Buyer Form ── */
                <form onSubmit={handleBuyerSubmit}>
                  <div className="form-group">
                    <label className="form-label">Company / Entity Name</label>
                    <input type="text" className="form-control" placeholder="e.g. Eswatini Sugar Association"
                      value={buyerForm.company} onChange={e => setBuyerForm(p => ({ ...p, company: e.target.value }))} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Business Category</label>
                    <select className="form-control" value={buyerForm.category}
                      onChange={e => setBuyerForm(p => ({ ...p, category: e.target.value as BuyerProfile['category'] }))}>
                      <option value="Retail">Retail Store / Fresh Market</option>
                      <option value="Wholesale">Wholesale Distributor</option>
                      <option value="Processing">Agrifood Processing Plant</option>
                      <option value="Exporter">SADC International Exporter</option>
                    </select>
                  </div>

                  {/* Country Selector */}
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <select className="form-control" value={buyerForm.country}
                      onChange={e => handleCountryChange(e.target.value, 'buyer')}>
                      {AFRICAN_COUNTRIES.map(c => (
                        <option key={c.name} value={c.name}>{c.flag} {c.name} ({c.currency})</option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                      Prices will display in <strong>{buyerForm.currency}</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">City / Region</label>
                    <input type="text" className="form-control" placeholder="e.g. Johannesburg, Gauteng"
                      value={buyerForm.location} onChange={e => setBuyerForm(p => ({ ...p, location: e.target.value }))} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sourcing Contact Email</label>
                    <input type="email" className="form-control" placeholder="e.g. purchasing@company.co.sz"
                      value={buyerForm.contact} onChange={e => setBuyerForm(p => ({ ...p, contact: e.target.value }))} required />
                  </div>

                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Password (min 6 chars)</label>
                      <input type="password" className="form-control" placeholder="Create password"
                        value={buyerForm.password} onChange={e => setBuyerForm(p => ({ ...p, password: e.target.value }))} minLength={6} required autoComplete="new-password" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input type="password" className="form-control" placeholder="Repeat password"
                        value={buyerForm.confirmPassword} onChange={e => setBuyerForm(p => ({ ...p, confirmPassword: e.target.value }))} minLength={6} required autoComplete="new-password" />
                    </div>
                  </div>

                  {/* Verification measures for Buyers */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-info)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Shield size={14} /> Corporate Legitimacy & Tax Registry
                    </div>
                    <div className="form-group">
                      <label className="form-label">Business Registration Number / TIN</label>
                      <input type="text" className="form-control" placeholder="e.g. SZ-TIN-88231"
                        value={buyerForm.regNumber} onChange={e => setBuyerForm(p => ({ ...p, regNumber: e.target.value }))} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Upload SADC Business Certificate / License</label>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <label className="btn btn-secondary flex-gap-sm" style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                          <Upload size={13} /> Select File...
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleBuyerDocChange} style={{ display: 'none' }} />
                        </label>
                        <span style={{ fontSize: '0.78rem', color: buyerForm.docName ? 'var(--color-info)' : 'var(--color-text-muted)', fontWeight: buyerForm.docName ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {buyerForm.docName ? buyerForm.docName : 'No file chosen'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    <Globe size={16} /> Create Buyer Account
                  </button>
                  <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Already registered?{' '}
                    <button type="button" onClick={() => setActiveTab('login')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                      Sign in here
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
