import React, { useState, useEffect } from 'react';
import { calculateDynamicFare } from './fareCalculation';
import { calculateDirectDistance } from './mapboxService';

// Enhanced driver interface with more details for matching
interface Driver {
  name: string;
  location: string;
  status: string;
  rating: number;
  vehicleType: 'auto' | 'car' | 'premium';
  experience: number; // in years
  coordinates: {
    latitude: number;
    longitude: number;
  };
  // Added new driver attributes for better classification
  preferredAreas?: string[];
  totalRides?: number;
  activeHours?: string[]; // e.g., ["morning", "evening"]
  languages?: string[];
}

interface Ride {
  pickup: string;
  dest: string;
  distance: number;
  demand: 'high' | 'medium' | 'low';
  supply: 'high' | 'medium' | 'low';
  coordinates: {
    pickup: {
      latitude: number;
      longitude: number;
    };
    dropoff: {
      latitude: number;
      longitude: number;
    };
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

// Enhanced notification interface with more details for the driver
interface Notification {
  ride_id: string;
  driver_id: string;
  pickup: string;
  destination: string;
  ride_type: string; // Classification type
  display_name: string; // User-friendly ride type name
  estimated_fare: number;
  estimated_profit: number; // Added for driver clarity
  compatibility_score: number; // Score indicating driver-ride match quality
  compatibility_reason: string; // Simple explanation of why this ride matches the driver
  incentives: {
    total: number;
    fare_component: number; // 75% of incentive included in fare
    points_component: number; // 25% of incentive as points
    points_earned: number; // Points earned from this ride
    breakdown: {
      surgePrice: number; // Only surge pricing is used now
    }
  };
  message: string;
  timestamp: Date;
  expiry?: Date; // When the notification expires
  classification_reason: string; // Reason for classification
  status: 'pending' | 'accepted' | 'rejected' | 'started' | 'completed';
}

// Enhanced ride types based on 9x9 Demand-Supply Matrix
export enum RideType {
  // High Demand scenarios
  HD_HS = "HD_HS", // High Demand, High Supply
  HD_MS = "HD_MS", // High Demand, Medium Supply
  HD_LS = "HD_LS", // High Demand, Low Supply
  
  // Medium Demand scenarios
  MD_HS = "MD_HS", // Medium Demand, High Supply
  MD_MS = "MD_MS", // Medium Demand, Medium Supply
  MD_LS = "MD_LS", // Medium Demand, Low Supply
  
  // Low Demand scenarios
  LD_HS = "LD_HS", // Low Demand, High Supply
  LD_MS = "LD_MS", // Low Demand, Medium Supply
  LD_LS = "LD_LS"  // Low Demand, Low Supply
}

// Map ride types to user-friendly display names - simplified
export const RideTypeDisplayNames: Record<RideType, string> = {
  [RideType.HD_HS]: "High Demand",
  [RideType.HD_MS]: "High Demand",
  [RideType.HD_LS]: "High Demand",
  [RideType.MD_HS]: "Regular Ride",
  [RideType.MD_MS]: "Regular Ride",
  [RideType.MD_LS]: "Regular Ride",
  [RideType.LD_HS]: "Regular Ride",
  [RideType.LD_MS]: "Regular Ride",
  [RideType.LD_LS]: "Regular Ride"
};

// Classification reasons for each ride type
export const RideTypeReasons: Record<RideType, string> = {
  [RideType.HD_HS]: "High demand area with many available drivers",
  [RideType.HD_MS]: "High demand area with limited drivers available",
  [RideType.HD_LS]: "Very high demand with few drivers - surge pricing applied",
  [RideType.MD_HS]: "Moderate demand with plenty of available drivers",
  [RideType.MD_MS]: "Balanced demand and supply conditions",
  [RideType.MD_LS]: "Moderate demand with limited driver availability",
  [RideType.LD_HS]: "Low demand area with many available drivers",
  [RideType.LD_MS]: "Low demand area with moderate driver availability",
  [RideType.LD_LS]: "Low demand and limited drivers - matching based on proximity"
};

// Mock data with improved location data for Mapbox integration
const mockDrivers: Record<string, Driver> = {
  "12345": { 
    name: "John Doe", 
    location: "Koramangala", 
    status: "Available",
    rating: 4.8,
    vehicleType: "car",
    experience: 3,
    coordinates: {
      latitude: 12.9352,
      longitude: 77.6245
    },
    preferredAreas: ["Koramangala", "Indiranagar"],
    totalRides: 560,
    activeHours: ["morning", "evening"],
    languages: ["English", "Hindi"]
  },
  "67890": {
    name: "Priya Singh",
    location: "Indiranagar",
    status: "Available",
    rating: 4.9,
    vehicleType: "premium",
    experience: 5,
    coordinates: {
      latitude: 12.9784,
      longitude: 77.6408
    },
    preferredAreas: ["Indiranagar", "MG Road"],
    totalRides: 1200,
    activeHours: ["afternoon", "evening", "night"],
    languages: ["English", "Hindi", "Kannada"]
  },
  "24680": {
    name: "Raj Kumar",
    location: "HSR Layout",
    status: "Available",
    rating: 4.6,
    vehicleType: "auto",
    experience: 2,
    coordinates: {
      latitude: 12.9116,
      longitude: 77.6741
    },
    preferredAreas: ["HSR Layout", "Koramangala"],
    totalRides: 320,
    activeHours: ["morning", "afternoon"],
    languages: ["Kannada", "Hindi"]
  }
};

const mockRides: Record<string, Ride> = {
  "5678": { 
    pickup: "Koramangala", 
    dest: "Whitefield", 
    distance: 15, 
    demand: "high", 
    supply: "low",
    coordinates: {
      pickup: {
        latitude: 12.9352,
        longitude: 77.6245
      },
      dropoff: {
        latitude: 12.9698,
        longitude: 77.7500
      }
    },
    timeOfDay: "morning"
  },
  "1234": { 
    pickup: "Indiranagar", 
    dest: "Electronic City", 
    distance: 20, 
    demand: "medium", 
    supply: "medium",
    coordinates: {
      pickup: {
        latitude: 12.9784,
        longitude: 77.6408
      },
      dropoff: {
        latitude: 12.8416,
        longitude: 77.6602
      }
    },
    timeOfDay: "evening"
  },
  "9876": { 
    pickup: "MG Road", 
    dest: "Airport", 
    distance: 35, 
    demand: "low", 
    supply: "high",
    coordinates: {
      pickup: {
        latitude: 12.9767,
        longitude: 77.5713
      },
      dropoff: {
        latitude: 13.1989,
        longitude: 77.7068
      }
    },
    timeOfDay: "night"
  }
};

// Define driver persona types that can match with ride types
export enum DriverPersonaType {
  LongHaulSpecialist = "Long Haul Specialist",
  UrbanNavigator = "Urban Navigator",
  LuxuryExpert = "Luxury Expert",
  NightRider = "Night Rider",
  NewbieDriver = "Newbie Driver"
}

// Map each ride type to compatible driver personas
export const RideTypePersonaMatch: Record<RideType, DriverPersonaType[]> = {
  [RideType.HD_HS]: [DriverPersonaType.LuxuryExpert, DriverPersonaType.UrbanNavigator],
  [RideType.HD_MS]: [DriverPersonaType.LuxuryExpert, DriverPersonaType.UrbanNavigator],
  [RideType.HD_LS]: [DriverPersonaType.LuxuryExpert],
  [RideType.MD_HS]: [DriverPersonaType.UrbanNavigator, DriverPersonaType.LongHaulSpecialist],
  [RideType.MD_MS]: [DriverPersonaType.UrbanNavigator, DriverPersonaType.LongHaulSpecialist, DriverPersonaType.NewbieDriver],
  [RideType.MD_LS]: [DriverPersonaType.UrbanNavigator, DriverPersonaType.LongHaulSpecialist],
  [RideType.LD_HS]: [DriverPersonaType.NewbieDriver, DriverPersonaType.NightRider],
  [RideType.LD_MS]: [DriverPersonaType.NewbieDriver, DriverPersonaType.NightRider],
  [RideType.LD_LS]: [DriverPersonaType.LongHaulSpecialist, DriverPersonaType.NightRider]
};

// Improved ride classification system based on the 9x9 Demand-Supply Matrix
const classifyRideType = (ride: Ride, driver: Driver): {type: RideType, reason: string, compatibilityScore: number} => {
  // Map demand and supply to the matrix
  let rideType: RideType;
  
  // Determine the ride type based on demand and supply levels
  if (ride.demand === "high") {
    if (ride.supply === "high") {
      rideType = RideType.HD_HS;
    } else if (ride.supply === "medium") {
      rideType = RideType.HD_MS;
    } else {
      rideType = RideType.HD_LS;
    }
  } else if (ride.demand === "medium") {
    if (ride.supply === "high") {
      rideType = RideType.MD_HS;
    } else if (ride.supply === "medium") {
      rideType = RideType.MD_MS;
    } else {
      rideType = RideType.MD_LS;
    }
  } else {
    if (ride.supply === "high") {
      rideType = RideType.LD_HS;
    } else if (ride.supply === "medium") {
      rideType = RideType.LD_MS;
    } else {
      rideType = RideType.LD_LS;
    }
  }
  
  // Special handling for MD_MS and LD_LS based on proximity
  if (rideType === RideType.MD_MS || rideType === RideType.LD_LS) {
    // In a real implementation, we would calculate actual proximity
    // For now, we'll use a simple direct distance calculation
    const driverToPickupDistance = calculateDirectDistance(
      driver.coordinates,
      ride.coordinates.pickup
    );
    
    // If driver is close (within 3km), prioritize this match
    if (driverToPickupDistance < 3) {
      // Enhance the reason
      const reason = RideTypeReasons[rideType] + " - You're very close to pickup point!";
      const { score } = calculateCompatibilityScore(driver, rideType, driverToPickupDistance);
      return {
        type: rideType, 
        reason, 
        compatibilityScore: score
      };
    }
  }
  
  const { score } = calculateCompatibilityScore(driver, rideType);
  return {
    type: rideType, 
    reason: RideTypeReasons[rideType],
    compatibilityScore: score
  };
};

// Update the calculateCompatibilityScore function to provide simple explanations
const calculateCompatibilityScore = (
  driver: Driver, 
  rideType: RideType, 
  proximityDistance: number = 5 // Default medium distance
): {score: number, reason: string} => {
  let score = 0;
  let reasonParts: string[] = [];
  
  // Base score from driver rating (0-20 points)
  score += Math.min(driver.rating * 4, 20);
  
  // Persona match (0-40 points)
  const driverPersona = driver.preferredAreas ? DriverPersonaType.LongHaulSpecialist : DriverPersonaType.NewbieDriver;
  const personaMatch = RideTypePersonaMatch[rideType].includes(driverPersona);
  if (personaMatch) {
    score += 40;
    reasonParts.push("This ride is perfect for your driving style");
  } else {
    score += 15; // Partial match
  }
  
  // Experience points (0-20 points)
  score += Math.min(driver.experience * 4, 20);
  if (driver.experience > 2) {
    reasonParts.push("Your experience makes you a good match");
  }
  
  // Proximity points (0-20 points)
  // Closer = higher score
  const proximityScore = Math.max(0, 20 - (proximityDistance * 4));
  score += proximityScore;
  
  if (proximityDistance < 3) {
    reasonParts.push("You are very close to pickup point");
  } else if (proximityDistance < 6) {
    reasonParts.push("Pickup point is not too far");
  }
  
  // Add ride type specific reasons
  if (rideType.startsWith('HD_')) {
    reasonParts.push("High demand means better earnings");
  } else if (rideType === RideType.LD_LS) {
    reasonParts.push("Not many drivers in this area");
  }
  
  // Create a simple explanation
  const reason = reasonParts.length > 0 
    ? reasonParts.join(". ") + "." 
    : "This ride matches your profile.";
  
  return {
    score: Math.min(Math.round(score), 100),
    reason
  };
};

/**
 * Process a ride request and generate classified notification
 */
const processRideRequest = async (rideId: string, driverId: string): Promise<Notification> => {
  console.log(`Processing ride request ${rideId} for driver ${driverId}`);
  
  // Find ride and driver from mock data
  const ride = mockRides[rideId];
  const driver = mockDrivers[driverId];
  
  if (!ride || !driver) {
    console.error("Ride or driver not found in mock data");
    throw new Error("Ride or driver not found");
  }
  
  // Classify the ride using the new 9x9 matrix model
  const classification = classifyRideType(ride, driver);
  console.log(`Ride classified as: ${classification.type} with compatibility score: ${classification.compatibilityScore}`);

  // Define Vajrahalli location (hardcoded current location for driver as mentioned)
  const vajrahalliLocation = {
    latitude: 12.9281,
    longitude: 77.4892
  };
  
  // Calculate fare based on ride details and actual locations using Mapbox
  const driverLocation = vajrahalliLocation; // Using the hardcoded location
  const pickupLocation = ride.coordinates.pickup;
  const dropoffLocation = ride.coordinates.dropoff;
  
  // Convert demand/supply to numerical values for fare calculation
  const demandLevel = ride.demand === 'high' ? 0.9 : ride.demand === 'medium' ? 0.6 : 0.3;
  const supplyLevel = ride.supply === 'high' ? 0.9 : ride.supply === 'medium' ? 0.6 : 0.3;
  
  console.log(`Calculating fare with demand level: ${demandLevel}, supply level: ${supplyLevel}`);
  
  // Calculate fare
  const fareDetails = await calculateDynamicFare(
    {
      pickupLocation,
      dropoffLocation,
      driverLocation,
      vehicleType: driver.vehicleType,
      estimatedWaitTime: 5 // Assume 5 minutes wait time
    },
    demandLevel,
    supplyLevel,
    classification.type as string
  );
  
  console.log(`Fare calculation completed: ₹${fareDetails.totalFare}`);
  console.log(`Breakdown:`, fareDetails.breakdown);
  
  // Get the compatibility explanation
  const { score: compatibilityScore, reason: compatibilityReason } = 
    calculateCompatibilityScore(driver, classification.type as RideType, 
    calculateDirectDistance(vajrahalliLocation, pickupLocation));
  
  // Get the timestamp now
  const timestamp = new Date();
  
  // Set expiry to 30 seconds from now
  const expiry = new Date(timestamp.getTime() + 30000);
  
  // Create the notification with compatibility score and new incentive structure
  const notification: Notification = {
    ride_id: rideId,
    driver_id: driverId,
    pickup: ride.pickup,
    destination: ride.dest,
    ride_type: classification.type as string,
    display_name: RideTypeDisplayNames[classification.type as RideType],
    estimated_fare: fareDetails.totalFare,
    estimated_profit: fareDetails.breakdown.estimatedProfit,
    compatibility_score: compatibilityScore,
    compatibility_reason: compatibilityReason,
    incentives: {
      total: fareDetails.breakdown.incentive,
      fare_component: fareDetails.breakdown.fareIncentiveComponent,
      points_component: fareDetails.breakdown.pointsIncentiveComponent,
      points_earned: fareDetails.breakdown.pointsEarned,
      breakdown: {
        surgePrice: fareDetails.breakdown.incentiveBreakdown.surgePrice
      }
    },
    message: `New ride request from ${ride.pickup} to ${ride.dest}`,
    timestamp,
    expiry,
    classification_reason: classification.reason,
    status: 'pending'
  };
  
  console.log("Generated notification:", notification);
  
  return notification;
};

// Classification component for display
const Classification: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const notification = await processRideRequest("1234", "67890");
        setNotifications([notification]);
      } catch (error) {
        console.error("Error processing ride request:", error);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Ride Classification</h2>
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div key={notification.ride_id} className="border p-4 rounded shadow-sm">
              <h3 className="font-semibold">{notification.display_name}</h3>
              <p className="text-sm text-gray-600">{notification.classification_reason}</p>
              <div className="mt-2">
                <div><span className="font-medium">Pickup:</span> {notification.pickup}</div>
                <div><span className="font-medium">Destination:</span> {notification.destination}</div>
                <div><span className="font-medium">Fare:</span> ₹{notification.estimated_fare}</div>
                <div><span className="font-medium">Profit:</span> ₹{notification.estimated_profit}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading classification data...</p>
      )}
    </div>
  );
};

export { processRideRequest, Classification };
