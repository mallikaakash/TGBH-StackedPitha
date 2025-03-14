'use client';

import React from 'react';
import { Circle, MapPin, RefreshCw, Star } from 'lucide-react';
import Map from '@/components/Map';

interface RideRequest {
  id: number;
  pickup: string;
  dropoff: string;
  distance: string;
  estimatedFare: string;
  time: string;
}

interface MapTabPanelProps {
  rideRequests: RideRequest[];
  center: [number, number];
}

const MapTabPanel: React.FC<MapTabPanelProps> = ({ rideRequests, center }) => {
  return (
    <div className="flex h-[calc(100vh-12rem)]">
      <div className="w-3/4 p-4">
        <div className="h-full rounded-lg overflow-hidden shadow-sm border border-slate-200">
          <Map center={center} zoom={13} />
        </div>
      </div>
      <div className="w-1/4 bg-slate-50 p-4 overflow-y-auto">
        {/* <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Available Rides</h3>
          <div className="flex items-center space-x-2">
            <button className="p-1.5 rounded-full bg-white shadow-sm hover:bg-blue-50 transition-colors">
              <RefreshCw size={14} className="text-blue-600" />
            </button>
            <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {rideRequests.length}
            </span>
          </div>
        </div> */}
        {/* <div className="space-y-3">
          {rideRequests.map((ride) => (
            <div key={ride.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Circle size={8} fill="#10b981" stroke="none" />
                    <p className="font-medium text-slate-800">{ride.pickup}</p>
                  </div>
                  <div className="pl-1 ml-3 border-l-2 border-dashed border-slate-300 h-6"></div>
                  <div className="flex items-center gap-2">
                    <MapPin size={8} className="text-blue-600" />
                    <p className="font-medium text-slate-600">{ride.dropoff}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-blue-600 font-bold">{ride.estimatedFare}</span>
                  <span className="text-xs text-slate-500 mt-1">{ride.distance}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                  {ride.time}
                </span>
                <div className="flex items-center space-x-1">
                  <Star size={12} className="text-amber-500" fill="currentColor" />
                  <span className="text-xs text-slate-600">4.8</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Accept
                </button>
                <button className="border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default MapTabPanel; 