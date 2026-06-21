/**
 * AgroLink Persistence Service
 * Stores all application data in localStorage so accounts and records
 * survive page refreshes and browser sessions.
 */

import {
  FarmerProfile,
  BuyerProfile,
  AdminProfile,
  ProduceListing,
  DemandRequirement,
  DealOffer,
} from '../types';

const KEYS = {
  FARMERS:  'agrolink_v2_farmers',
  BUYERS:   'agrolink_v2_buyers',
  ADMINS:   'agrolink_v2_admins',
  LISTINGS: 'agrolink_v2_listings',
  DEMANDS:  'agrolink_v2_demands',
  DEALS:    'agrolink_v2_deals',
  SEEDED:   'agrolink_v2_seeded',
};

// ─── Generic read/write helpers ───────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded – silently ignore
  }
}

// ─── Seeding ──────────────────────────────────────────────────────────────────

/**
 * Seeds initial data only once (first ever load).
 * Pass the initial arrays from mockData.ts.
 */
export function seedIfEmpty(
  farmers: FarmerProfile[],
  buyers: BuyerProfile[],
  listings: ProduceListing[],
  demands: DemandRequirement[],
  deals: DealOffer[]
): void {
  if (read<boolean>(KEYS.SEEDED, false)) return;

  write(KEYS.FARMERS,  farmers);
  write(KEYS.BUYERS,   buyers);
  write(KEYS.LISTINGS, listings);
  write(KEYS.DEMANDS,  demands);
  write(KEYS.DEALS,    deals);
  write(KEYS.ADMINS,   getDefaultAdmins());
  write(KEYS.SEEDED,   true);
}

function getDefaultAdmins(): AdminProfile[] {
  return [
    {
      id: 'admin_1',
      username: 'admin',
      displayName: 'System Administrator',
      password: 'admin2026',
      role: 'super',
      registeredDate: '2025-01-01',
    },
  ];
}

// ─── Farmers ──────────────────────────────────────────────────────────────────

export const farmerStore = {
  getAll: (): FarmerProfile[]             => read<FarmerProfile[]>(KEYS.FARMERS, []),
  save:   (data: FarmerProfile[]): void   => write(KEYS.FARMERS, data),
  add(farmer: FarmerProfile): void {
    const all = farmerStore.getAll();
    farmerStore.save([...all, farmer]);
  },
  update(updated: FarmerProfile): void {
    const all = farmerStore.getAll().map(f => f.id === updated.id ? updated : f);
    farmerStore.save(all);
  },
};

// ─── Buyers ───────────────────────────────────────────────────────────────────

export const buyerStore = {
  getAll: (): BuyerProfile[]           => read<BuyerProfile[]>(KEYS.BUYERS, []),
  save:   (data: BuyerProfile[]): void => write(KEYS.BUYERS, data),
  add(buyer: BuyerProfile): void {
    const all = buyerStore.getAll();
    buyerStore.save([...all, buyer]);
  },
  update(updated: BuyerProfile): void {
    const all = buyerStore.getAll().map(b => b.id === updated.id ? updated : b);
    buyerStore.save(all);
  },
  remove(id: string): void {
    buyerStore.save(buyerStore.getAll().filter(b => b.id !== id));
  },
};

// ─── Admins ───────────────────────────────────────────────────────────────────

export const adminStore = {
  getAll: (): AdminProfile[]           => read<AdminProfile[]>(KEYS.ADMINS, getDefaultAdmins()),
  save:   (data: AdminProfile[]): void => write(KEYS.ADMINS, data),
};

// ─── Listings ─────────────────────────────────────────────────────────────────

export const listingStore = {
  getAll: (): ProduceListing[]           => read<ProduceListing[]>(KEYS.LISTINGS, []),
  save:   (data: ProduceListing[]): void => write(KEYS.LISTINGS, data),
};

// ─── Demands ──────────────────────────────────────────────────────────────────

export const demandStore = {
  getAll: (): DemandRequirement[]           => read<DemandRequirement[]>(KEYS.DEMANDS, []),
  save:   (data: DemandRequirement[]): void => write(KEYS.DEMANDS, data),
};

// ─── Deals ────────────────────────────────────────────────────────────────────

export const dealStore = {
  getAll: (): DealOffer[]           => read<DealOffer[]>(KEYS.DEALS, []),
  save:   (data: DealOffer[]): void => write(KEYS.DEALS, data),
};
