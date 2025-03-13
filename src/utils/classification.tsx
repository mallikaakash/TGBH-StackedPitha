import React, { useState, useEffect } from 'react';
import { calculateDynamicFare } from './fareCalculation';

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

interface Notification {
  ride_id: string;
  driver_id: string;
  pickup: string;
  destination: string;
  ride_type: string;
  estimated_fare: number;
  message: string;
  timestamp: Date;
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
    }
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
    }
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
    }
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

// Improved ride classification system
const classifyRideType = (ride: Ride, driver: Driver): string => {
  // Premium rides based on demand-supply dynamics
  if (ride.demand === "high" && ride.supply === "low") {
    // Only experienced drivers with good ratings get premium rides
    if (driver.rating >= 4.7 && driver.experience >= 2) {
      return "Premium";
    }
    return "Express";
  }
  
  // Express rides for medium demand conditions
  if (ride.demand === "medium") {
    // Night rides are automatically Express for safety
    if (ride.timeOfDay === "night") {
      return "Express";
    }
    return "Standard";
  }
  
  // Economy rides for low demand and high supply
  if (ride.demand === "low" && ride.supply === "high") {
    return "Economy";
  }
  
  // Default case
  return "Standard";
};

// Improved fare calculation with more factors
const calculateFare = (ride: Ride, driver: Driver, rideType: string): number => {
  // Convert to format needed by fareCalculation.ts
  const rideDetails = {
    pickupLocation: ride.coordinates.pickup,
    dropoffLocation: ride.coordinates.dropoff,
    driverLocation: driver.coordinates,
    vehicleType: driver.vehicleType,
    estimatedWaitTime: 5 // Default wait time in minutes
  };

  // Determine demand and supply levels as numerical values
  const demandLevel = ride.demand === "high" ? 0.8 : 
                     ride.demand === "medium" ? 0.5 : 0.2;
  
  const supplyLevel = ride.supply === "high" ? 0.8 : 
                     ride.supply === "medium" ? 0.5 : 0.2;
  
  // Calculate fare using the dynamic fare calculation
  const fareResult = calculateDynamicFare(rideDetails, demandLevel, supplyLevel);
  
  // Apply additional multipliers based on ride type
  let additionalMultiplier = 1.0;
  
  if (rideType === "Premium") additionalMultiplier = 1.3;
  else if (rideType === "Express") additionalMultiplier = 1.15;
  else if (rideType === "Economy") additionalMultiplier = 0.85;
  
  // Apply time of day factor
  if (ride.timeOfDay === "night") additionalMultiplier *= 1.2; // Night surcharge
  else if (ride.timeOfDay === "morning" || ride.timeOfDay === "evening") additionalMultiplier *= 1.1; // Rush hour
  
  // Return the final fare with all multipliers applied
  return Math.round(fareResult.totalFare * additionalMultiplier);
};

const Classification: React.FC = () => {
  const [rideId, setRideId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [error, setError] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Simulate live notifications
  useEffect(() => {
    // First simulated notification after 5 seconds
    const firstTimer = setTimeout(() => {
      const ride = mockRides["5678"];
      const driver = mockDrivers["12345"];
      const rideType = classifyRideType(ride, driver);
      const fare = calculateFare(ride, driver, rideType);
      
      const newNotification: Notification = {
        ride_id: "5678",
        driver_id: "12345",
        pickup: ride.pickup,
        destination: ride.dest,
        ride_type: rideType,
        estimated_fare: fare,
        message: `New Ride Request: ${rideType} ride from ${ride.pickup} to ${ride.dest}`,
        timestamp: new Date()
      };
      
      setNotifications(prev => [...prev, newNotification]);
    }, 5000);
    
    // Second simulated notification after 10 seconds
    const secondTimer = setTimeout(() => {
      const ride = mockRides["9876"];
      const driver = mockDrivers["67890"];
      const rideType = classifyRideType(ride, driver);
      const fare = calculateFare(ride, driver, rideType);
      
      const newNotification: Notification = {
        ride_id: "9876",
        driver_id: "67890",
        pickup: ride.pickup,
        destination: ride.dest,
        ride_type: rideType,
        estimated_fare: fare,
        message: `New Ride Request: ${rideType} ride from ${ride.pickup} to ${ride.dest}`,
        timestamp: new Date()
      };
      
      setNotifications(prev => [...prev, newNotification]);
    }, 10000);
    
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, []);

  const handleClassifyRide = () => {
    if (!rideId || !driverId) {
      setError("Please enter both Ride ID and Driver ID");
      return;
    }

    if (!mockRides[rideId] || !mockDrivers[driverId]) {
      setError("Invalid ride or driver ID");
      return;
    }

    const ride = mockRides[rideId];
    const driver = mockDrivers[driverId];
    const rideType = classifyRideType(ride, driver);
    const fare = calculateFare(ride, driver, rideType);

    const newNotification: Notification = {
      ride_id: rideId,
      driver_id: driverId,
      pickup: ride.pickup,
      destination: ride.dest,
      ride_type: rideType,
      estimated_fare: fare,
      message: `New Ride: ${rideType}, $${fare}`,
      timestamp: new Date()
    };

    setNotification(newNotification);
    setNotifications(prev => [...prev, newNotification]);
    setError('');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ride Classification System</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">Ride ID:</label>
          <input
            type="text"
            value={rideId}
            onChange={(e) => setRideId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter Ride ID (try 5678, 1234, or 9876)"
          />
        </div>

        <div>
          <label className="block mb-2">Driver ID:</label>
          <input
            type="text"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter Driver ID (try 12345, 67890, or 24680)"
          />
        </div>

        <button
          onClick={handleClassifyRide}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Classify Ride
        </button>

        {error && (
          <div className="text-red-500 mt-2">{error}</div>
        )}

        {notification && (
          <div className="mt-6 p-6 border border-gray-200 rounded-lg shadow-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Ride Details</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                notification.ride_type === "Premium" 
                  ? "bg-yellow-100 text-yellow-800" 
                  : notification.ride_type === "Express"
                    ? "bg-blue-100 text-blue-800"
                    : notification.ride_type === "Economy"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
              }`}>
                {notification.ride_type}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium">{notification.pickup}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium">{notification.destination}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Fare</p>
                    <p className="font-medium text-lg text-green-600">${notification.estimated_fare}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Ride ID</p>
                    <p className="font-medium">{notification.ride_id}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 font-medium">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
        
        {/* Display all notifications */}
        {notifications.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Recent Notifications</h3>
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-3">
                      <div className={`rounded-full p-2 flex-shrink-0 ${
                        notif.ride_type === "Premium" 
                          ? "bg-yellow-100" 
                          : notif.ride_type === "Express"
                            ? "bg-blue-100"
                            : notif.ride_type === "Economy"
                              ? "bg-green-100"
                              : "bg-gray-100"
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{notif.ride_type} Ride</p>
                        <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                        <div className="flex mt-2 space-x-4 text-xs text-slate-500">
                          <span>From: {notif.pickup}</span>
                          <span>To: {notif.destination}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-green-600 font-medium">${notif.estimated_fare}</span>
                      <p className="text-xs text-slate-500 mt-1">
                        {notif.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classification;
