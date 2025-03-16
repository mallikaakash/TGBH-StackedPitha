'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Point, Feature, Geometry } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getRouteDetails, Coordinates } from '../utils/mapboxService';
import { PlacePrediction, VIJARAHALLI_LOCATION } from '../services/modelService';
import { calculateEstimatedFare, calculateDriverProfit, getSurgeMultiplierFromDemand } from '../utils/fareCalculation';

mapboxgl.accessToken = 'pk.eyJ1IjoiYWFrYXNobWFsbGlrIiwiYSI6ImNtODc5cHZ0aDBlZjMyaXNlcGc3aXk5ZGMifQ.xYguCB_TJiuP55uWMAvUNA';

interface MapProps {
  center: [number, number];
  zoom: number;
  hotspots: PlacePrediction[];
  loading: boolean;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

interface PulsingDot {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  context: CanvasRenderingContext2D | null;
  onAdd: () => void;
  render: () => boolean;
}

interface ArrowIcon {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  context: CanvasRenderingContext2D | null;
  onAdd: () => void;
  render: () => boolean | true;
}

interface HotspotProperties {
  name: string;
  description: string;
  demand_score: number;
  distance: number;
  duration: number;
  estimated_profit: number;
}

const getDemandColor = (score: number): string => {
  if (score >= 0.8) return '#FF9800';
  if (score >= 0.6) return '#FF9800';
  if (score >= 0.4) return '#FF9800';
  return '#FF9800';
};

const getDemandLevel = (score: number): string => {
  if (score >= 0.8) return 'Very High';
  if (score >= 0.6) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
};

const Map: React.FC<MapProps> = ({ center, zoom, hotspots, loading, onLocationUpdate }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [driverLocation, setDriverLocation] = useState({ lat: center[1], lng: center[0] });
  const [selectedHotspot, setSelectedHotspot] = useState<PlacePrediction | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Got user location:', latitude, longitude);
          updateDriverLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting user location:', error);
          updateDriverLocation({ 
            lat: VIJARAHALLI_LOCATION.latitude, 
            lng: VIJARAHALLI_LOCATION.longitude 
          });
        }
      );
    } else {
      console.log('Geolocation not available in this browser');
      updateDriverLocation({ 
        lat: VIJARAHALLI_LOCATION.latitude, 
        lng: VIJARAHALLI_LOCATION.longitude 
      });
    }
  };

  const updateDriverLocation = (location: { lat: number; lng: number }) => {
    setDriverLocation(location);
    if (onLocationUpdate) {
      onLocationUpdate(location);
    }
  };

  const calculateProfit = (hotspot: PlacePrediction): number => {
    const surgeMultiplier = getSurgeMultiplierFromDemand(hotspot.demand_score);
    
    const fare = calculateEstimatedFare(hotspot.distance, hotspot.duration, surgeMultiplier);
    
    return calculateDriverProfit(fare, hotspot.distance);
  };

  const updateMapHotspots = () => {
    if (!map.current || hotspots.length === 0) return;
    
    markers.forEach(marker => marker.remove());
    setMarkers([]);
    
    const newMarkers = hotspots.map(hotspot => {
      const profit = calculateProfit(hotspot);
      
      const markerContainer = document.createElement('div');
      markerContainer.className = 'marker-container';
      markerContainer.style.position = 'relative';
      markerContainer.style.width = '42px';
      markerContainer.style.height = '42px';
      
      const pulseRing = document.createElement('div');
      pulseRing.className = 'pulse-ring';
      pulseRing.style.position = 'absolute';
      pulseRing.style.width = '100%';
      pulseRing.style.height = '100%';
      pulseRing.style.borderRadius = '50%';
      pulseRing.style.backgroundColor = '#FF9800';
      pulseRing.style.opacity = '0.6';
      pulseRing.style.animation = 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite';
      
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.position = 'absolute';
      markerElement.style.top = '6px';
      markerElement.style.left = '6px';
      markerElement.style.width = '30px';
      markerElement.style.height = '30px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = '#FF9800';
      markerElement.style.border = '3px solid white';
      markerElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      markerElement.style.cursor = 'pointer';
      markerElement.style.display = 'flex';
      markerElement.style.justifyContent = 'center';
      markerElement.style.alignItems = 'center';
      markerElement.style.color = 'white';
      markerElement.style.fontWeight = 'bold';
      markerElement.style.fontSize = '14px';
      markerElement.style.zIndex = '2';
      
      markerElement.innerHTML = `<span>₹${profit}</span>`;
      
      markerContainer.appendChild(pulseRing);
      markerContainer.appendChild(markerElement);

      const marker = new mapboxgl.Marker(markerContainer)
        .setLngLat([hotspot.longitude, hotspot.latitude])
        .addTo(map.current!);
        
      marker.getElement().addEventListener('click', () => {
        setSelectedHotspot(hotspot);
        displayRoute(hotspot);
      });
        
      return marker;
    });
    
    setMarkers(newMarkers);
    
    if (!document.getElementById('pulse-animation')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'pulse-animation';
      styleElement.textContent = `
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    const hotspotFeatures = hotspots.map(hotspot => {
      const profit = calculateProfit(hotspot);
      
      return {
        type: 'Feature',
        properties: {
          name: hotspot.name,
          description: hotspot.description,
          demand_score: hotspot.demand_score,
          distance: hotspot.distance,
          duration: hotspot.duration,
          estimated_profit: profit
        },
        geometry: {
          type: 'Point',
          coordinates: [hotspot.longitude, hotspot.latitude]
        }
      } as Feature<Point, HotspotProperties>;
    });
    
    const source = map.current.getSource('hotspots');
    
    if (source) {
      (source as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: hotspotFeatures
      });
    } else if (hotspotFeatures.length > 0) {
      map.current.addSource('hotspots', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: hotspotFeatures
        }
      });
      
      map.current.addLayer({
        id: 'hotspots-label',
        type: 'symbol',
        source: 'hotspots',
        layout: {
          'text-field': ['to-string', ['get', 'name']],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-offset': [0, 2.5],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-ignore-placement': false
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 2
        }
      });
    }
  };

  const displayRoute = async (hotspot: PlacePrediction) => {
    if (!map.current) return;
    
    setIsLoadingRoute(true);
    setRouteInfo(null);
    
    try {
      ['route-line', 'route-casing', 'route-outline', 'route-arrow'].forEach(layer => {
        if (map.current && map.current.getLayer(layer)) {
          map.current.removeLayer(layer);
        }
      });
      
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
      
      console.log('Getting route from Vijarahalli to', hotspot.name);
      
      const routeDetails = await getRouteDetails(
        VIJARAHALLI_LOCATION,
        { latitude: hotspot.latitude, longitude: hotspot.longitude }
      );
      
      console.log('Route details received:', {
        distance: routeDetails.distance,
        duration: routeDetails.duration,
        geometryAvailable: !!routeDetails.geometry
      });
      
      setRouteInfo({
        distance: routeDetails.distance,
        duration: routeDetails.duration
      });
      
      hotspot.distance = routeDetails.distance;
      hotspot.duration = routeDetails.duration;
      
      if (routeDetails.geometry) {
        try {
          const parsedGeometry = JSON.parse(routeDetails.geometry);
          
          if (!parsedGeometry || !parsedGeometry.coordinates || parsedGeometry.coordinates.length === 0) {
            throw new Error('Invalid route geometry data');
          }
          
          console.log('Valid route geometry with', parsedGeometry.coordinates.length, 'points');
          
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: parsedGeometry
            }
          });
          
          map.current.addLayer({
            id: 'route-outline',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#000',
              'line-opacity': 0.5,
              'line-width': 9
            }
          });
          
          map.current.addLayer({
            id: 'route-casing',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#fff',
              'line-width': 7
            }
          });
          
          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#4285F4',
              'line-width': 5
            }
          });
          
          map.current.addLayer({
            id: 'route-arrow',
            type: 'symbol',
            source: 'route',
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 100,
              'icon-image': 'arrow-icon',
              'icon-size': 0.5,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'symbol-sort-key': 1
            }
          });
          
          if (!map.current.hasImage('arrow-icon')) {
            const size = 20;
            const arrowIcon: ArrowIcon = {
              width: size,
              height: size,
              data: new Uint8ClampedArray(size * size * 4),
              context: null,
              
              onAdd: function() {
                const canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                this.context = canvas.getContext('2d');
              },
              
              render: function() {
                const context = this.context;
                if (!context) return false;
                
                context.clearRect(0, 0, this.width, this.height);
                
                context.beginPath();
                context.moveTo(2, 10);
                context.lineTo(18, 10);
                context.lineWidth = 2;
                context.strokeStyle = '#4285F4';
                context.stroke();
                
                context.beginPath();
                context.moveTo(18, 10);
                context.lineTo(14, 6);
                context.lineTo(14, 14);
                context.closePath();
                context.fillStyle = '#4285F4';
                context.fill();
                
                this.data = context.getImageData(0, 0, this.width, this.height).data;
                return true;
              }
            };
            
            map.current.addImage('arrow-icon', arrowIcon as any, { pixelRatio: 2 });
          }
          
          const bounds = new mapboxgl.LngLatBounds();
          
          bounds.extend([VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude]);
          
          bounds.extend([hotspot.longitude, hotspot.latitude]);
          
          parsedGeometry.coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
          
          map.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 350 },
            maxZoom: 15,
            duration: 1000
          });
          
          updatePopupWithRouteInfo(hotspot);
        } catch (error) {
          console.error('Error parsing route geometry:', error);
          fallbackRouteDisplay(hotspot);
        }
      } else {
        console.error('No route geometry available');
        fallbackRouteDisplay(hotspot);
      }
    } catch (error) {
      console.error('Error displaying route:', error);
      fallbackRouteDisplay(hotspot);
    } finally {
      setIsLoadingRoute(false);
    }
  };
  
  const fallbackRouteDisplay = (hotspot: PlacePrediction) => {
    if (!map.current) return;
    
    try {
      const routeGeometry: GeoJSON.LineString = {
        type: "LineString",
        coordinates: [
          [VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude],
          [hotspot.longitude, hotspot.latitude]
        ]
      };
      
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: routeGeometry
        }
      });
      
      map.current.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2c3e50',
          'line-width': 8,
          'line-opacity': 0.6,
          'line-dasharray': [0, 2]
        }
      });
      
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#4285F4',
          'line-width': 5,
          'line-opacity': 0.8,
          'line-dasharray': [0, 2, 1]
        }
      });
      
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude]);
      bounds.extend([hotspot.longitude, hotspot.latitude]);
      
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 350 },
        maxZoom: 15,
        duration: 1000
      });
      
      updatePopupWithRouteInfo(hotspot);
    } catch (fallbackError) {
      console.error('Error displaying fallback route:', fallbackError);
    }
  };

  const updatePopupWithRouteInfo = (hotspot: PlacePrediction) => {
    if (!map.current) return;
    
    if (popupRef.current) {
      popupRef.current.remove();
    }
    
    const demandScore = hotspot.demand_score;
    const demandPercent = Math.round(demandScore * 100);
    const demandLevel = getDemandLevel(demandScore);
    
    const surgeMultiplier = getSurgeMultiplierFromDemand(demandScore);
    const fare = calculateEstimatedFare(hotspot.distance, hotspot.duration, surgeMultiplier);
    const profit = calculateDriverProfit(fare, hotspot.distance);
    
    popupRef.current = new mapboxgl.Popup({ offset: [0, -15], closeOnClick: false, maxWidth: '300px' })
      .setLngLat([hotspot.longitude, hotspot.latitude])
      .setHTML(`
        <div style="font-family: Arial, sans-serif; padding: 12px; max-width: 280px;">
          <h3 style="margin: 0 0 8px 0; color: #FF9800; font-weight: bold; font-size: 16px;">${hotspot.name}</h3>
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${hotspot.description}</p>
          <div style="display: flex; align-items: center; margin-top: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #FF9800; margin-right: 8px;"></div>
            <p style="margin: 0; font-weight: bold; color: #FF9800;">${demandLevel} Demand: ${demandPercent}%</p>
          </div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">Optimal Route from Vijarahalli:</p>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
              <span>Distance: ${hotspot.distance.toFixed(1)} km</span>
              <span>ETA: ${Math.round(hotspot.duration)} min</span>
            </div>
            <div style="background-color: #FFF3E0; padding: 8px; border-radius: 6px; margin-top: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 13px; font-weight: bold;">Estimated Fare:</span>
                <span style="font-size: 13px;">₹${fare}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
                <span style="font-size: 14px; font-weight: bold; color: #E65100;">Estimated Profit:</span>
                <span style="font-size: 14px; font-weight: bold; color: #E65100;">₹${profit}</span>
              </div>
              ${surgeMultiplier > 1.15 ? `<div style="font-size: 11px; color: #E53935; text-align: right; margin-top: 4px;">Includes ${Math.round((surgeMultiplier-1)*100)}% surge pricing</div>` : ''}
            </div>
          </div>
        </div>
      `)
      .addTo(map.current);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [driverLocation.lng, driverLocation.lat],
      zoom: zoom,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    const vijarahalliMarkerElement = document.createElement('div');
    vijarahalliMarkerElement.className = 'vijarahalli-marker';
    vijarahalliMarkerElement.style.width = '25px';
    vijarahalliMarkerElement.style.height = '25px';
    vijarahalliMarkerElement.style.borderRadius = '50%';
    vijarahalliMarkerElement.style.backgroundColor = '#3498db';
    vijarahalliMarkerElement.style.border = '3px solid white';
    vijarahalliMarkerElement.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    
    const vijarahalliMarker = new mapboxgl.Marker(vijarahalliMarkerElement)
      .setLngLat([VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div style="padding: 8px; font-family: Arial, sans-serif;">
          <strong>Vijarahalli</strong><br/>
          <span style="font-size: 12px;">Your current location</span>
        </div>
      `))
      .addTo(map.current);

    const size = 200;
    
    const pulsingDot: PulsingDot = {
      width: size,
      height: size,
      data: new Uint8ClampedArray(size * size * 4),
      context: null,
      
      onAdd: function() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
      },
      
      render: function() {
        const duration = 1500;
        const t = (performance.now() % duration) / duration;
        
        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;
        
        if (!context) return true;
        
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(52, 152, 219, ${1 - t})`;
        context.fill();
        
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          radius,
          0,
          Math.PI * 2
        );
        context.fillStyle = 'rgba(52, 152, 219, 1)';
        context.strokeStyle = 'white';
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();
        
        this.data = context.getImageData(
          0,
          0,
          this.width,
          this.height
        ).data;
        
        return true;
      }
    };

    map.current.on('load', () => {
      map.current?.addImage('pulsing-dot', pulsingDot as any, { pixelRatio: 2 });
      
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
                coordinates: [VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude]
              }
            }
          ]
        }
      });
      
      map.current?.addLayer({
        id: 'layer-with-pulsing-dot',
        type: 'symbol',
        source: 'dot-point',
        layout: {
          'icon-image': 'pulsing-dot',
          'icon-allow-overlap': true
        }
      });

      map.current?.addSource('vijarahalli-label', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            name: 'Vijarahalli (Current Location)'
          },
          geometry: {
            type: 'Point',
            coordinates: [VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude]
          }
        }
      });
      
      map.current?.addLayer({
        id: 'vijarahalli-text',
        type: 'symbol',
        source: 'vijarahalli-label',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-offset': [0, -2],
          'text-anchor': 'bottom'
        },
        paint: {
          'text-color': '#3498db',
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 2
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    updateMapHotspots();
  }, [hotspots]);

  const flyToHotspot = (hotspot: PlacePrediction) => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: [hotspot.longitude, hotspot.latitude],
      zoom: 14,
      speed: 1.8,
      essential: true
    });
    
    setSelectedHotspot(hotspot);
    
    displayRoute(hotspot);
  };

  return (
    <div className="w-full h-full relative rounded-3xl shadow-inner">
      <div ref={mapContainer} className="w-full h-full rounded-3xl"/>
      
      {loading && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded shadow z-10">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2"></div>
            <span>Predicting hotspots...</span>
          </div>
        </div>
      )}
      
      {isLoadingRoute && (
        <div className="absolute top-16 left-4 bg-white p-2 rounded shadow z-10">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span>Calculating optimal route...</span>
          </div>
        </div>
      )}
      
      <button 
        className="absolute bottom-24 right-4 bg-white p-2 rounded-full shadow-md z-10 hover:bg-gray-100"
        onClick={() => {
          if (!map.current) return;
          map.current.flyTo({
            center: [VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude],
            zoom: 13,
            speed: 1.5
          });
        }}
        title="Return to Vijarahalli"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </button>
      
      {/* Hotspot predictions sidebar - only shown when hotspots are available */}
      {hotspots.length > 0 && (
        <div className="absolute top-4 right-4 bottom-4 bg-white rounded-xl shadow-lg z-10 w-72 overflow-hidden flex flex-col" style={{ maxWidth: '30%' }}>
          <div className="bg-orange-600 text-white py-3 px-4">
            <h3 className="font-bold text-lg">Demand Hotspots</h3>
            <p className="text-xs text-orange-100">Nearest high-demand areas from Vijarahalli</p>
          </div>
          
          <div className="flex-1 overflow-auto p-3">
            <div className="space-y-3">
              {hotspots.map((hotspot, index) => {
                const isSelected = selectedHotspot === hotspot;
                const demandScore = Math.round(hotspot.demand_score * 100);
                const demandLevel = getDemandLevel(hotspot.demand_score);
                const profit = calculateProfit(hotspot);
                
                return (
                  <div 
                    key={index} 
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all
                      ${isSelected ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'} 
                    `}
                    onClick={() => flyToHotspot(hotspot)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-800">{hotspot.name}</div>
                      <div 
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: '#FFF3E0', 
                          color: '#FF9800' 
                        }}
                      >
                        {demandScore}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{hotspot.description}</div>
                    <div className="flex items-center mt-2">
                      <div className="h-1.5 w-1.5 rounded-full mr-1.5" style={{ backgroundColor: '#FF9800' }}></div>
                      <span className="text-xs" style={{ color: '#FF9800' }}>{demandLevel} Demand</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>{hotspot.distance.toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>{Math.round(hotspot.duration)} min</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 bg-orange-50 p-2 rounded-md flex justify-between items-center">
                        <span className="text-xs font-medium text-orange-800">Est. Profit:</span>
                        <span className="text-sm font-bold text-orange-600">₹{profit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;