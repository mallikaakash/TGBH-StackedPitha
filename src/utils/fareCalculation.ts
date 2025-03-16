import { Coordinates, calculateDirectDistance, calculateDrivingDistance, calculateDeadMileage } from './mapboxService';

interface RideDetails {
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  driverLocation: Coordinates;
  vehicleType: 'auto' | 'car' | 'premium';
  estimatedWaitTime: number; // in minutes
}

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  waitTimeFare: number;
  incentive: number;
  demandMultiplier: number;
  fuelCost: number;
  estimatedProfit: number;
  fareIncentiveComponent: number;
  pointsIncentiveComponent: number;
  pointsEarned: number; // Number of points earned (1 point per 10 Rs)
  incentiveBreakdown: {
    surgePrice: number;
  };
}

interface FareResult {
  totalFare: number;
  breakdown: FareBreakdown;
}

// Constants for fare calculation
const RATES = {
  BASE_FARE: {
    auto: 30,
    car: 50, 
    premium: 100
  },
  DISTANCE_RATE: {
    auto: 12,
    car: 15,
    premium: 20
  },
  TIME_RATE: {
    auto: 2,
    car: 3,
    premium: 4
  }
};

// Mileage factors to calculate fuel costs (km per liter)
const VEHICLE_MILEAGE = {
  auto: 35,
  car: 15,
  premium: 10
};

const FUEL_PRICE = 100; // ₹100 per liter

const DEAD_MILEAGE_COMPENSATION = {
  auto: 0.6,
  car: 0.7,
  premium: 0.8
};

/**
 * Use Mapbox API to get accurate travel distance
 */
export const getMapboxDistance = async (origin: Coordinates, destination: Coordinates): Promise<number> => {
  try {
    const distance = await calculateDrivingDistance(origin, destination);
    const adjustedDistance = distance * 1.2;
    return adjustedDistance;
  } catch (error) {
    console.error('Error calculating Mapbox distance:', error);
    const directDistance = calculateDirectDistance(origin, destination);
    return directDistance;
  }
};

/**
 * Calculate driver incentive based on the 9x9 matrix model
 * Simplified to only include surge pricing when demand/supply is unbalanced
 */
const calculateDriverIncentive = (
  distance: number,
  demandLevel: number,
  supplyLevel: number,
  rideType: string
): { total: number, breakdown: { surgePrice: number } } => {
  // Determine surge pricing based on matrix position
  // Maximum surge of 30 rupees
  let surgePrice = 0;
  
  // Only apply surge pricing when demand and supply are unbalanced
  // Balanced scenarios: HD_HS, MD_MS, LD_LS have no surge
  
  // High demand, unbalanced supply scenarios
  if (rideType === 'HD_LS') {
    surgePrice = 30; // High demand, low supply - maximum surge
  } else if (rideType === 'HD_MS') {
    surgePrice = 25; // High demand, medium supply
  }
  // Medium demand, unbalanced supply scenarios
  else if (rideType === 'MD_LS') {
    surgePrice = 20; // Medium demand, low supply
  } else if (rideType === 'MD_HS') {
    surgePrice = 10; // Medium demand, high supply
  }
  // Low demand, unbalanced supply scenarios
  else if (rideType === 'LD_MS') {
    surgePrice = 5; // Low demand, medium supply
  } else if (rideType === 'LD_HS') {
    surgePrice = 0; // Low demand, high supply - no surge
  }
  // Balanced scenarios - no surge
  else if (rideType === 'HD_HS' || rideType === 'MD_MS' || rideType === 'LD_LS') {
    surgePrice = 0;
  }
  
  return {
    total: surgePrice,
    breakdown: {
      surgePrice
    }
  };
};

/**
 * Determine demand-supply multiplier based on the 9x9 matrix
 */
const getDemandSupplyMultiplier = (rideType: string): number => {
  // Enhanced multipliers based on matrix position
  if (rideType === 'HD_LS') return 1.0; // Highest surge
  if (rideType === 'HD_MS') return 1.0;
  if (rideType === 'HD_HS') return 1.0;
  
  if (rideType === 'MD_LS') return 1.0;
  if (rideType === 'MD_MS') return 1.0;
  if (rideType === 'MD_HS') return 1.0;
  
  if (rideType === 'LD_LS') return 1.0;
  if (rideType === 'LD_MS') return 1.0;
  if (rideType === 'LD_HS') return 1.0; // No surge for low demand, high supply
  
  // Default multiplier
  return 1.0;
};

/**
 * Calculate fuel cost based on distance and vehicle mileage
 */
const calculateFuelCost = (distance: number, vehicleType: 'auto' | 'car' | 'premium'): number => {
  const fuelConsumed = distance / VEHICLE_MILEAGE[vehicleType];
  const cost = fuelConsumed * FUEL_PRICE;
  return Math.round(cost);
};

/**
 * Calculate the dynamic fare for a ride asynchronously
 */
export const calculateDynamicFare = async (
  rideDetails: RideDetails,
  demandLevel: number = 0.5,
  supplyLevel: number = 0.5,
  rideType: string = 'MD_MS' // Default to medium demand, medium supply
): Promise<FareResult> => {
  const { vehicleType, estimatedWaitTime } = rideDetails;
  
  // Get actual route distance from MapBox API
  const routeDistance = await getMapboxDistance(
    rideDetails.pickupLocation,
    rideDetails.dropoffLocation
  );
  
  // Calculate dead mileage (just for reference, not used in pricing)
  const deadMileage = await calculateDeadMileage(
    rideDetails.driverLocation,
    rideDetails.pickupLocation
  );
  
  // Get demand multiplier based on the 9x9 matrix
  const demandMultiplier = getDemandSupplyMultiplier(rideType);
  
  // Calculate incentives (surge pricing only) with simplified logic
  const incentiveResult = calculateDriverIncentive(
    routeDistance,
    demandLevel,
    supplyLevel,
    rideType
  );
  
  // Calculate realistic fuel cost based on distance and vehicle type
  const fuelCost = calculateFuelCost(routeDistance + deadMileage, vehicleType);
  
  // Base fare components
  const baseFare = RATES.BASE_FARE[vehicleType];
  const distanceFare = Math.floor(routeDistance * RATES.DISTANCE_RATE[vehicleType]);
  const waitTimeFare = Math.floor(estimatedWaitTime * RATES.TIME_RATE[vehicleType]);
  
  // Calculate fare before surge with demand multiplier
  const totalBeforeIncentive = Math.floor(
    (baseFare + distanceFare + waitTimeFare) * demandMultiplier
  );
  
  // Split incentive: 75% goes into fare, 25% becomes points
  const fareIncentiveComponent = Math.floor(incentiveResult.total * 0.75);
  const pointsIncentiveComponent = Math.floor(incentiveResult.total * 0.25);
  
  // Points earned (10 Rs = 1 point)
  // Round up if > 0.5 points
  const pointsValue = pointsIncentiveComponent / 10;
  const pointsEarned = pointsValue >= 0.5 ? Math.ceil(pointsValue) : Math.floor(pointsValue);
  
  // Total fare includes the 75% of surge
  const totalFare = Math.floor(totalBeforeIncentive + fareIncentiveComponent);
  
  const platformFee = 0;
  
  // Calculate realistic profit: fare - platform fee - fuel cost
  const estimatedProfit = Math.floor(totalFare - platformFee - fuelCost);
  
  return {
    totalFare,
    breakdown: {
      baseFare,
      distanceFare,
      waitTimeFare,
      incentive: incentiveResult.total,
      incentiveBreakdown: {
        surgePrice: incentiveResult.breakdown.surgePrice
      },
      fareIncentiveComponent,
      pointsIncentiveComponent,
      pointsEarned,
      demandMultiplier,
      fuelCost,
      estimatedProfit
    }
  };
};

/**
 * Fare Calculation Utility
 * 
 * This module provides functions to calculate estimated fares and profits
 * for ride requests based on distance, duration, and demand.
 */

/**
 * Calculate the estimated fare for a ride
 * 
 * @param distance - Distance in kilometers
 * @param duration - Duration in minutes
 * @param demandMultiplier - Optional surge pricing multiplier based on demand (default: 1.0)
 * @returns The estimated fare in rupees
 */
export const calculateEstimatedFare = (
  distance: number,
  duration: number,
  demandMultiplier: number = 1.0
): number => {
  // Base fare calculation
  const baseFare = 30; // Base fare in rupees
  const perKmRate = 12; // Rate per kilometer in rupees
  const perMinuteRate = 1.5; // Rate per minute in rupees
  
  // Calculate components
  const distanceCharge = distance * perKmRate;
  const timeCharge = duration * perMinuteRate;
  
  // Total before surge
  const subtotal = baseFare + distanceCharge + timeCharge;
  
  // Apply demand multiplier (surge pricing)
  const surge = demandMultiplier > 1.0 ? subtotal * (demandMultiplier - 1.0) : 0;
  
  // Final fare with surge
  const totalFare = subtotal + surge;
  
  // Round to nearest rupee
  return Math.round(totalFare);
};

/**
 * Calculate the estimated driver profit for a ride
 * 
 * @param fare - The total fare in rupees
 * @param distance - Distance in kilometers (for calculating operational expenses)
 * @returns The estimated profit in rupees
 */
export const calculateDriverProfit = (
  fare: number,
  distance: number
): number => {
  // Platform fee (percentage taken by the platform)
  const platformFeePercentage = 0; 

  // Estimate operational expenses (fuel, maintenance, etc.)
  const operationalExpensePerKm = 5; // Rupees per km
  const operationalExpenses = distance * operationalExpensePerKm;
  
  // Calculate driver's earnings after platform fee
  const driverEarnings = fare * (1 - platformFeePercentage);
  
  // Final profit after operational expenses
  const profit = driverEarnings - operationalExpenses;
  
  // Return rounded profit (can be negative for very short or problematic rides)
  return Math.round(Math.max(0, profit));
};

/**
 * Calculate estimated surge multiplier based on demand score
 * 
 * @param demandScore - Demand score between 0 and 1
 * @returns Surge multiplier between 1.0 and 2.0
 */
export const getSurgeMultiplierFromDemand = (demandScore: number): number => {
  // Map demand score (0-1) to surge multiplier (1.0-2.0)
  // High demand (0.8-1.0) -> 1.8-2.0 surge
  // Medium demand (0.4-0.8) -> 1.3-1.8 surge
  // Low demand (0.0-0.4) -> 1.0-1.3 surge
  return 1.0 + (demandScore * 1.0);
};
