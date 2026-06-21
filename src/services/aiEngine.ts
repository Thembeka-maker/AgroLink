import { ProduceListing, DemandRequirement, FarmerProfile, CropPriceIntelligence } from '../types';
import { CROP_PRICE_INTELLIGENCE } from '../mockData';

// Simulated AI Engine Services
export const aiEngine = {
  /**
   * Run Demand Forecast & Price Intelligence
   * Fetches historical and market data, generates forecast demand indexes and recommended price ranges.
   */
  getDemandForecast(crop: string): CropPriceIntelligence {
    const existingIntel = CROP_PRICE_INTELLIGENCE[crop];
    if (existingIntel) {
      return existingIntel;
    }

    // Dynamic generation if a new crop is added
    const hash = crop.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const avg = 1.0 + (hash % 100) / 20; // Simulated average price
    const min = parseFloat((avg * 0.75).toFixed(2));
    const max = parseFloat((avg * 1.25).toFixed(2));
    const currentDemand = (hash % 6) + 4; // 4 to 9
    const forecastDemand = Math.min(10, Math.max(1, currentDemand + (hash % 3) - 1)); // -1, 0, +1
    const trend = forecastDemand > currentDemand ? 'up' : forecastDemand < currentDemand ? 'down' : 'stable';
    const recommended = parseFloat((trend === 'up' ? avg * 1.05 : trend === 'down' ? avg * 0.95 : avg).toFixed(2));

    const history = Array.from({ length: 6 }, (_, i) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const factor = 1 + ((hash + i) % 15 - 7.5) / 100;
      return {
        month: months[i],
        price: parseFloat((avg * factor).toFixed(2)),
        demandIndex: Math.min(10, Math.max(1, currentDemand + (i % 3) - 1))
      };
    });

    return {
      crop,
      minPrice: min,
      maxPrice: max,
      avgPrice: parseFloat(avg.toFixed(2)),
      currentDemandIndex: currentDemand,
      forecastDemandIndex: forecastDemand,
      forecastPriceTrend: trend,
      recommendedPrice: recommended,
      marketInsights: `AI Analysis: Market activities for ${crop} demonstrate ${trend === 'up' ? 'surging interest and tight supply' : trend === 'down' ? 'temporary oversaturation' : 'balanced equilibrium'}. Recommended listing price of $${recommended}/kg is optimized for rapid matching.`,
      history
    };
  },

  /**
   * Run Smart Matching Algorithm
   * Queries matching farmers & lists, returns ranked results with detailed matching indicators.
   */
  runSmartMatching(
    demand: DemandRequirement,
    listings: ProduceListing[],
    farmers: FarmerProfile[]
  ): Array<{
    listing: ProduceListing;
    farmer: FarmerProfile;
    matchScore: number; // 0 to 100
    reasons: string[];
  }> {
    const activeListings = listings.filter(
      (l) => l.crop.toLowerCase() === demand.crop.toLowerCase() && l.quantity > 0
    );

    const matches = activeListings.map((listing) => {
      const farmer = farmers.find((f) => f.id === listing.farmerId) || {
        id: listing.farmerId,
        name: listing.farmerName,
        country: 'Eswatini',
        currency: 'SZL',
        location: listing.location,
        farmSize: 50,
        cropTypes: [listing.crop],
        contact: 'N/A',
        rating: listing.farmerRating,
        ratingCount: 10,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        password: '',
        registeredDate: '2025-01-01',
        approved: true,
        regNumber: 'SZ-FARM-FALLBACK',
      };

      let scorePoints = 0;
      const reasons: string[] = [];

      // 1. Price Matching (Weight: 35 points)
      // If within budget, full points. If cheaper, bonus explanation. If slightly over budget, scaled penalty.
      if (listing.price <= demand.budget) {
        const savingsPct = ((demand.budget - listing.price) / demand.budget) * 100;
        scorePoints += 35;
        if (savingsPct > 15) {
          reasons.push(`Highly Cost-Effective (Save ${savingsPct.toFixed(0)}% vs budget)`);
        } else {
          reasons.push('Within Budget');
        }
      } else {
        const overBudgetPct = ((listing.price - demand.budget) / demand.budget) * 100;
        if (overBudgetPct <= 20) {
          scorePoints += Math.max(0, 35 - overBudgetPct * 1.5);
          reasons.push(`Slightly Over Budget (+${overBudgetPct.toFixed(0)}%)`);
        } else {
          scorePoints += 0;
          reasons.push('Over Budget');
        }
      }

      // 2. Quantity Matching (Weight: 25 points)
      // Ideal match is listing quantity >= demand quantity (it satisfies the full request).
      // If it doesn't, we grade based on how much it satisfies.
      if (listing.quantity >= demand.quantity) {
        scorePoints += 25;
        reasons.push('Fulfills Quantity Demand');
      } else {
        const fulfillmentPct = (listing.quantity / demand.quantity) * 100;
        scorePoints += (fulfillmentPct / 100) * 20; // Max 20 points for partial
        reasons.push(`Partial Quantity Match (Covers ${fulfillmentPct.toFixed(0)}%)`);
      }

      // 3. Location / Proximity (Weight: 20 points)
      // Parse state code (e.g. CA, IL, LA, TX)
      const buyerState = demand.location.split(',').pop()?.trim() || '';
      const listingState = listing.location.split(',').pop()?.trim() || '';

      if (buyerState === listingState && buyerState !== '') {
        scorePoints += 20;
        reasons.push('Local Supplier (Same State)');
      } else {
        scorePoints += 10;
        reasons.push('Regional Supplier');
      }

      // 4. Farmer Reputation (Weight: 20 points)
      // Scale rating out of 5.0 to 20 points
      const ratingScore = (farmer.rating / 5.0) * 20;
      scorePoints += ratingScore;
      if (farmer.rating >= 4.7) {
        reasons.push(`Top-Rated Farmer (${farmer.rating} ⭐)`);
      }

      // Final Rounded Score
      const finalScore = Math.min(100, Math.max(10, Math.round(scorePoints)));

      return {
        listing,
        farmer,
        matchScore: finalScore,
        reasons,
      };
    });

    // Rank from highest match score to lowest
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  },
};
