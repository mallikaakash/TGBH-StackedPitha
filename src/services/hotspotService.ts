interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface HotspotResponse {
  hotspot: string;
  latitude: number;
  longitude: number;
  demand_score: number;
}

interface PredictionResponse {
  top_hotspots: HotspotResponse[];
  metadata: {
    timestamp: string;
    driver_location: DriverLocation;
    time_horizon: string;
  };
}

/**
 * Frontend-only implementation of hotspot prediction
 * Generates sample hotspots around the driver location
 */
export const predictHotspots = async (driverLocation: DriverLocation): Promise<PredictionResponse> => {
  // Log the driver location for debugging
  console.log('Predicting hotspots for location:', driverLocation);
  
  // Simulate network delay for realistic feel
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate time of day factor (0-1) - higher in morning & evening rush hours
  const now = new Date();
  const hour = now.getHours();
  const timeOfDayFactor = calculateTimeOfDayFactor(hour);
  
  // Generate hotspots around driver location with varying demand scores
  const hotspotsData = generateHotspots(driverLocation, timeOfDayFactor);
  
  // Sort by demand score and get top 5
  const sortedHotspots = hotspotsData.sort((a, b) => b.demand_score - a.demand_score).slice(0, 5);
  
  // Prepare and return the response
  return {
    top_hotspots: sortedHotspots,
    metadata: {
      timestamp: new Date().toISOString(),
      driver_location: driverLocation,
      time_horizon: '1_hour'
    }
  };
};

/**
 * Calculate time of day factor - simulates higher demand during rush hours
 * @param hour Current hour (0-23)
 * @returns Factor between 0-1
 */
function calculateTimeOfDayFactor(hour: number): number {
  // Morning rush (7-9 AM)
  if (hour >= 7 && hour <= 9) {
    return 0.8 + (Math.random() * 0.2);
  }
  // Evening rush (5-7 PM)
  else if (hour >= 17 && hour <= 19) {
    return 0.7 + (Math.random() * 0.3);
  }
  // Lunch time (12-2 PM)
  else if (hour >= 12 && hour <= 14) {
    return 0.6 + (Math.random() * 0.2);
  }
  // Late night (10 PM - 2 AM)
  else if (hour >= 22 || hour <= 2) {
    return 0.4 + (Math.random() * 0.3);
  }
  // Other times
  else {
    return 0.3 + (Math.random() * 0.3);
  }
}

/**
 * Generate realistic hotspots around the driver location
 * @param driverLocation Driver's current location
 * @param timeOfDayFactor Factor based on time of day
 * @returns Array of hotspot predictions
 */
function generateHotspots(driverLocation: DriverLocation, timeOfDayFactor: number): HotspotResponse[] {
  const { latitude, longitude } = driverLocation;
  
  // Bangalore-specific locations with offsets from current location
  const bangaloreLocations = [
    { 
      name: 'Indiranagar', 
      latOffset: 0.01, 
      lngOffset: 0.012, 
      baseScore: 0.87,
      description: 'Popular area with restaurants and pubs' 
    },
    { 
      name: 'Koramangala', 
      latOffset: -0.008, 
      lngOffset: 0.015, 
      baseScore: 0.82,
      description: 'Tech hub with many startups' 
    },
    { 
      name: 'HSR Layout', 
      latOffset: -0.017, 
      lngOffset: 0.017, 
      baseScore: 0.78,
      description: 'Residential area with tech offices' 
    },
    { 
      name: 'MG Road', 
      latOffset: 0.007, 
      lngOffset: -0.003, 
      baseScore: 0.76,
      description: 'Commercial district with shopping' 
    },
    { 
      name: 'Whitefield', 
      latOffset: 0.027, 
      lngOffset: 0.030, 
      baseScore: 0.72,
      description: 'IT corridor with many companies' 
    },
    { 
      name: 'Electronic City', 
      latOffset: -0.030, 
      lngOffset: 0.015, 
      baseScore: 0.75,
      description: 'IT hub with major tech parks' 
    },
    { 
      name: 'Jayanagar', 
      latOffset: -0.010, 
      lngOffset: -0.012, 
      baseScore: 0.68,
      description: 'Residential area with shopping' 
    },
    { 
      name: 'Malleshwaram', 
      latOffset: 0.008, 
      lngOffset: -0.015, 
      baseScore: 0.65,
      description: 'Traditional area with cafes' 
    }
  ];
  
  // Add time-of-day and random factors
  return bangaloreLocations.map(location => {
    // Calculate time-specific factor (morning boost for business districts, evening boost for entertainment areas)
    let timeBoost = 1.0;
    const hour = new Date().getHours();
    
    // Business districts get morning boost
    if ((location.name === 'Electronic City' || location.name === 'Whitefield' || location.name === 'HSR Layout') 
        && hour >= 7 && hour <= 10) {
      timeBoost = 1.2;
    }
    
    // Restaurant/entertainment areas get evening boost
    if ((location.name === 'Indiranagar' || location.name === 'Koramangala' || location.name === 'MG Road') 
        && hour >= 18 && hour <= 23) {
      timeBoost = 1.15;
    }
    
    // Shopping areas get weekend boost
    const isWeekend = [0, 6].includes(new Date().getDay());
    if ((location.name === 'Jayanagar' || location.name === 'MG Road') && isWeekend) {
      timeBoost *= 1.1;
    }
    
    // Random factor for variability
    const randomFactor = 0.85 + (Math.random() * 0.3);
    
    // Combine all factors and clamp between 0 and 1
    const score = Math.min(1, Math.max(0, location.baseScore * timeOfDayFactor * timeBoost * randomFactor));
    
    return {
      hotspot: `${location.name} - ${location.description}`,
      latitude: latitude + location.latOffset,
      longitude: longitude + location.lngOffset,
      demand_score: score
    };
  });
} 