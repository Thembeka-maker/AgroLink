import React, { useState } from 'react';
import {
  Users, ShoppingBag, TrendingUp, Package, Shield, UserX, UserCheck,
  BarChart2, AlertTriangle, LogOut, Trash2, Eye,
  DollarSign, FileText, Mail, Inbox, RefreshCw, Download,
} from 'lucide-react';
import { AdminProfile, FarmerProfile, BuyerProfile, DealOffer, ProduceListing } from '../types';
import { formatCurrency } from '../services/currencyService';
import { emailService, EmailLog } from '../services/emailService';

interface AdminPortalProps {
  admin: AdminProfile;
  farmers: FarmerProfile[];
  buyers: BuyerProfile[];
  deals: DealOffer[];
  listings: ProduceListing[];
  onSuspendFarmer: (id: string, suspend: boolean) => void;
  onSuspendBuyer: (id: string, suspend: boolean) => void;
  onDeleteFarmer: (id: string) => void;
  onDeleteBuyer: (id: string) => void;
  onApproveFarmer: (id: string) => void;
  onApproveBuyer: (id: string) => void;
  onLogout: () => void;
}

type AdminTab = 'overview' | 'farmers' | 'buyers' | 'deals' | 'listings' | 'emails';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  admin, farmers, buyers, deals, listings,
  onSuspendFarmer, onSuspendBuyer, onDeleteFarmer, onDeleteBuyer,
  onApproveFarmer, onApproveBuyer, onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'farmer' | 'buyer'; id: string; name: string } | null>(null);
  const [inspectDoc, setInspectDoc] = useState<{ name: string; type: 'farmer' | 'buyer'; regNumber: string; docName: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => emailService.getEmailLogs());

  // Listen for new emails dispatched by the system
  React.useEffect(() => {
    const handler = () => setEmailLogs(emailService.getEmailLogs());
    window.addEventListener('agrolink_email_sent', handler);
    return () => window.removeEventListener('agrolink_email_sent', handler);
  }, []);

  const totalRevenue = deals.filter(d => d.paymentStatus === 'paid').reduce((s, d) => s + d.totalAmount, 0);
  const pendingPayments = deals.filter(d => d.status === 'accepted' && d.paymentStatus === 'unpaid').length;
  const pendingApprovals = farmers.filter(f => !f.approved).length + buyers.filter(b => !b.approved).length;
  const activeListings = listings.length;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 size={16} /> },
    { id: 'farmers', label: `Farmers (${farmers.length})`, icon: <Users size={16} /> },
    { id: 'buyers', label: `Buyers (${buyers.length})`, icon: <ShoppingBag size={16} /> },
    { id: 'deals', label: `Deals (${deals.length})`, icon: <TrendingUp size={16} /> },
    { id: 'listings', label: `Listings (${listings.length})`, icon: <Package size={16} /> },
    { id: 'emails', label: `Email Log (${emailLogs.length})`, icon: <Mail size={16} /> },
  ];

  const statCards = [
    { label: 'Total Farmers', value: farmers.length, icon: <Users size={22} />, color: '#52b788' },
    { label: 'Total Buyers', value: buyers.length, icon: <ShoppingBag size={22} />, color: '#3b82f6' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: <Shield size={22} />, color: '#f59e0b' },
    { label: 'Revenue (USD)', value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={22} />, color: '#10b981' },
    { label: 'Pending Payments', value: pendingPayments, icon: <AlertTriangle size={22} />, color: '#ef4444' },
    { label: 'Active Listings', value: activeListings, icon: <Package size={22} />, color: '#8b5cf6' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4' }}>
      {/* Admin Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1a3c2a 0%, #2d6a4f 100%)',
        padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #52b788, #95d5b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', lineHeight: 1 }}>AgroLink Admin</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
              {admin.displayName} · {admin.role === 'super' ? 'Super Administrator' : 'Moderator'}
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', borderRadius: '8px', padding: '0.45rem 0.85rem',
          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
        }}>
          <LogOut size={14} /> Sign Out
        </button>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Tab Nav */}
        <div style={{
          display: 'flex', gap: '0.4rem', backgroundColor: '#fff',
          padding: '0.4rem', borderRadius: '14px', marginBottom: '2rem',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)', flexWrap: 'wrap',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', borderRadius: '10px', border: 'none',
                fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', transition: 'all 0.18s',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #1a3c2a, #2d6a4f)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a3c2a' }}>
              System Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {statCards.map(card => (
                <div key={card.label} style={{
                  backgroundColor: '#fff', borderRadius: '14px', padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${card.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {card.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                        {card.value}
                      </div>
                    </div>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      backgroundColor: `${card.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: card.color,
                    }}>
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Deals */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#1a3c2a' }}>Recent Deals</h3>
              {deals.slice(0, 5).map(deal => (
                <div key={deal.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{deal.crop}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                      {deal.farmerName} → {deal.buyerName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>${deal.totalAmount.toLocaleString()}</span>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                      backgroundColor: deal.paymentStatus === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                      color: deal.paymentStatus === 'paid' ? '#059669' : '#dc2626',
                    }}>
                      {deal.paymentStatus.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                      backgroundColor: deal.status === 'accepted' ? 'rgba(59,130,246,0.1)' : deal.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                      color: deal.status === 'accepted' ? '#2563eb' : deal.status === 'pending' ? '#92400e' : '#dc2626',
                    }}>
                      {deal.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FARMERS ── */}
        {activeTab === 'farmers' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a3c2a' }}>
              Farmer Accounts
            </h2>
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {farmers.map((farmer, i) => (
                <div key={farmer.id} style={{ borderBottom: i < farmers.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem', flexWrap: 'wrap',
                  }}>
                    <img src={farmer.avatar} alt={farmer.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {farmer.name}
                        {farmer.suspended && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(239,68,68,0.12)', color: '#dc2626', borderRadius: '20px', fontWeight: 700 }}>
                            SUSPENDED
                          </span>
                        )}
                        {!farmer.approved && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706', borderRadius: '20px', fontWeight: 700 }}>
                            PENDING APPROVAL
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {farmer.location} · {farmer.country} · {farmer.currency}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {farmer.cropTypes.join(', ')} · {farmer.farmSize} ac · ⭐ {farmer.rating}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
                      {!farmer.approved && (
                        <button
                          onClick={() => onApproveFarmer(farmer.id)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                            color: '#fff', borderRadius: '8px', padding: '0.35rem 0.75rem', cursor: 'pointer',
                            fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}
                        >
                          <Shield size={13} /> Approve
                        </button>
                      )}
                      <button
                        onClick={() => setInspectDoc({ name: farmer.name, type: 'farmer', regNumber: farmer.regNumber, docName: farmer.docName || 'not_uploaded.pdf' })}
                        style={{
                          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
                          color: '#2563eb', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700,
                        }}
                      >
                        <FileText size={13} /> View Doc
                      </button>
                      <button
                        onClick={() => setExpandedRow(expandedRow === farmer.id ? null : farmer.id)}
                        style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onSuspendFarmer(farmer.id, !farmer.suspended)}
                        style={{
                          background: farmer.suspended ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                          border: `1px solid ${farmer.suspended ? 'rgba(16,185,129,0.3)' : 'rgba(234,179,8,0.3)'}`,
                          color: farmer.suspended ? '#059669' : '#92400e',
                          borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                        }}
                      >
                        {farmer.suspended ? <UserCheck size={13} /> : <UserX size={13} />}
                        {farmer.suspended ? 'Reinstate' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: 'farmer', id: farmer.id, name: farmer.name })}
                        style={{
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                          color: '#dc2626', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700,
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                  {/* Expanded details */}
                  {expandedRow === farmer.id && (
                    <div style={{ padding: '0 1.5rem 1rem', backgroundColor: 'var(--color-background)', borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                        {[
                          ['ID', farmer.id],
                          ['Registry ID', farmer.regNumber || 'N/A'],
                          ['Contact', farmer.contact],
                          ['Registered', farmer.registeredDate],
                          ['Ratings', `${farmer.ratingCount} reviews`],
                          ['Deals', deals.filter(d => d.farmerId === farmer.id).length + ' total'],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{k}</div>
                            <div style={{ fontWeight: 700 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {farmers.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No farmer accounts registered yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ── BUYERS ── */}
        {activeTab === 'buyers' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a3c2a' }}>
              Buyer Accounts
            </h2>
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {buyers.map((buyer, i) => (
                <div key={buyer.id} style={{ borderBottom: i < buyers.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: '#fff', fontSize: '1.1rem',
                    }}>
                      {buyer.company.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {buyer.company}
                        {buyer.suspended && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(239,68,68,0.12)', color: '#dc2626', borderRadius: '20px', fontWeight: 700 }}>SUSPENDED</span>
                        )}
                        {!buyer.approved && (
                          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706', borderRadius: '20px', fontWeight: 700 }}>PENDING APPROVAL</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {buyer.location} · {buyer.country} · {buyer.currency} · {buyer.category}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
                      {!buyer.approved && (
                        <button
                          onClick={() => onApproveBuyer(buyer.id)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                            color: '#fff', borderRadius: '8px', padding: '0.35rem 0.75rem', cursor: 'pointer',
                            fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}
                        >
                          <Shield size={13} /> Approve
                        </button>
                      )}
                      <button
                        onClick={() => setInspectDoc({ name: buyer.company, type: 'buyer', regNumber: buyer.regNumber, docName: buyer.docName || 'not_uploaded.pdf' })}
                        style={{
                          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
                          color: '#2563eb', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700,
                        }}
                      >
                        <FileText size={13} /> View Doc
                      </button>
                      <button
                        onClick={() => onSuspendBuyer(buyer.id, !buyer.suspended)}
                        style={{
                          background: buyer.suspended ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
                          border: `1px solid ${buyer.suspended ? 'rgba(16,185,129,0.3)' : 'rgba(234,179,8,0.3)'}`,
                          color: buyer.suspended ? '#059669' : '#92400e',
                          borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                        }}
                      >
                        {buyer.suspended ? <UserCheck size={13} /> : <UserX size={13} />}
                        {buyer.suspended ? 'Reinstate' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: 'buyer', id: buyer.id, name: buyer.company })}
                        style={{
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                          color: '#dc2626', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700,
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {buyers.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No buyer accounts registered yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ── DEALS ── */}
        {activeTab === 'deals' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a3c2a' }}>All Deals</h2>
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background)' }}>
                      {['Crop', 'Farmer', 'Buyer', 'Qty (kg)', 'Total (USD)', 'Deal Status', 'Payment', 'Date'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map(deal => (
                      <tr key={deal.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{deal.crop}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{deal.farmerName}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{deal.buyerName}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{deal.quantity.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>${deal.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                            backgroundColor: deal.status === 'accepted' ? 'rgba(16,185,129,0.1)' : deal.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                            color: deal.status === 'accepted' ? '#059669' : deal.status === 'pending' ? '#92400e' : '#dc2626',
                          }}>
                            {deal.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                            backgroundColor: deal.paymentStatus === 'paid' ? 'rgba(16,185,129,0.12)' : deal.paymentStatus === 'processing' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.08)',
                            color: deal.paymentStatus === 'paid' ? '#059669' : deal.paymentStatus === 'processing' ? '#2563eb' : '#dc2626',
                          }}>
                            {deal.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{deal.dateCreated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {deals.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No deals recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ── LISTINGS ── */}
        {activeTab === 'listings' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1a3c2a' }}>Active Listings</h2>
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background)' }}>
                      {['Crop', 'Farmer', 'Qty (kg)', 'Price/kg (USD)', 'Grade', 'Location', 'Listed'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--color-border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{l.crop}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{l.farmerName}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{l.quantity.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>${l.price.toFixed(3)}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: l.grade === 'A' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)', color: l.grade === 'A' ? '#059669' : '#92400e' }}>
                            Grade {l.grade}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{l.location}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{l.dateListed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {listings.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No listings yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ── EMAIL LOG ── */}
        {activeTab === 'emails' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a3c2a' }}>Simulated Email Log</h2>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => setEmailLogs(emailService.getEmailLogs())}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)',
                    background: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)',
                  }}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
                <button
                  onClick={() => { emailService.clearEmailLogs(); setEmailLogs([]); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.07)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#dc2626',
                  }}
                >
                  <Trash2 size={13} /> Clear Log
                </button>
              </div>
            </div>

            {emailLogs.length === 0 ? (
              <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Inbox size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ fontSize: '0.95rem' }}>No emails have been dispatched yet. Email notifications appear here when accounts are approved, suspended, or payments are confirmed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {emailLogs.map((log) => (
                  <div key={log.id} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a3c2a', marginBottom: '0.15rem' }}>{log.subject}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mail size={12} /> To: <strong>{log.to}</strong>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontFamily: 'monospace', backgroundColor: 'var(--color-background)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', backgroundColor: 'var(--color-background)', padding: '0.65rem 0.85rem', borderRadius: '8px', lineHeight: '1.5', fontStyle: 'italic', borderLeft: '3px solid rgba(59,130,246,0.25)' }}>
                      {log.body}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Shield size={11} /> Simulated — AgroLink Email System &bull; ID: {log.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={28} color="#dc2626" />
              </div>
            </div>
            <h3 style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Delete Account?</h3>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              This will permanently delete <strong>{confirmDelete.name}</strong>'s account and all associated data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === 'farmer') onDeleteFarmer(confirmDelete.id);
                  else onDeleteBuyer(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                style={{ flex: 1, padding: '0.7rem', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Document Modal */}
      {inspectDoc && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <Shield size={22} color={inspectDoc.type === 'farmer' ? '#059669' : '#2563eb'} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Document Inspection</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{inspectDoc.name}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Account Type:</span>
              <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{inspectDoc.type}</span>
              
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Registry ID:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1a3c2a' }}>{inspectDoc.regNumber}</span>
              
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Document Name:</span>
              <span style={{ fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FileText size={14} /> {inspectDoc.docName}
              </span>
            </div>

            {/* Simulated certificate preview */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              borderRadius: '12px', border: '2px solid rgba(16,185,129,0.3)',
              padding: '1.25rem', marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={18} color="#059669" />
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#059669' }}>SADC VERIFIED CERTIFICATE</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace' }}>AES-256 Encrypted</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Document:</span>
                <span style={{ fontWeight: 700, color: '#1a3c2a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FileText size={13} />{inspectDoc.docName}
                </span>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Account:</span>
                <span style={{ fontWeight: 700 }}>{inspectDoc.name}</span>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Registry:</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>{inspectDoc.regNumber}</span>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Type:</span>
                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{inspectDoc.type} Account</span>
              </div>
              <div style={{ borderTop: '1px dashed rgba(16,185,129,0.4)', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>✓ Signature Integrity: Valid</span>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem',
                    padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.4)',
                    background: 'rgba(16,185,129,0.08)', color: '#059669', cursor: 'pointer', fontWeight: 700,
                  }}
                  onClick={() => alert(`[Simulated] Download: ${inspectDoc.docName}`)}
                >
                  <Download size={11} /> Download
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setInspectDoc(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Close
              </button>
              {((inspectDoc.type === 'farmer' && farmers.find(f => f.name === inspectDoc.name)?.approved === false) ||
                (inspectDoc.type === 'buyer' && buyers.find(b => b.company === inspectDoc.name)?.approved === false)) && (
                <button
                  onClick={() => {
                    if (inspectDoc.type === 'farmer') {
                      const f = farmers.find(farm => farm.name === inspectDoc.name);
                      if (f) onApproveFarmer(f.id);
                    } else {
                      const b = buyers.find(buy => buy.company === inspectDoc.name);
                      if (b) onApproveBuyer(b.id);
                    }
                    setInspectDoc(null);
                  }}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Approve Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
