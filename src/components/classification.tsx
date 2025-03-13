import React, { useState } from 'react';

interface Driver {
  name: string;
  location: string;
  status: string;
}

interface Ride {
  pickup: string;
  dest: string;
  distance: number;
  demand: 'high' | 'low';
  supply: 'high' | 'low';
}

interface Notification {
  ride_id: string;
  driver_id: string;
  pickup: string;
  destination: string;
  ride_type: string;
  estimated_fare: number;
  message: string;
}

// Mock data
const mockDrivers: Record<string, Driver> = {
  "12345": { name: "John Doe", location: "Area A", status: "Available" }
};

const mockRides: Record<string, Ride> = {
  "5678": { pickup: "Area A", dest: "Area B", distance: 5, demand: "high", supply: "low" },
  "1234": { pickup: "Area C", dest: "Area D", distance: 10, demand: "low", supply: "high" }
};

const Classification: React.FC = () => {
  const [rideId, setRideId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [error, setError] = useState<string>('');

  const classifyRideType = (demand: string, supply: string): string => {
    if (demand === "high" && supply === "low") {
      return "Premium";
    }
    return "Standard";
  };

  const calculateFare = (distance: number): number => {
    const baseFare = 5.0;
    const distanceCost = distance * 1.5;
    const incentive = distance > 5 ? Math.random() * 3 : 0;
    return Number((baseFare + distanceCost + incentive).toFixed(2));
  };

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
    const rideType = classifyRideType(ride.demand, ride.supply);
    const fare = calculateFare(ride.distance);

    const newNotification: Notification = {
      ride_id: rideId,
      driver_id: driverId,
      pickup: ride.pickup,
      destination: ride.dest,
      ride_type: rideType,
      estimated_fare: fare,
      message: `New Ride: ${rideType}, $${fare}`
    };

    setNotification(newNotification);
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
            placeholder="Enter Ride ID"
          />
        </div>

        <div>
          <label className="block mb-2">Driver ID:</label>
          <input
            type="text"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter Driver ID"
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
                  : "bg-green-100 text-green-800"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classification;
