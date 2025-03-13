import { calculateDirectDistance, calculateDrivingDistance, calculateDeadMileage } from './mapboxService';

interface Location {
  latitude: number;
  longitude: number;
}

interface RideDetails {
  pickupLocation: Location;
  dropoffLocation: Location;
  driverLocation: Location;
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
  auto: 35, // Auto-rickshaws have better mileage
  car: 15,  // Standard cars
  premium: 10 // Premium vehicles (SUVs, luxury sedans)
};

// Fuel price per liter (in currency units)
const FUEL_PRICE = 100; // ₹100 per liter

// Dead mileage compensation factors
// These values determine how much of the dead mileage is compensated
const DEAD_MILEAGE_COMPENSATION = {
  auto: 0.6,  // Compensate 60% of dead mileage for autos
  car: 0.7,   // Compensate 70% for cars
  premium: 0.8 // Compensate 80% for premium vehicles
};

// Grid size for location-based demand analysis (in degrees)
const GRID_SIZE = 0.01;

// Helper function to map location to grid cell ID
const getGridCellId = (location: Location): string => {
  const latCell = Math.floor(location.latitude / GRID_SIZE);
  const lonCell = Math.floor(location.longitude / GRID_SIZE);
  console.log('Grid cell calculation:', { latCell, lonCell });
  return `${latCell},${lonCell}`;
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (point1: Location, point2: Location): number => {
  console.log('Calculating distance between points:', { point1, point2 });
  
  const R = 6371; // Earth's radius in km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  console.log('Latitude/longitude differences (radians):', { dLat, dLon });
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  console.log('Haversine formula intermediate value a:', a);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  console.log('Haversine formula intermediate value c:', c);
  
  const distance = R * c;
  console.log('Final calculated distance (km):', distance);
  return distance;
};

/**
 * Use Mapbox API to get accurate travel distance
 * 
 * @param origin - Starting location
 * @param destination - Ending location
 * @returns Promise resolving to the distance in kilometers
 */
export const getMapboxDistance = async (origin: Location, destination: Location): Promise<number> => {
  console.log('Getting Mapbox distance between:', {
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`
  });

  try {
    // Use the calculateDrivingDistance function from mapboxService
    const distance = await calculateDrivingDistance(origin, destination);
    console.log('Mapbox API returned distance (km):', distance);
    
    // Apply a small multiplier to account for real-world conditions
    const adjustedDistance = distance * 1.2;
    console.log('Adjusted distance with 1.2 multiplier (km):', adjustedDistance);
    
    return adjustedDistance;
  } catch (error) {
    console.error('Error calculating Mapbox distance:', error);
    
    // Fallback to direct distance calculation with a 1.2 multiplier for real-world routes
    const directDistance = calculateDirectDistance(origin, destination);
    const fallbackDistance = directDistance * 1.2;
    console.log('Using fallback direct distance calculation (km):', fallbackDistance);
    
    return fallbackDistance;
  }
};

/**
 * Calculate driver incentive based on various factors
 * 
 * @param rideDetails - Details about the ride
 * @param distance - Distance of the ride in kilometers
 * @param deadMileage - Distance to pickup in kilometers
 * @param demandLevel - Current demand level (0-1)
 * @returns Driver incentive amount and breakdown
 */
const calculateDriverIncentive = (
  rideDetails: RideDetails,
  distance: number,
  deadMileage: number,
  demandLevel: number
): { total: number, breakdown: { longDistance: number, deadMileage: number, highDemand: number } } => {
  console.log('Calculating driver incentives for:', {
    vehicleType: rideDetails.vehicleType,
    distance,
    deadMileage,
    demandLevel
  });

  const { vehicleType } = rideDetails;
  
  // Initialize incentive components
  let longDistanceIncentive = 0;
  let deadMileageIncentive = 0;
  let highDemandIncentive = 0;
  
  // Long distance incentive - rewards drivers who take longer trips
  if (distance > 10) {
    longDistanceIncentive = Math.min(distance - 10, 30) * 3; // Up to 30km extra at ₹3 per km
    console.log('Long distance incentive:', longDistanceIncentive);
  }
  
  // Dead mileage incentive - compensates drivers who travel far to pick up
  const deadMileageCompensation = deadMileage * DEAD_MILEAGE_COMPENSATION[vehicleType];
  deadMileageIncentive = Math.round(deadMileageCompensation * RATES.DISTANCE_RATE[vehicleType] * 0.5);
  console.log('Dead mileage incentive:', deadMileageIncentive);
  
  // High demand incentive
  if (demandLevel > 0.7) {
    highDemandIncentive = Math.round(distance * 2); // ₹2 per km during high demand
    console.log('High demand incentive:', highDemandIncentive);
  }
  
  // Calculate total incentive
  const totalIncentive = Math.round(longDistanceIncentive + deadMileageIncentive + highDemandIncentive);
  console.log('Total driver incentive:', totalIncentive);
  
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
const getDemandSupplyMultiplier = (
  demandLevel: number, 
  supplyLevel: number
): number => {
  console.log('Calculating demand-supply multiplier for:', { demandLevel, supplyLevel });
  
  let multiplier = 1.0;
  
  if (demandLevel > 0.7 && supplyLevel < 0.3) multiplier = 1.5; // High demand, low supply
  else if (demandLevel > 0.7 && supplyLevel >= 0.3) multiplier = 1.2; // High demand, adequate supply
  else if (demandLevel > 0.5 && supplyLevel < 0.5) multiplier = 1.1; // Medium demand, low supply
  else if (demandLevel < 0.3 && supplyLevel < 0.3) multiplier = 0.9; // Low demand, low supply
  else if (demandLevel < 0.3 && supplyLevel > 0.7) multiplier = 0.8; // Low demand, high supply
  
  console.log('Final demand-supply multiplier:', multiplier);
  return multiplier;
};

/**
 * Calculate fuel cost based on distance and vehicle mileage
 */
const calculateFuelCost = (distance: number, vehicleType: 'auto' | 'car' | 'premium'): number => {
  console.log('Calculating fuel cost for:', { distance, vehicleType });
  
  const fuelConsumed = distance / VEHICLE_MILEAGE[vehicleType];
  console.log('Estimated fuel consumed (liters):', fuelConsumed.toFixed(2));
  
  const cost = fuelConsumed * FUEL_PRICE;
  console.log('Total fuel cost (₹):', cost.toFixed(2));
  
  return Math.round(cost);
};

/**
 * Calculate the dynamic fare for a ride asynchronously
 * 
 * @param rideDetails - Details about the ride including locations and vehicle type
 * @param demandLevel - The demand level (0-1) where 1 is highest demand
 * @param supplyLevel - The supply level (0-1) where 1 is highest supply
 * @returns Promise resolving to fare details including total and breakdown
 */
export const calculateDynamicFare = async (
  rideDetails: RideDetails,
  demandLevel: number = 0.5,
  supplyLevel: number = 0.5
): Promise<FareResult> => {
  console.log('Starting dynamic fare calculation:', { 
    pickupLocation: rideDetails.pickupLocation,
    dropoffLocation: rideDetails.dropoffLocation,
    vehicleType: rideDetails.vehicleType,
    demandLevel,
    supplyLevel
  });

  const { vehicleType, estimatedWaitTime } = rideDetails;
  
  // Step 1: Calculate route distance using the Mapbox API
  console.log('Step 1: Calculating route distance using Mapbox API');
  const routeDistance = await getMapboxDistance(
    rideDetails.pickupLocation,
    rideDetails.dropoffLocation
  );
  console.log('Route distance (km):', routeDistance);
  
  // Step 2: Calculate dead mileage - the distance driver travels to pickup
  console.log('Step 2: Calculating dead mileage');
  const deadMileage = await calculateDeadMileage(
    rideDetails.driverLocation,
    rideDetails.pickupLocation
  );
  console.log('Dead mileage (km):', deadMileage);
  
  // Step 3: Calculate demand-supply multiplier
  console.log('Step 3: Calculating demand-supply multiplier');
  const demandMultiplier = getDemandSupplyMultiplier(demandLevel, supplyLevel);
  
  // Step 4: Calculate driver incentive
  console.log('Step 4: Calculating driver incentives');
  const incentiveResult = calculateDriverIncentive(
    rideDetails,
    routeDistance,
    deadMileage,
    demandLevel
  );
  
  // Step 5: Calculate fuel cost
  console.log('Step 5: Calculating fuel cost');
  const fuelCost = calculateFuelCost(routeDistance + deadMileage * 0.5, vehicleType);
  
  // Step 6: Calculate fare components
  console.log('Step 6: Calculating fare components');
  const baseFare = RATES.BASE_FARE[vehicleType];
  console.log('Base fare (₹):', baseFare);
  
  const distanceFare = Math.round(routeDistance * RATES.DISTANCE_RATE[vehicleType]);
  console.log('Distance fare (₹):', distanceFare);
  
  const waitTimeFare = Math.round(estimatedWaitTime * RATES.TIME_RATE[vehicleType]);
  console.log('Wait time fare (₹):', waitTimeFare);
  
  // Step 7: Calculate total fare
  console.log('Step 7: Calculating final fare');
  const totalBeforeIncentive = Math.round(
    (baseFare + distanceFare + waitTimeFare) * demandMultiplier
  );
  console.log('Total fare before incentives (₹):', totalBeforeIncentive);
  
  const totalFare = totalBeforeIncentive + incentiveResult.total;
  console.log('Total fare with incentives (₹):', totalFare);
  
  // Step 8: Calculate estimated profit for driver
  console.log('Step 8: Calculating driver profit');
  const platformFee = Math.round(totalFare * 0.20); // Platform fee of 20%
  console.log('Platform fee (₹):', platformFee);
  
  const estimatedProfit = Math.round(
    totalFare - fuelCost - platformFee
  );
  console.log('Estimated driver profit (₹):', estimatedProfit);
  
  console.log('Fare calculation completed');
  
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
 * Calculate fare for in-app display
 * 
 * @param rideDetails - Details about the ride
 * @param demandLevel - Current demand level (0-1)
 * @param supplyLevel - Current supply level (0-1)
 * @returns Promise resolving to fare display information
 */
export const calculateFareForDisplay = async (
  rideDetails: RideDetails,
  demandLevel: number = 0.5,
  supplyLevel: number = 0.5
): Promise<{
  fare: number;
  currency: string;
  estimated: boolean;
  breakdown?: FareBreakdown;
}> => {
  console.log('Calculating fare for display');
  
  const fareResult = await calculateDynamicFare(rideDetails, demandLevel, supplyLevel);
  
  return {
    fare: fareResult.totalFare,
    currency: "₹", // Indian Rupee symbol
    estimated: true, // Indicate this is an estimate
    breakdown: fareResult.breakdown
  };
};
