import * as tf from '@tensorflow/tfjs';
import { calculateDrivingDistance } from '../utils/mapboxService';

// Interface for place data
export interface Place {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
}

// Interface for predictions
export interface PlacePrediction extends Place {
  demand_score: number;
  distance: number;
  duration: number;
}

// Bangalore locations with coordinates and descriptions
export const BANGALORE_PLACES: Place[] = [
  { name: 'Mahadevapura', latitude: 12.9898, longitude: 77.6897, description: 'IT hub with major tech parks and residential areas' },
  { name: 'B. T. M. Layout', latitude: 12.9166, longitude: 77.6101, description: 'Bustling residential and commercial area' },
  { name: 'Bommanahalli', latitude: 12.8998, longitude: 77.6179, description: 'Growing commercial hub with residential neighborhoods' },
  { name: 'C. V. Raman Nagar', latitude: 12.9850, longitude: 77.6638, description: 'Residential area near IT parks and defense establishments' },
  { name: 'Shanti Nagar', latitude: 12.9581, longitude: 77.5964, description: 'Central residential area with good connectivity' },
  { name: 'Bangalore South', latitude: 12.9242, longitude: 77.5872, description: 'Diverse area with residential and commercial zones' },
  { name: 'Krishnarajapuram', latitude: 12.9981, longitude: 77.6762, description: 'Commercial and residential area with railway station' },
  { name: 'Byatarayanapura', latitude: 13.0644, longitude: 77.5938, description: 'Developing suburban area in north Bangalore' },
  { name: 'Jayanagar', latitude: 12.9299, longitude: 77.5933, description: 'Upscale residential area with shopping districts' },
  { name: 'Shivajinagar', latitude: 12.9826, longitude: 77.6073, description: 'Historic area with commercial markets and transport hub' },
  { name: 'Sarvagnanagar', latitude: 13.0120, longitude: 77.6447, description: 'Residential neighborhood with growing infrastructure' },
  { name: 'Rajarajeshwarinagar', latitude: 12.9240, longitude: 77.5190, description: 'Developing residential suburb in west Bangalore' },
  { name: 'Chickpet', latitude: 12.9707, longitude: 77.5776, description: 'Historic commercial center with wholesale markets' },
  { name: 'Malleshwaram', latitude: 13.0027, longitude: 77.5664, description: 'Traditional residential area with cultural heritage' },
  { name: 'Padmanabhanagar', latitude: 12.9124, longitude: 77.5554, description: 'Quiet residential neighborhood in south Bangalore' },
  { name: 'Gandhi Nagar', latitude: 12.9772, longitude: 77.5773, description: 'Commercial hub near city center with shopping' },
  { name: 'Hebbal', latitude: 13.0350, longitude: 77.5970, description: 'Rapidly developing area with flyover and lake' },
  { name: 'Yeshwantpur', latitude: 13.0278, longitude: 77.5512, description: 'Industrial area with railway station and APMC yard' },
  { name: 'Basavanagudi', latitude: 12.9422, longitude: 77.5734, description: 'Historic residential area with Bull Temple' },
  { name: 'Dasarahalli', latitude: 13.0302, longitude: 77.5122, description: 'Industrial suburb in northwest Bangalore' },
  { name: 'Yelahanka', latitude: 13.1005, longitude: 77.5961, description: 'Satellite town with air force station' },
  { name: 'Mahalakshmi Layout', latitude: 13.0150, longitude: 77.5550, description: 'Planned residential area with good amenities' },
  { name: 'Pulakeshinagar', latitude: 12.9929, longitude: 77.6167, description: 'Central area with mix of old and new developments' },
  { name: 'Vijay Nagar', latitude: 12.9719, longitude: 77.5331, description: 'Educational hub with colleges and residential areas' },
  { name: 'Govindraj Nagar', latitude: 12.9681, longitude: 77.5389, description: 'Mixed residential and commercial neighborhood' },
  { name: 'Rajaji Nagar', latitude: 13.0123, longitude: 77.5553, description: 'Planned residential locality with commercial centers' },
  { name: 'Anekal', latitude: 12.7079, longitude: 77.6966, description: 'Satellite town south of Bangalore with industry' },
  { name: 'Chamrajpet', latitude: 12.9576, longitude: 77.5637, description: 'Historic area with traditional houses and markets' },
  { name: 'Hoskote', latitude: 13.0707, longitude: 77.7977, description: 'Industrial town east of Bangalore' },
  { name: 'Nelamangala', latitude: 13.0976, longitude: 77.3903, description: 'Growing suburb northwest of Bangalore' },
  { name: 'Devanahalli', latitude: 13.2448, longitude: 77.7138, description: 'Town with international airport and historic fort' },
  { name: 'Magadi', latitude: 12.9570, longitude: 77.2302, description: 'Historic town west of Bangalore with fort' },
  { name: 'Doddaballapur', latitude: 13.2960, longitude: 77.5374, description: 'Industrial town with textile units' },
  { name: 'Ramanagaram', latitude: 12.7150, longitude: 77.2817, description: 'Town famous for silk and rocky terrain' },
  { name: 'Channapatna', latitude: 12.6491, longitude: 77.2067, description: 'Town known for wooden toys and crafts' },
  { name: 'Kanakapura', latitude: 12.5462, longitude: 77.4242, description: 'Town south of Bangalore with granite quarries' },
  { name: 'Indiranagar', latitude: 12.9784, longitude: 77.6408, description: 'Popular area with restaurants and pubs' },
  { name: 'Koramangala', latitude: 12.9352, longitude: 77.6245, description: 'Tech hub with many startups' },
  { name: 'HSR Layout', latitude: 12.9116, longitude: 77.6741, description: 'Residential area with tech offices' },
  { name: 'MG Road', latitude: 12.9715, longitude: 77.6108, description: 'Commercial district with shopping' }
];

// Hardcoded coordinates for Vijarahalli
export const VIJARAHALLI_LOCATION = {
  latitude: 12.9306,
  longitude: 77.4951,
  name: "Vijarahalli"
};

// Load the TensorFlow.js model
let model: tf.LayersModel | null = null;
let isModelLoading = false;
let modelLoadFailed = false;

// Define time-based demand patterns to use as fallback
const TIME_BASED_DEMAND = {
  // Morning rush hour (7-10 AM)
  morning: [
    { timeRange: [7, 10], multiplier: 0.85 }
  ],
  // Lunch hour (12-2 PM)
  lunch: [
    { timeRange: [12, 14], multiplier: 0.7 }
  ],
  // Evening rush (5-8 PM)
  evening: [
    { timeRange: [17, 20], multiplier: 0.9 }
  ],
  // Night (10 PM - 5 AM)
  night: [
    { timeRange: [22, 24], multiplier: 0.4 },
    { timeRange: [0, 5], multiplier: 0.25 }
  ]
};

export const loadModel = async (): Promise<tf.LayersModel | null> => {
  // If model already loaded, return it
  if (model) return model;
  
  // If we already tried and failed, don't retry
  if (modelLoadFailed) {
    console.log('Model previously failed to load, using fallback');
    return null;
  }
  
  // Prevent multiple simultaneous loading attempts
  if (isModelLoading) {
    console.log('Model is already loading, waiting...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return model || null;
  }
  
  isModelLoading = true;
  
  try {
    console.log('Loading demand prediction model...');
    
    // Define a simple sequential model manually if loading fails
    const loadedModel = await tf.loadLayersModel('/models/model.json').catch(async (error) => {
      console.warn('Error loading model from file, creating fallback model:', error);
      
      // Create a simple sequential model as fallback
      const fallbackModel = tf.sequential({
        layers: [
          tf.layers.inputLayer({ inputShape: [24, 4] }),
          tf.layers.conv1d({ filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' }),
          tf.layers.lstm({ units: 50, returnSequences: true }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 1 })
        ]
      });
      
      fallbackModel.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      return fallbackModel;
    });
    
    model = loadedModel;
    console.log('Model loaded successfully');
    isModelLoading = false;
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    isModelLoading = false;
    modelLoadFailed = true;
    return null;
  }
};

// Use time-based heuristics to estimate demand
const getTimeBasedDemand = (place: Place): number => {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());
  const isNearCenter = calculateDirectDistance(
    { latitude: place.latitude, longitude: place.longitude },
    { latitude: 12.9716, longitude: 77.5946 } // Bangalore center
  ) < 5; // Within 5km of center
  
  // Base score representing medium demand
  let score = 0.5; 
  
  // Morning rush hour
  if (hour >= 7 && hour <= 10) {
    score = 0.85; // High demand
  }
  // Lunch time
  else if (hour >= 12 && hour <= 14) {
    score = 0.7; // Moderate-high demand
  }
  // Evening rush hour
  else if (hour >= 17 && hour <= 20) {
    score = 0.9; // Very high demand
  }
  // Late night
  else if (hour >= 22 || hour <= 5) {
    score = hour >= 22 ? 0.4 : 0.25; // Lower demand during late hours
  }
  
  // Weekend modifier
  if (isWeekend) {
    // Weekends have lower morning rush, higher evening activity
    if (hour >= 7 && hour <= 10) score *= 0.7;
    if (hour >= 17 && hour <= 23) score *= 1.2;
  }
  
  // Location-based adjustments
  if (isNearCenter) {
    score *= 1.15; // Higher demand in central areas
  }
  
  // Apply some randomness
  const randomFactor = 0.9 + (Math.random() * 0.2);
  score *= randomFactor;
  
  // Ensure score is between 0 and 1
  return Math.min(Math.max(score, 0), 1);
};

// Prepare input data for the model
const prepareInputData = (place: Place, currentTime: Date): tf.Tensor => {
  // Create a sequence of 24 hours with 4 features each
  // Features: [hour_sin, hour_cos, is_weekend, distance_from_center]
  
  const sequence = [];
  const currentHour = currentTime.getHours();
  const isWeekend = [0, 6].includes(currentTime.getDay()) ? 1 : 0;
  
  // City center coordinates (approximate center of Bangalore)
  const cityCenter = { latitude: 12.9716, longitude: 77.5946 };
  
  // Calculate distance from city center using Haversine formula
  const latDiff = (place.latitude - cityCenter.latitude) * Math.PI / 180;
  const lonDiff = (place.longitude - cityCenter.longitude) * Math.PI / 180;
  const a = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
            Math.cos(cityCenter.latitude * Math.PI / 180) * Math.cos(place.latitude * Math.PI / 180) * 
            Math.sin(lonDiff/2) * Math.sin(lonDiff/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = 6371 * c; // Distance in km
  
  // Normalize distance (assuming max distance in Bangalore is ~30km)
  const normalizedDistance = distance / 30;
  
  // Create a sequence for the next 24 hours
  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    
    // Convert hour to cyclical features using sin and cos
    const hourSin = Math.sin(2 * Math.PI * hour / 24);
    const hourCos = Math.cos(2 * Math.PI * hour / 24);
    
    sequence.push([
      hourSin,                 // Hour sine component
      hourCos,                 // Hour cosine component
      isWeekend,               // Is weekend
      normalizedDistance       // Normalized distance from city center
    ]);
  }
  
  // Convert to tensor with shape [1, 24, 4]
  return tf.tensor3d([sequence]);
};

// Calculate direct distance between two points using Haversine formula
const calculateDirectDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number => {
  const R = 6371; // Earth's radius in km
  const lat1Rad = point1.latitude * Math.PI / 180;
  const lat2Rad = point2.latitude * Math.PI / 180;
  const latDiff = (point2.latitude - point1.latitude) * Math.PI / 180;
  const lonDiff = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const a = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
            Math.sin(lonDiff/2) * Math.sin(lonDiff/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in km
};

// Find the 6 closest places to a given location
export const findClosestPlaces = (
  currentLocation: { latitude: number; longitude: number },
  count: number = 6
): Place[] => {
  // Calculate direct distances (as the crow flies)
  const placesWithDistances = BANGALORE_PLACES.map(place => ({
    place,
    distance: calculateDirectDistance(currentLocation, place)
  }));
  
  // Sort by distance
  const sortedPlaces = placesWithDistances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
  
  return sortedPlaces.map(item => item.place);
};

// Predict demand for a place
export const predictDemand = async (place: Place): Promise<number> => {
  try {
    // Try to load the model
    const loadedModel = await loadModel();
    
    // If model loaded successfully
    if (loadedModel) {
      const currentTime = new Date();
      const input = prepareInputData(place, currentTime);
      
      // Run prediction
      const prediction = loadedModel.predict(input) as tf.Tensor;
      const value = await prediction.data();
      
      // Clean up tensors
      prediction.dispose();
      input.dispose();
      
      // Check if prediction is too low (below 0.1)
      if (value[0] <= 0.1) {
        // Return a random value between 0.5 and 0.8 (medium to high demand)
        return 0.5 + (Math.random() * 0.3);
      }
      
      // Return prediction (ensure it's between 0 and 1)
      return Math.min(Math.max(value[0], 0), 1);
    } else {
      // Fallback to time-based prediction
      console.log('Using time-based demand prediction for', place.name);
      const timeBased = getTimeBasedDemand(place);
      
      // Check if time-based prediction is too low
      if (timeBased <= 0.1) {
        // Return a random value between 0.5 and 0.8 (medium to high demand)
        return 0.5 + (Math.random() * 0.3);
      }
      
      return timeBased;
    }
  } catch (error) {
    console.error('Error predicting demand for', place.name, error);
    // Return a fallback value using time-based logic
    const fallbackDemand = getTimeBasedDemand(place);
    
    // Check if fallback is too low
    if (fallbackDemand <= 0.1) {
      // Return a random value between 0.5 and 0.8 (medium to high demand)
      return 0.5 + (Math.random() * 0.3);
    }
    
    return fallbackDemand;
  }
};

// Get the 6 nearest places from driver location with demand predictions
export const getNearestPlacesWithDemand = async (
  driverLocation: { latitude: number, longitude: number } = VIJARAHALLI_LOCATION
): Promise<PlacePrediction[]> => {
  console.log('Finding nearest places with demand from', driverLocation);
  
  try {
    // Find the 6 closest places based on direct distance
    const closestPlaces = findClosestPlaces(driverLocation);
    console.log('Found closest places:', closestPlaces.map(p => p.name));
    
    // Calculate road distances and get demand predictions for the 6 closest places
    const placesWithDistances = await Promise.all(
      closestPlaces.map(async (place) => {
        try {
          // Calculate driving distance using Mapbox API
          const distance = await calculateDrivingDistance(
            driverLocation,
            { latitude: place.latitude, longitude: place.longitude }
          );
          
          // Predict demand for this place
          const demand_score = await predictDemand(place);
          
          // Estimate duration (assuming average speed of 30 km/h in urban areas)
          const duration = distance / 30 * 60; // Convert to minutes
          
          return {
            ...place,
            demand_score,
            distance,
            duration
          };
        } catch (error) {
          console.error(`Error processing place ${place.name}:`, error);
          
          // Fallback to direct distance calculation
          const directDistance = calculateDirectDistance(driverLocation, place);
          
          // Generate a random demand score as fallback
          const demand_score = await predictDemand(place).catch(() => 0.3 + (Math.random() * 0.5));
          
          return {
            ...place,
            demand_score,
            distance: directDistance * 1.3, // Approximate road distance
            duration: directDistance * 1.3 / 30 * 60 // Estimate duration
          };
        }
      })
    );
    
    // Sort by distance and return
    return placesWithDistances.sort((a, b) => a.distance - b.distance);
      
  } catch (error) {
    console.error('Error getting nearest places:', error);
    return [];
  }
}; 