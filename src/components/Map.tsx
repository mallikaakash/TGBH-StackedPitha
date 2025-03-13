'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Point, Feature } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWFrYXNobWFsbGlrIiwiYSI6ImNtODc5cHZ0aDBlZjMyaXNlcGc3aXk5ZGMifQ.xYguCB_TJiuP55uWMAvUNA';

interface MapProps {
  center: [number, number];
  zoom: number;
}

interface HeatmapFeatureProperties {
  intensity: number;
}

const Map: React.FC<MapProps> = ({ center, zoom }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    // Add navigation controls with improved positioning
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
    
    // Add attribution control in a less obtrusive position
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // Add current location marker
    const currentLocationMarker = new mapboxgl.Marker({
      color: '#FF6B00',
      draggable: false
    })
      .setLngLat(center)
      .addTo(map.current);

    // Add a pulsing dot effect for the current location
    const size = 200;
    interface PulsingDot {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      context: CanvasRenderingContext2D | null;
      onAdd: () => void;
      render: () => boolean;
    }

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
        if (!this.context) return false;
        
        const duration = 1500;
        const t = (performance.now() % duration) / duration;
        
        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;
        
        // Draw the outer circle
        context.clearRect(0, 0, this.width, this.height);
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
        
        // Draw the inner circle
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
        
        // Update this image's data with data from the canvas
        this.data = context.getImageData(
          0,
          0,
          this.width,
          this.height
        ).data;
        
        // Continuously repaint the map, resulting in the smooth animation
        map.current?.triggerRepaint();
        
        // Return `true` to let the map know that the image was updated
        return true;
      }
    };

    // Add heatmap layer
    map.current.on('load', () => {
      // Sample heatmap data for Bangalore with more realistic points
      const heatmapData: FeatureCollection<Point, HeatmapFeatureProperties> = {
        type: 'FeatureCollection',
        features: [
          // Central Business District - high demand
          {
            type: 'Feature',
            properties: { intensity: 0.9 },
            geometry: {
              type: 'Point',
              coordinates: [77.5946, 12.9716] // MG Road area
            }
          },
          {
            type: 'Feature',
            properties: { intensity: 0.9 },
            geometry: {
              type: 'Point',
              coordinates: [77.5950, 12.9720]
            }
          },
          {
            type: 'Feature',
            properties: { intensity: 0.85 },
            geometry: {
              type: 'Point',
              coordinates: [77.5960, 12.9710]
            }
          },
          // Indiranagar - popular area
          {
            type: 'Feature',
            properties: { intensity: 0.8 },
            geometry: {
              type: 'Point',
              coordinates: [77.6408, 12.9716]
            }
          },
          {
            type: 'Feature',
            properties: { intensity: 0.75 },
            geometry: {
              type: 'Point',
              coordinates: [77.6420, 12.9710]
            }
          },
          // Koramangala - tech hub
          {
            type: 'Feature',
            properties: { intensity: 0.85 },
            geometry: {
              type: 'Point',
              coordinates: [77.6268, 12.9249]
            }
          },
          {
            type: 'Feature',
            properties: { intensity: 0.8 },
            geometry: {
              type: 'Point',
              coordinates: [77.6280, 12.9260]
            }
          },
          // HSR Layout
          {
            type: 'Feature',
            properties: { intensity: 0.7 },
            geometry: {
              type: 'Point',
              coordinates: [77.6481, 12.9086]
            }
          },
          // Electronic City
          {
            type: 'Feature',
            properties: { intensity: 0.6 },
            geometry: {
              type: 'Point',
              coordinates: [77.6701, 12.8399]
            }
          },
          // Whitefield
          {
            type: 'Feature',
            properties: { intensity: 0.75 },
            geometry: {
              type: 'Point',
              coordinates: [77.7480, 12.9698]
            }
          },
          // Hebbal
          {
            type: 'Feature',
            properties: { intensity: 0.65 },
            geometry: {
              type: 'Point',
              coordinates: [77.5913, 13.0358]
            }
          },
          // Airport area
          {
            type: 'Feature',
            properties: { intensity: 0.85 },
            geometry: {
              type: 'Point',
              coordinates: [77.7064, 13.1989]
            }
          },
          // Jayanagar
          {
            type: 'Feature',
            properties: { intensity: 0.7 },
            geometry: {
              type: 'Point',
              coordinates: [77.5913, 12.9252]
            }
          },
          // Malleshwaram
          {
            type: 'Feature',
            properties: { intensity: 0.6 },
            geometry: {
              type: 'Point',
              coordinates: [77.5744, 13.0070]
            }
          },
          // Yelahanka
          {
            type: 'Feature',
            properties: { intensity: 0.5 },
            geometry: {
              type: 'Point',
              coordinates: [77.5961, 13.0992]
            }
          },
          // J.P. Nagar
          {
            type: 'Feature',
            properties: { intensity: 0.65 },
            geometry: {
              type: 'Point',
              coordinates: [77.5876, 12.9077]
            }
          }
        ]
      };

      // Custom pulsing dot image
      map.current?.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

      // Add source for the pulsing dot
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
                coordinates: center
              }
            }
          ]
        }
      });
      
      // Add layer for the pulsing dot
      map.current?.addLayer({
        id: 'layer-with-pulsing-dot',
        type: 'symbol',
        source: 'dot-point',
        layout: {
          'icon-image': 'pulsing-dot',
          'icon-allow-overlap': true
        }
      });

      // Add a source for the heatmap
      map.current?.addSource('heatmap-data', {
        type: 'geojson',
        data: heatmapData
      });

      // Add the heatmap layer
      map.current?.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-data',
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.5,
            15, 1.5
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(255, 246, 233, 0)',
            0.1, 'rgba(255, 230, 204, 0.4)',
            0.2, 'rgba(255, 215, 176, 0.6)',
            0.4, 'rgba(255, 175, 117, 0.7)',
            0.6, 'rgba(255, 140, 77, 0.8)',
            0.8, 'rgba(255, 107, 0, 0.9)',
            1, 'rgba(220, 80, 0, 1)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 10,
            12, 25,
            15, 40
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.9,
            15, 0.6
          ]
        }
      });

      // Add a layer showing the ride demand points
      map.current?.addLayer({
        id: 'demand-points',
        type: 'circle',
        source: 'heatmap-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 3,
            16, 8
          ],
          'circle-color': '#FF6B00',
          'circle-stroke-color': 'white',
          'circle-stroke-width': 1,
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 0,
            13, 1
          ]
        }
      });

      // Add click interaction for demand points
      map.current?.on('click', 'demand-points', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0] as unknown as Feature<Point, HeatmapFeatureProperties>;
        const coordinates = feature.geometry.coordinates as [number, number];
        const intensity = feature.properties?.intensity ?? 0;
        const demandLevel = intensity > 0.8 ? 'Very High' : 
                           intensity > 0.6 ? 'High' : 
                           intensity > 0.4 ? 'Moderate' : 'Low';
        
        // Create popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family: Arial, sans-serif; padding: 5px;">
              <h3 style="margin: 0; color: #FF6B00; font-weight: bold;">Demand Zone</h3>
              <p style="margin: 5px 0;">Demand Level: <strong>${demandLevel}</strong></p>
              <p style="margin: 5px 0;">Surge Multiplier: <strong>${(intensity * 2 + 1).toFixed(1)}x</strong></p>
            </div>
          `)
          .addTo(map.current!);
      });
      
      // Change cursor when hovering over demand points
      map.current?.on('mouseenter', 'demand-points', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current?.on('mouseleave', 'demand-points', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [center, zoom]);

  return (
    <div ref={mapContainer} className="w-full h-full rounded-3xl shadow-inner" />
  );
};

export default Map;