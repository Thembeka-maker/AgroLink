export interface Review {
  id: string;
  buyerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface FarmerProfile {
  id: string;
  name: string;
  country: string;       // e.g. "Eswatini"
  currency: string;      // ISO code e.g. "SZL"
  location: string;
  farmSize: number;      // in acres
  cropTypes: string[];
  contact: string;
  rating: number;
  ratingCount: number;
  avatar: string;
  password: string;
  suspended?: boolean;
  registeredDate: string;
  approved: boolean;
  regNumber: string;
  docName?: string;
  docUrl?: string;
  emailVerified?: boolean;
  preferredPaymentMethod?: 'card' | 'mobile_money' | 'bank_transfer';
  reviews?: Review[];
}

export interface BuyerProfile {
  id: string;
  company: string;
  category: 'Retail' | 'Wholesale' | 'Processing' | 'Exporter';
  contact: string;
  country: string;       // e.g. "South Africa"
  currency: string;      // ISO code e.g. "ZAR"
  location: string;
  password: string;
  suspended?: boolean;
  registeredDate: string;
  approved: boolean;
  regNumber: string;
  docName?: string;
  docUrl?: string;
  emailVerified?: boolean;
  preferredPaymentMethod?: 'card' | 'mobile_money' | 'bank_transfer';
}

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: 'super' | 'moderator';
  registeredDate: string;
}

export interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerRating: number;
  crop: string;
  quantity: number;  // in kg
  price: number;     // price per kg in USD
  grade: 'A' | 'B' | 'C';
  location: string;
  dateListed: string;
}

export interface DemandRequirement {
  id: string;
  buyerId: string;
  buyerName: string;
  crop: string;
  quantity: number;  // in kg
  budget: number;    // max budget per kg in USD
  deadline: string;
  location: string;
  datePosted: string;
}

export interface DealOffer {
  id: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  listingId?: string;
  crop: string;
  quantity: number;        // in kg
  price: number;           // negotiated price per kg in USD
  totalAmount: number;     // USD
  status: 'pending' | 'accepted' | 'rejected';
  deliveryDate: string;
  deliveryStatus: 'none' | 'scheduled' | 'in-transit' | 'delivered';
  ratingGiven: boolean;
  dateCreated: string;
  // Payment
  paymentStatus: 'unpaid' | 'processing' | 'paid';
  paymentMethod?: 'bank_transfer' | 'mobile_money' | 'card';
  paymentReference?: string;
  paymentDate?: string;
}

export interface MarketHistory {
  month: string;
  price: number;
  demandIndex: number; // 1 to 10
}

export interface CropPriceIntelligence {
  crop: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  currentDemandIndex: number;
  forecastDemandIndex: number;
  forecastPriceTrend: 'up' | 'down' | 'stable';
  recommendedPrice: number;
  marketInsights: string;
  history: MarketHistory[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'deal_offer' | 'deal_status' | 'matching_alert' | 'payment' | 'admin';
}

export interface PaymentDetails {
  dealId: string;
  method: 'bank_transfer' | 'mobile_money' | 'card';
  amountUSD: number;
  buyerCurrency: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  mobileNumber?: string;
  bankRef?: string;
}
