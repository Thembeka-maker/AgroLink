import React, { useState } from 'react';
import { Sprout, Bell, Check, LogOut } from 'lucide-react';
import { Notification, FarmerProfile, BuyerProfile } from '../types';

interface HeaderProps {
  currentView: 'farmer' | 'buyer';
  onLogout: () => void;
  activeFarmer?: FarmerProfile;
  activeBuyer?: BuyerProfile;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onLogout,
  activeFarmer,
  activeBuyer,
  notifications,
  onMarkAsRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="header-bar">
      <div className="header-inner">
        {/* Brand Section */}
        <a href="#" className="brand-section">
          <div className="brand-logo-circle">
            <Sprout size={24} />
          </div>
          <div>
            <h1 className="brand-name">AgroLink</h1>
            <span className="brand-tagline">AI Smart Farming & Sourcing</span>
          </div>
        </a>

        {/* Navigation Actions */}
        <div className="nav-actions">
          {/* Switch Account / Log Out Button */}
          <button
            onClick={() => {
              setShowNotifications(false);
              onLogout();
            }}
            className="portal-switch-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <LogOut size={14} />
            Switch Account / Log Out
          </button>

          {/* Notifications Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="notification-bell-container"
              style={{ border: 'none', background: 'none' }}
              aria-label="Toggle notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="notifications-panel">
                <div className="notif-header">
                  <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Notifications</h4>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', fontWeight: 600 }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notif-item ${!notif.read ? 'unread' : ''}`}
                        onClick={() => {
                          onMarkAsRead(notif.id);
                        }}
                      >
                        <div
                          className="notif-icon-circle"
                          style={{
                            backgroundColor: notif.type === 'deal_offer'
                              ? 'var(--color-warning-light)'
                              : notif.type === 'deal_status'
                              ? 'var(--color-success-light)'
                              : 'var(--color-info-light)',
                            color: notif.type === 'deal_offer'
                              ? 'var(--color-warning)'
                              : notif.type === 'deal_status'
                              ? 'var(--color-success)'
                              : 'var(--color-info)'
                          }}
                        >
                          {notif.type === 'deal_status' ? <Check size={18} /> : <Sprout size={18} />}
                        </div>
                        <div className="notif-body">
                          <div className="notif-title">{notif.title}</div>
                          <div className="notif-msg">{notif.message}</div>
                          <div className="notif-time">{notif.timestamp}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="user-profile-badge">
            {currentView === 'farmer' && activeFarmer ? (
              <>
                <img
                  src={activeFarmer.avatar}
                  alt={activeFarmer.name}
                  className="avatar"
                />
                <div className="user-info-text">
                  <span className="user-name">{activeFarmer.name}</span>
                  <span className="user-role">Farmer</span>
                </div>
              </>
            ) : currentView === 'buyer' && activeBuyer ? (
              <>
                <div
                  className="avatar"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-primary-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: '2px solid white'
                  }}
                >
                  {activeBuyer.company.charAt(0)}
                </div>
                <div className="user-info-text">
                  <span className="user-name">{activeBuyer.company}</span>
                  <span className="user-role">{activeBuyer.category}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
