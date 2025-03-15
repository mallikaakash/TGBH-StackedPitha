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
  incentiveBreakdown: {
    longDistance: number;
    deadMileage: number;
    highDemand: number;
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
    return directDistance * 1.05;
  }
};

/**
 * Calculate driver incentive based on various factors
 */
const calculateDriverIncentive = (
  rideDetails: RideDetails,
  distance: number,
  deadMileage: number,
  demandLevel: number
): { total: number, breakdown: { longDistance: number, deadMileage: number, highDemand: number } } => {
  const { vehicleType } = rideDetails;
  
  let longDistanceIncentive = 0;
  let deadMileageIncentive = 0;
  let highDemandIncentive = 0;
  
  if (distance > 10) {
    longDistanceIncentive = Math.min(distance - 10, 30) * 3;
  }
  
  const deadMileageCompensation = deadMileage * DEAD_MILEAGE_COMPENSATION[vehicleType];
  deadMileageIncentive = Math.round(deadMileageCompensation * RATES.DISTANCE_RATE[vehicleType] * 0.5);
  
  if (demandLevel > 0.7) {
    highDemandIncentive = Math.round(distance * 2);
  }
  
  const totalIncentive = Math.round(longDistanceIncentive + deadMileageIncentive + highDemandIncentive);
  
  return {
    total: totalIncentive,
    breakdown: {
      longDistance: longDistanceIncentive,
      deadMileage: deadMileageIncentive,
      highDemand: highDemandIncentive
    }
  };
};

/**
 * Determine demand-supply multiplier based on current market conditions
 */
const getDemandSupplyMultiplier = (demandLevel: number, supplyLevel: number): number => {
  if (demandLevel > 0.7 && supplyLevel < 0.3) return 1.5;
  if (demandLevel > 0.7 && supplyLevel >= 0.3) return 1.2;
  if (demandLevel > 0.5 && supplyLevel < 0.5) return 1.1;
  if (demandLevel < 0.3 && supplyLevel < 0.3) return 0.9;
  if (demandLevel < 0.3 && supplyLevel > 0.7) return 0.8;
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
  supplyLevel: number = 0.5
): Promise<FareResult> => {
  const { vehicleType, estimatedWaitTime } = rideDetails;
  
  const routeDistance = await getMapboxDistance(
    rideDetails.pickupLocation,
    rideDetails.dropoffLocation
  );
  
  const deadMileage = await calculateDeadMileage(
    rideDetails.driverLocation,
    rideDetails.pickupLocation
  );
  
  const demandMultiplier = getDemandSupplyMultiplier(demandLevel, supplyLevel);
  
  const incentiveResult = calculateDriverIncentive(
    rideDetails,
    routeDistance,
    deadMileage,
    demandLevel
  );
  
  const fuelCost = calculateFuelCost(routeDistance + deadMileage * 0.5, vehicleType);
  
  const baseFare = RATES.BASE_FARE[vehicleType];
  const distanceFare = Math.round(routeDistance * RATES.DISTANCE_RATE[vehicleType]);
  const waitTimeFare = Math.round(estimatedWaitTime * RATES.TIME_RATE[vehicleType]);
  
  const totalBeforeIncentive = Math.round(
    (baseFare + distanceFare + waitTimeFare) * demandMultiplier
  );
  
  const totalFare = totalBeforeIncentive + incentiveResult.total;
  
  const platformFee = Math.round(totalFare * 0.20);
  const estimatedProfit = Math.round(totalFare - fuelCost - platformFee);
  
  return {
    totalFare,
    breakdown: {
      baseFare,
      distanceFare,
      waitTimeFare,
      incentive: incentiveResult.total,
      incentiveBreakdown: incentiveResult.breakdown,
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
  const platformFeePercentage = 0.20; // 20% platform fee
  
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
