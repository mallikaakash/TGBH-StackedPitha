'use client';

import React from 'react';
import { User, Star, FileText, Bell } from 'lucide-react';
import Map from '@/components/Map';

interface ProfileTabPanelProps {
  center: [number, number];
}

const ProfileTabPanel: React.FC<ProfileTabPanelProps> = ({ center }) => {
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4 text-slate-800">Driver Profile</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center space-x-6">
          <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center shadow-sm">
            <User size={32} className="text-blue-600" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-800">John Doe</h4>
            <p className="text-sm text-slate-600 mt-1">Driver ID: #12345</p>
            <div className="flex items-center mt-2 space-x-1">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              <span className="font-medium">4.8</span>
              <span className="text-slate-500 text-xs">(1,234 reviews)</span>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Star size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Rating</p>
                <p className="text-lg font-bold text-slate-800">4.8/5.0</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Total Rides</p>
                <p className="text-lg font-bold text-slate-800">1,234</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Map center={center} zoom={0} />
              <div>
                <p className="text-xs text-slate-500">Total Distance</p>
                <p className="text-lg font-bold text-slate-800">8,567 km</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Acceptance Rate</p>
                <p className="text-lg font-bold text-slate-800">95%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTabPanel; 