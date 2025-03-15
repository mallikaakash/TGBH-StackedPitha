'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Point, Feature, Geometry } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { predictHotspots } from '../services/hotspotService';

// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWFrYXNobWFsbGlrIiwiYSI6ImNtODc5cHZ0aDBlZjMyaXNlcGc3aXk5ZGMifQ.xYguCB_TJiuP55uWMAvUNA';

interface MapProps {
  center: [number, number];
  zoom: number;
}

interface Hotspot {
  hotspot: string;
  latitude: number;
  longitude: number;
  demand_score: number;
}

// Type for the pulsing dot
interface PulsingDot {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  context: CanvasRenderingContext2D | null;
  onAdd: () => void;
  render: () => boolean;
}

// Custom properties for hotspot features
interface HotspotProperties {
  hotspot: string;
  demand_score: number;
}

// Get color for demand score
const getDemandColor = (score: number): string => {
  if (score >= 0.8) return '#E53935'; // High demand - red
  if (score >= 0.6) return '#FB8C00'; // Medium-high demand - orange
  if (score >= 0.4) return '#FFB300'; // Medium demand - amber
  return '#7CB342'; // Low demand - light green
};

// Get text description for demand level
const getDemandLevel = (score: number): string => {
  if (score >= 0.8) return 'Very High';
  if (score >= 0.6) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
};

const Map: React.FC<MapProps> = ({ center, zoom }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [driverLocation, setDriverLocation] = useState({ lat: center[1], lng: center[0] });
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Fetch hotspot predictions based on driver location
  const fetchHotspots = async () => {
    try {
      setLoading(true);
      console.log('Fetching hotspots for location:', driverLocation);
      
      const response = await predictHotspots({
        latitude: driverLocation.lat,
        longitude: driverLocation.lng
      });
      
      console.log('Received hotspot predictions:', response);
      console.log('Top hotspots:', response.top_hotspots);
      
      setHotspots(response.top_hotspots);
      
      // Update map with new hotspots
      updateMapHotspots(response.top_hotspots);
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update map with new hotspot data
  const updateMapHotspots = (hotspotData: Hotspot[]) => {
    if (!map.current) return;
    
    // Convert hotspots to GeoJSON features
    const hotspotFeatures = hotspotData.map(hotspot => ({
      type: 'Feature',
      properties: {
        hotspot: hotspot.hotspot,
        demand_score: hotspot.demand_score
      },
      geometry: {
        type: 'Point',
        coordinates: [hotspot.longitude, hotspot.latitude]
      }
    } as Feature<Point, HotspotProperties>));
    
    // Update hotspots source if it exists, otherwise create it
    const source = map.current.getSource('hotspots');
    
    if (source) {
      // Source exists, update data
      (source as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: hotspotFeatures
      });
    } else if (hotspotFeatures.length > 0) {
      // Source doesn't exist yet, create it if we have features
      map.current.addSource('hotspots', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: hotspotFeatures
        }
      });
      
      // Add glow effect layer for hotspots
      map.current.addLayer({
        id: 'hotspots-glow',
        type: 'circle',
        source: 'hotspots',
        paint: {
          // Larger radius with blur for glow effect
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, ['*', 15, ['get', 'demand_score']],
            16, ['*', 40, ['get', 'demand_score']]
          ],
          // Color based on demand score
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'demand_score'],
            0.2, 'rgba(124, 179, 66, 0.4)',  // Low - green with low opacity
            0.4, 'rgba(255, 179, 0, 0.4)',   // Medium - amber with low opacity
            0.6, 'rgba(251, 140, 0, 0.4)',   // High - orange with low opacity
            0.8, 'rgba(229, 57, 53, 0.4)'    // Very high - red with low opacity
          ],
          'circle-blur': 1,
          'circle-opacity': 0.7
        }
      });
      
      // Add main hotspot circles layer
      map.current.addLayer({
        id: 'hotspots-layer',
        type: 'circle',
        source: 'hotspots',
        paint: {
          // Size circles based on demand score and zoom level
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, ['*', 7, ['get', 'demand_score']],
            16, ['*', 20, ['get', 'demand_score']]
          ],
          // Color based on demand score
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'demand_score'],
            0.2, '#7CB342',  // Low - green
            0.4, '#FFB300',  // Medium - amber
            0.6, '#FB8C00',  // High - orange
            0.8, '#E53935'   // Very high - red
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9
        }
      });
      
      // Add labels for hotspots
      map.current.addLayer({
        id: 'hotspots-label',
        type: 'symbol',
        source: 'hotspots',
        layout: {
          'text-field': ['to-string', ['get', 'hotspot']],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-ignore-placement': false
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': 'rgba(255, 255, 255, 0.8)',
          'text-halo-width': 2
        }
      });
      
      // Add click interaction for hotspots
      map.current.on('click', 'hotspots-layer', (e) => {
        if (!e.features || e.features.length === 0 || !map.current) return;
        
        const feature = e.features[0] as mapboxgl.MapboxGeoJSONFeature;
        
        // Safely cast properties with null check
        const properties = feature.properties as HotspotProperties | null;
        if (!properties) return;
        
        // Handle Point geometry
        const geometry = feature.geometry as GeoJSON.Point;
        const coordinates = geometry.coordinates.slice() as [number, number];
        
        // Find the hotspot in our state
        const clickedHotspot = hotspots.find(h => 
          h.latitude.toFixed(5) === coordinates[1].toFixed(5) && 
          h.longitude.toFixed(5) === coordinates[0].toFixed(5)
        );
        
        if (clickedHotspot) {
          setSelectedHotspot(clickedHotspot);
        }
        
        // Remove existing popup if any
        if (popupRef.current) {
          popupRef.current.remove();
        }
        
        // Format the demand score as a percentage
        const demandScore = properties.demand_score;
        const demandPercent = Math.round(demandScore * 100);
        const demandColor = getDemandColor(demandScore);
        const demandLevel = getDemandLevel(demandScore);
        
        // Create new popup
        popupRef.current = new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family: Arial, sans-serif; padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: ${demandColor}; font-weight: bold; font-size: 16px;">${properties.hotspot.split(' - ')[0]}</h3>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${properties.hotspot.split(' - ')[1]}</p>
              <div style="display: flex; align-items: center; margin-top: 8px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${demandColor}; margin-right: 8px;"></div>
                <p style="margin: 0; font-weight: bold; color: ${demandColor};">${demandLevel} Demand: ${demandPercent}%</p>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 12px;">
                Coordinates: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}
              </p>
            </div>
          `)
          .addTo(map.current);
      });
      
      // Change cursor when hovering over hotspots
      map.current.on('mouseenter', 'hotspots-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'hotspots-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }
  };

  // Fetch hotspots when driver location changes
  useEffect(() => {
    fetchHotspots();
  }, [driverLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Create the Mapbox map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [driverLocation.lng, driverLocation.lat],
      zoom: zoom,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add attribution control
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // Add current location marker
    const marker = new mapboxgl.Marker({
      color: '#FF6B00',
      draggable: true
    })
      .setLngLat([driverLocation.lng, driverLocation.lat])
      .addTo(map.current);

    // Update driver location when marker is dragged
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      setDriverLocation({ lat: lngLat.lat, lng: lngLat.lng });
    });

    // Add pulsing dot effect for current location
    const size = 200;

    const pulsingDot: PulsingDot = {
      width: size,
      height: size,
      data: new Uint8ClampedArray(size * size * 4),
      context: null,
      
      // Called when the layer is added to the map
      onAdd: function() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
      },
      
      // Called on each frame to animate the dot
      render: function() {
        if (!this.context) return false;
        
        const duration = 1500;
        const t = (performance.now() % duration) / duration;
        
        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;
        
        // Clear canvas
        context.clearRect(0, 0, this.width, this.height);
        
        // Draw outer circle
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(255, 107, 0, ${1 - t})`;
        context.fill();
        
        // Draw inner circle
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          radius,
          0,
          Math.PI * 2
        );
        context.fillStyle = 'rgba(255, 107, 0, 1)';
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.fill();
        context.stroke();
        
        this.data = context.getImageData(0, 0, this.width, this.height).data;
        
        map.current?.triggerRepaint();
        return true;
      }
    };

    // When map is loaded, add the pulsing dot and hotspots
    map.current.on('load', () => {
      // Add pulsing dot image
      map.current?.addImage('pulsing-dot', pulsingDot as any, { pixelRatio: 2 });
      
      // Add source for pulsing dot
      map.current?.addSource('dot-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [driverLocation.lng, driverLocation.lat]
              }
            }
          ]
        }
      });
      
      // Add layer for pulsing dot
      map.current?.addLayer({
        id: 'layer-with-pulsing-dot',
        type: 'symbol',
        source: 'dot-point',
        layout: {
          'icon-image': 'pulsing-dot',
          'icon-allow-overlap': true
        }
      });

      // Initial fetch of hotspots
      fetchHotspots();
    });

    // Cleanup when component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array so this only runs once on mount

  // Update dot position when driver location changes
  useEffect(() => {
    if (!map.current) return;
    
    // Update dot point source with new coordinates
    const source = map.current.getSource('dot-point');
    if (source) {
      (source as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [driverLocation.lng, driverLocation.lat]
            }
          }
        ]
      });
    }
    
    // Center map on new driver location
    map.current.flyTo({
      center: [driverLocation.lng, driverLocation.lat],
      speed: 1.5,
      essential: true
    });
  }, [driverLocation]);

  // Function to fly to a hotspot
  const flyToHotspot = (hotspot: Hotspot) => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: [hotspot.longitude, hotspot.latitude],
      zoom: 14,
      speed: 1.8,
      essential: true
    });
    
    setSelectedHotspot(hotspot);
    
    // Create new popup for the hotspot
    if (popupRef.current) {
      popupRef.current.remove();
    }
    
    const demandScore = hotspot.demand_score;
    const demandPercent = Math.round(demandScore * 100);
    const demandColor = getDemandColor(demandScore);
    const demandLevel = getDemandLevel(demandScore);
    const [name, description] = hotspot.hotspot.split(' - ');
    
    popupRef.current = new mapboxgl.Popup()
      .setLngLat([hotspot.longitude, hotspot.latitude])
          .setHTML(`
        <div style="font-family: Arial, sans-serif; padding: 10px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: ${demandColor}; font-weight: bold; font-size: 16px;">${name}</h3>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${description}</p>
          <div style="display: flex; align-items: center; margin-top: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${demandColor}; margin-right: 8px;"></div>
            <p style="margin: 0; font-weight: bold; color: ${demandColor};">${demandLevel} Demand: ${demandPercent}%</p>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            Coordinates: ${hotspot.latitude.toFixed(4)}, ${hotspot.longitude.toFixed(4)}
          </p>
            </div>
          `)
      .addTo(map.current);
  };

  return (
    <div className="w-full h-full relative rounded-3xl shadow-inner">
      <div ref={mapContainer} className="w-full h-full rounded-3xl"/>
      
      {loading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow z-10">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2"></div>
            <span>Predicting hotspots...</span>
          </div>
        </div>
      )}
      
      {/* Hotspot predictions sidebar */}
      <div className="absolute top-4 right-4 bottom-4 bg-white rounded-xl shadow-lg z-10 w-72 overflow-hidden flex flex-col">
        <div className="bg-purple-700 text-white py-3 px-4">
          <h3 className="font-bold text-lg">Demand Hotspots</h3>
          <p className="text-xs text-purple-200">Predicted high-demand areas near you</p>
        </div>
        
        <div className="flex-1 overflow-auto p-3">
          {hotspots.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              No hotspots found nearby
            </div>
          ) : (
            <div className="space-y-3">
              {hotspots.map((hotspot, index) => {
                const isSelected = selectedHotspot === hotspot;
                const demandScore = Math.round(hotspot.demand_score * 100);
                const demandColor = getDemandColor(hotspot.demand_score);
                const demandLevel = getDemandLevel(hotspot.demand_score);
                const [name, description] = hotspot.hotspot.split(' - ');

  return (
                  <div 
                    key={index} 
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all
                      ${isSelected ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 hover:bg-gray-100'} 
                    `}
                    onClick={() => flyToHotspot(hotspot)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-800">{name}</div>
                      <div 
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: `${demandColor}20`, 
                          color: demandColor 
                        }}
                      >
                        {demandScore}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{description}</div>
                    <div className="flex items-center mt-2">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: demandColor }}
                      ></div>
                      <div className="text-xs" style={{ color: demandColor }}>
                        {demandLevel} Demand
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-3 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-500">
            <span>Driver Location: {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p>Drag the orange marker to update predictions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;