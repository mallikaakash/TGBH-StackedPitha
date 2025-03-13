import React, { useState, useEffect } from 'react';
import { calculateDynamicFare } from './fareCalculation';

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
  estimated_fare: number;
  estimated_profit: number; // Added for driver clarity
  incentives: {
    total: number;
    breakdown: {
      longDistance?: number;
      deadMileage?: number;
      highDemand?: number;
    }
  };
  message: string;
  timestamp: Date;
  expiry?: Date; // When the notification expires
  classification_reason: string; // Reason for classification
  status: 'pending' | 'accepted' | 'rejected' | 'started' | 'completed';
}

// Enhanced ride types (more descriptive than simple "Premium", "Express", etc.)
export enum RideType {
  HighDemand = "HighDemand", // High demand, low supply - highest fares
  LongDistance = "LongDistance", // Trips over certain distance thresholds
  NightRide = "NightRide", // Rides during late hours
  EconomySaver = "EconomySaver", // Low demand periods
  DriverMatch = "DriverMatch" // Rides matched to driver expertise/ratings
}

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

// Improved ride classification system with more meaningful classifications
const classifyRideType = (ride: Ride, driver: Driver): {type: RideType, reason: string} => {
  // High demand, low supply scenario - highest priority
  if (ride.demand === "high" && ride.supply === "low") {
    return {
      type: RideType.HighDemand,
      reason: "High demand and low driver supply in this area"
    };
  }
  
  // Long distance rides (over 20km)
  if (ride.distance > 20) {
    return {
      type: RideType.LongDistance,
      reason: `Long distance ride (${ride.distance}km)`
    };
  }
  
  // Night rides (safety, higher rates)
  if (ride.timeOfDay === "night") {
    return {
      type: RideType.NightRide,
      reason: "Night ride - higher fare and safety protocols"
    };
  }
  
  // Driver expertise match
  if (
    driver.rating > 4.7 || 
    driver.experience > 3 ||
    (driver.preferredAreas && driver.preferredAreas.includes(ride.pickup))
  ) {
    return {
      type: RideType.DriverMatch,
      reason: `Matched to your high rating (${driver.rating}/5) and experience (${driver.experience} years)`
    };
  }
  
  // Economy saver - low demand periods
  if (ride.demand === "low") {
    return {
      type: RideType.EconomySaver,
      reason: "Lower demand period - economical fare for customers"
    };
  }
  
  // Default fallback
  return {
    type: RideType.EconomySaver,
    reason: "Standard ride"
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
  
  // Classify the ride
  const classification = classifyRideType(ride, driver);
  console.log(`Ride classified as: ${classification.type}`);
  
  // Calculate fare based on ride details
  const driverLocation = driver.coordinates;
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
    supplyLevel
  );
  
  console.log(`Fare calculation completed: ₹${fareDetails.totalFare}`);
  console.log(`Breakdown:`, fareDetails.breakdown);
  
  // Get the timestamp now
  const timestamp = new Date();
  
  // Set expiry to 30 seconds from now
  const expiry = new Date(timestamp.getTime() + 30000);
  
  // Create the notification
  const notification: Notification = {
    ride_id: rideId,
    driver_id: driverId,
    pickup: ride.pickup,
    destination: ride.dest,
    ride_type: classification.type as string,
    estimated_fare: fareDetails.totalFare,
    estimated_profit: fareDetails.breakdown.estimatedProfit,
    incentives: {
      total: fareDetails.breakdown.incentive,
      breakdown: {
        longDistance: fareDetails.breakdown.incentiveBreakdown.longDistance,
        deadMileage: fareDetails.breakdown.incentiveBreakdown.deadMileage,
        highDemand: fareDetails.breakdown.incentiveBreakdown.highDemand
      }
    },
    message: `New ${classification.type} ride request from ${ride.pickup} to ${ride.dest}`,
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
              <h3 className="font-semibold">{notification.ride_type}</h3>
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
