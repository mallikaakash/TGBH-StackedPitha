'use client';

import React, { useState } from 'react';
import Map from '@/components/Map';
import { getNearestPlacesWithDemand, PlacePrediction, VIJARAHALLI_LOCATION } from '@/services/modelService';

interface MapTabPanelProps {
  center: [number, number];
}

const MapTabPanel: React.FC<MapTabPanelProps> = ({ center }) => {
  // Set the initial map center to Vijarahalli coordinates
  const vijarahalliCenter: [number, number] = [VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude];
  
  const [currentLocation, setCurrentLocation] = useState({ 
    lat: VIJARAHALLI_LOCATION.latitude, 
    lng: VIJARAHALLI_LOCATION.longitude 
  });
  const [hotspots, setHotspots] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Handle location updates from the Map component
  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setCurrentLocation(location);
  };

  // Load predictions for the next hour based on current location
  const loadPredictions = async () => {
    setLoading(true);
    
    try {
      console.log('Loading predictions for Vijarahalli:', VIJARAHALLI_LOCATION);
      
      const predictions = await getNearestPlacesWithDemand(VIJARAHALLI_LOCATION);
      
      console.log('Received predictions:', predictions);
      setHotspots(predictions);
      setShowPredictions(true);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="h-full relative rounded-lg overflow-hidden shadow-sm border border-slate-200">
        <Map 
          center={vijarahalliCenter}
          zoom={13} 
          hotspots={hotspots}
          loading={loading}
          onLocationUpdate={handleLocationUpdate}
        />
        
        {/* Prediction button - only shown if predictions aren't already visible */}
        {!showPredictions && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <button 
              className="bg-purple-600 text-white py-3 px-6 rounded-full text-lg font-medium hover:bg-purple-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={loadPredictions}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-2"></span>
                  <span>Loading predictions...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 2v10l4 4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  <span>Load predictions in the next hour</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapTabPanel; 