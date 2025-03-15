/**
 * Mapbox API Service
 * 
 * This module provides utility functions for interacting with the Mapbox API
 * for distance calculations and location-based services.
 */

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWFrYXNobWFsbGlrIiwiYSI6ImNtODc5cHZ0aDBlZjMyaXNlcGc3aXk5ZGMifQ.xYguCB_TJiuP55uWMAvUNA';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the driving distance between two points using Mapbox Directions API
 * 
 * @param origin - Starting coordinates
 * @param destination - Ending coordinates
 * @returns Promise resolving to the distance in kilometers
 */
export const calculateDrivingDistance = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<number> => {
  try {
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }
    
    return data.routes[0].distance / 1000; // Convert meters to kilometers
  } catch (error) {
    console.error('Error calculating driving distance:', error);
    return calculateDirectDistance(origin, destination) * 1.3;
  }
};

/**
 * Calculate direct (as-the-crow-flies) distance between two points using Haversine formula
 * 
 * @param point1 - First point coordinates
 * @param point2 - Second point coordinates
 * @returns Distance in kilometers
 */
export const calculateDirectDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate the "dead mileage" - the distance a driver must travel to reach the pickup point
 * 
 * @param driverLocation - Current driver location
 * @param pickupLocation - Pickup location
 * @returns Promise resolving to the dead mileage distance in kilometers
 */
export const calculateDeadMileage = async (
  driverLocation: Coordinates,
  pickupLocation: Coordinates
): Promise<number> => {
  try {
    return await calculateDrivingDistance(driverLocation, pickupLocation);
  } catch (error) {
    console.error('Error calculating dead mileage:', error);
    return calculateDirectDistance(driverLocation, pickupLocation) * 1.3;
  }
};

/**
 * Calculate the driving time between two points
 * 
 * @param origin - Starting coordinates
 * @param destination - Ending coordinates
 * @returns Promise resolving to the duration in minutes
 */
export const calculateDrivingTime = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<number> => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if routes were found
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }
    
    // Return time in minutes (Mapbox returns seconds)
    return data.routes[0].duration / 60;
  } catch (error) {
    console.error('Error calculating driving time:', error);
    
    // Fallback to an estimated time based on distance
    // Assuming an average speed of 30 km/h in urban areas
    const distance = await calculateDrivingDistance(origin, destination);
    return distance * 2; // Rough estimate: 30 km/h = 0.5 km/min, so 2 minutes per km
  }
};

/**
 * Helper function to decode Mapbox's polyline format
 * 
 * @param str - Encoded polyline string
 * @returns Decoded array of coordinates [longitude, latitude]
 */
export const decodePolyline = (str: string): [number, number][] => {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  
  while (index < str.length) {
    // Decode latitude
    let result = 0;
    let shift = 0;
    let b = 0;
    
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    // Decode longitude
    result = 0;
    shift = 0;
    
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    coordinates.push([lng * 1e-5, lat * 1e-5]);
  }
  
  return coordinates;
};

/**
 * Get complete route details between two points
 * 
 * @param origin - Starting coordinates
 * @param destination - Ending coordinates
 * @returns Promise resolving to route details including distance, duration, and geometry
 */
export const getRouteDetails = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<{
  distance: number;  // in kilometers
  duration: number;  // in minutes
  geometry: string;
  trafficDensity: string;
}> => {
  try {
    // Format coordinates for the Mapbox API
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    // Request additional parameters for complete route information
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&annotations=congestion,duration,distance&steps=true`;
    
    console.log('Fetching route from Mapbox API:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if routes were found
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    // Analyze congestion data if available
    let trafficDensity = "moderate";
    if (data.routes[0].legs[0]?.annotation?.congestion) {
      const congestionValues = data.routes[0].legs[0].annotation.congestion;
      const congestionLevels = new Set(congestionValues);
      
      if (congestionLevels.has("severe")) {
        trafficDensity = "high";
      } else if (congestionLevels.has("heavy")) {
        trafficDensity = "medium-high";
      } else if (congestionLevels.has("moderate")) {
        trafficDensity = "medium";
      } else {
        trafficDensity = "low";
      }
    }
    
    // Extract route geometry
    const geometry = JSON.stringify(data.routes[0].geometry);
    
    console.log('Route details retrieved successfully:', {
      distance: data.routes[0].distance / 1000,
      duration: data.routes[0].duration / 60,
      geometryType: typeof data.routes[0].geometry,
      hasCoordinates: data.routes[0].geometry.coordinates?.length > 0
    });
    
    return {
      distance: data.routes[0].distance / 1000, // Convert meters to kilometers
      duration: data.routes[0].duration / 60,   // Convert seconds to minutes
      geometry: geometry,
      trafficDensity
    };
  } catch (error) {
    console.error('Error getting route details:', error);
    
    // Fallback to direct calculation
    const directDistance = calculateDirectDistance(origin, destination);
    
    // Create a simple straight-line route for fallback
    const fallbackGeometry = {
      type: "LineString",
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude]
      ]
    };
    
    return {
      distance: directDistance * 1.3, // Approximate real-world distance
      duration: (directDistance * 1.3) / 0.5, // Assuming average speed of 30km/h (0.5km/min)
      geometry: JSON.stringify(fallbackGeometry),
      trafficDensity: "unknown"
    };
  }
};

/**
 * Estimate surge pricing factor based on time of day and location demand
 * 
 * @param location - The location coordinates to check
 * @param timeOfDay - Current time period (morning, afternoon, evening, night)
 * @returns Promise resolving to a surge pricing factor
 */
export const estimateSurgePricingFactor = async (
  location: Coordinates,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): Promise<number> => {
  // In a real implementation, this would query an API or backend service
  // that tracks real-time demand in different areas
  
  // For now, we'll use a simplified model based on time of day
  // with some randomization to simulate different demand levels
  const baseSurgeFactor = {
    morning: 1.5,  // Morning rush hour
    afternoon: 1.0, // Normal daytime rates
    evening: 1.7,  // Evening rush hour
    night: 1.3     // Late night premium
  }[timeOfDay];
  
  // Add some randomization (±0.3)
  const randomVariation = (Math.random() * 0.6) - 0.3;
  
  return Math.max(1.0, baseSurgeFactor + randomVariation);
};

/**
 * Get live traffic conditions for a route
 * 
 * @param origin - Starting coordinates
 * @param destination - Ending coordinates
 * @returns Promise resolving to traffic conditions
 */
export const getTrafficConditions = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<{
  congestionLevel: string;
  delayFactor: number;
  incidents: any[];
}> => {
  try {
    const routeDetails = await getRouteDetails(origin, destination);
    
    // Map trafficDensity to congestionLevel and delayFactor
    const congestionMap: Record<string, { level: string; factor: number }> = {
      "high": { level: "Severe Congestion", factor: 1.8 },
      "medium-high": { level: "Heavy Traffic", factor: 1.5 },
      "medium": { level: "Moderate Traffic", factor: 1.2 },
      "low": { level: "Light Traffic", factor: 1.0 },
      "unknown": { level: "Traffic Info Unavailable", factor: 1.3 }
    };
    
    const congestion = congestionMap[routeDetails.trafficDensity] || congestionMap["unknown"];
    
    return {
      congestionLevel: congestion.level,
      delayFactor: congestion.factor,
      incidents: [] // In a real implementation, this would include traffic incidents along the route
    };
  } catch (error) {
    console.error('Error getting traffic conditions:', error);
    return {
      congestionLevel: "Unknown",
      delayFactor: 1.3,
      incidents: []
    };
  }
};

/**
 * Calculate estimated time of arrival (ETA)
 * 
 * @param origin - Starting coordinates
 * @param destination - Ending coordinates
 * @returns Promise resolving to ETA in minutes
 */
export const calculateETA = async (
  origin: Coordinates,
  destination: Coordinates
): Promise<number> => {
  try {
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }
    
    // Return time in minutes (Mapbox returns seconds)
    return Math.round(data.routes[0].duration / 60);
  } catch (error) {
    console.error('Error calculating ETA:', error);
    
    // Fallback calculation based on distance
    const distance = await calculateDrivingDistance(origin, destination);
    const averageSpeed = 30; // km/h in urban areas
    return Math.round((distance / averageSpeed) * 60); // Convert to minutes
  }
};

/**
 * Get a static map image URL for a route
 * 
 * @param origin - Starting coordinates
 * @param destination - Ending coordinates
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns URL for the static map image
 */
export const getStaticMapImageUrl = (
  origin: Coordinates,
  destination: Coordinates,
  width: number = 600,
  height: number = 400
): string => {
  // Create a marker string for origin and destination
  const markers = `pin-s-a+3498db(${origin.longitude},${origin.latitude}),pin-s-b+e74c3c(${destination.longitude},${destination.latitude})`;
  
  // Return the static map URL
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markers}/auto/${width}x${height}?access_token=${MAPBOX_TOKEN}`;
}; 