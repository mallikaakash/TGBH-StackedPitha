import { calculateDirectDistance, calculateDeadMileage } from './mapboxService';

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

// Use Mapbox API to get accurate travel distance
// Now calls the mapboxService implementation
const getMapboxDistance = async (origin: Location, destination: Location): Promise<number> => {
  console.log('Getting Mapbox distance for:', { origin, destination });
  
  try {
    const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    const origin="77.623276,12.933456";
    const destination="77.64106,12.972655";
    
    console.log('Using coordinates:', { origin, destination });
    
    // Construct the Mapbox Directions API URL
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?access_token=${MAPBOX_TOKEN}`;
    console.log('Mapbox API URL:', url);

    const response = await fetch(url);
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Mapbox API response data:', data);

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    // Mapbox returns distance in meters, convert to kilometers
    const distanceInKm = data.routes[0].distance / 1000;
    console.log("Final Mapbox distance (km):", distanceInKm);
    return distanceInKm;

  } catch (error) {
    console.error('Error calculating Mapbox distance:', error);
    // Fallback to Haversine distance calculation with 20% buffer
    const fallbackDistance = calculateDistance(origin, destination) * 1.2;
    console.log('Using fallback distance calculation:', fallbackDistance);
    return fallbackDistance;
  }
};

// Calculate driver incentive based on various factors
const calculateDriverIncentive = (
  rideDetails: RideDetails,
  distance: number,
  deadMileage: number,
  demandLevel: number
): number => {
  console.log('Calculating driver incentive:', { rideDetails, distance, deadMileage, demandLevel });
  
  const { vehicleType } = rideDetails;
  let incentive = 0;
  
  // Long distance incentive
  if (distance > 10) {
    const longDistanceBonus = Math.min(distance - 10, 30) * 3;
    console.log('Long distance bonus:', longDistanceBonus);
    incentive += longDistanceBonus;
  }
  
  // Dead mileage incentive
  const deadMileageCompensation = deadMileage * DEAD_MILEAGE_COMPENSATION[vehicleType];
  const deadMileageBonus = deadMileageCompensation * RATES.DISTANCE_RATE[vehicleType] * 0.5;
  console.log('Dead mileage bonus:', deadMileageBonus);
  incentive += deadMileageBonus;
  
  // High demand incentive
  if (demandLevel > 0.7) {
    const demandBonus = distance * 2;
    console.log('High demand bonus:', demandBonus);
    incentive += demandBonus;
  }
  
  const efficiencyBonus = 10;
  console.log('Efficiency bonus:', efficiencyBonus);
  
  const totalIncentive = Math.round(incentive + efficiencyBonus);
  console.log('Total driver incentive:', totalIncentive);
  return totalIncentive;
};

// Determine demand-supply multiplier
const getDemandSupplyMultiplier = (
  demandLevel: number, 
  supplyLevel: number
): number => {
  console.log('Calculating demand-supply multiplier:', { demandLevel, supplyLevel });
  
  let multiplier = 1.0;
  if (demandLevel > 0.7 && supplyLevel < 0.3) multiplier = 1.5;
  else if (demandLevel > 0.7 && supplyLevel >= 0.3) multiplier = 1.2;
  else if (demandLevel > 0.5 && supplyLevel < 0.5) multiplier = 1.1;
  else if (demandLevel < 0.3 && supplyLevel < 0.3) multiplier = 0.9;
  else if (demandLevel < 0.3 && supplyLevel > 0.7) multiplier = 0.8;
  
  console.log('Final demand-supply multiplier:', multiplier);
  return multiplier;
};

// Calculate fuel cost based on distance and vehicle mileage
const calculateFuelCost = (distance: number, vehicleType: 'auto' | 'car' | 'premium'): number => {
  console.log('Calculating fuel cost:', { distance, vehicleType });
  
  const fuelConsumed = distance / VEHICLE_MILEAGE[vehicleType];
  console.log('Fuel consumed (liters):', fuelConsumed);
  
  const cost = fuelConsumed * FUEL_PRICE;
  console.log('Total fuel cost:', cost);
  return cost;
};

/**
 * Calculate the dynamic fare for a ride
 */
export const calculateDynamicFare = (
  rideDetails: RideDetails,
  demandLevel: number = 0.5,
  supplyLevel: number = 0.5
): {
  totalFare: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    waitTimeFare: number;
    incentive: number;
    demandMultiplier: number;
    fuelCost: number;
    estimatedProfit: number;
  };
} => {
  console.log('Calculating dynamic fare:', { rideDetails, demandLevel, supplyLevel });
  
  const { vehicleType, estimatedWaitTime } = rideDetails;
  
  const routeDistance = calculateDistance(
    rideDetails.pickupLocation,
    rideDetails.dropoffLocation
  ) * 1.2;
  console.log('Route distance (with 20% buffer):', routeDistance);
  
  const deadMileage = calculateDistance(
    rideDetails.driverLocation,
    rideDetails.pickupLocation
  );
  console.log('Dead mileage:', deadMileage);
  
  const demandMultiplier = getDemandSupplyMultiplier(demandLevel, supplyLevel);
  const incentive = calculateDriverIncentive(
    rideDetails,
    routeDistance,
    deadMileage,
    demandLevel
  );
  
  const fuelCost = calculateFuelCost(routeDistance + deadMileage * 0.5, vehicleType);
  
  const baseFare = RATES.BASE_FARE[vehicleType];
  console.log('Base fare:', baseFare);
  
  const distanceFare = routeDistance * RATES.DISTANCE_RATE[vehicleType];
  console.log('Distance fare:', distanceFare);
  
  const waitTimeFare = estimatedWaitTime * RATES.TIME_RATE[vehicleType];
  console.log('Wait time fare:', waitTimeFare);
  
  const totalBeforeIncentive = Math.round(
    (baseFare + distanceFare + waitTimeFare) * demandMultiplier
  );
  console.log('Total fare before incentive:', totalBeforeIncentive);
  
  const totalFare = totalBeforeIncentive + incentive;
  console.log('Total fare with incentive:', totalFare);
  
  const estimatedProfit = Math.round(
    totalFare - fuelCost - (totalFare * 0.20)
  );
  console.log('Estimated driver profit:', estimatedProfit);
  
  return {
    totalFare,
    breakdown: {
      baseFare,
      distanceFare,
      waitTimeFare,
      incentive,
      demandMultiplier,
      fuelCost,
      estimatedProfit
    }
  };
};

// Function to calculate fare for in-app display
export const calculateFareForDisplay = (
  rideDetails: RideDetails,
  demandLevel: number = 0.5,
  supplyLevel: number = 0.5
): {
  fare: number;
  currency: string;
  estimated: boolean;
} => {
  console.log('Calculating fare for display:', { rideDetails, demandLevel, supplyLevel });
  
  const fareResult = calculateDynamicFare(rideDetails, demandLevel, supplyLevel);
  console.log('Fare calculation result:', fareResult);
  
  const displayResult = {
    fare: fareResult.totalFare,
    currency: "₹",
    estimated: true
  };
  console.log('Final display result:', displayResult);
  
  return displayResult;
};
