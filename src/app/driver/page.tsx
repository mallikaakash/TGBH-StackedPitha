'use client';

import React, { useState } from 'react';
import { Bell, User, Map } from 'lucide-react';
import { Tab } from '@headlessui/react';
import MapTabPanel from '@/components/MapTabPanel';
import NotificationsTabPanel from '@/components/NotificationsTabPanel';
import ProfileTabPanel from '@/components/ProfileTabPanel';

const DriverDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Ride Request',
      message: 'Estimated profit: ₹250',
      time: '2 min ago',
    },
    {
      id: 2,
      title: 'Surge Pricing Active', 
      message: '2.5x multiplier in your area',
      time: '5 min ago',
    },
    {
      id: 3,
      title: 'Weekly Earnings Update',
      message: 'You earned ₹8,450 last week',
      time: '1 day ago',
    },
  ]);

  const rideRequests = [
    {
      id: 1,
      pickup: 'MG Road',
      dropoff: 'Indiranagar',
      distance: '4.5 km',
      estimatedFare: '₹250',
      time: '5 min away',
    },
    {
      id: 2,
      pickup: 'Koramangala',
      dropoff: 'Whitefield',
      distance: '12.8 km',
      estimatedFare: '₹350',
      time: '8 min away',
    },
    {
      id: 3,
      pickup: 'Electronic City',
      dropoff: 'HSR Layout',
      distance: '9.2 km',
      estimatedFare: '₹320',
      time: '3 min away',
    },
  ];

  const center: [number, number] = [77.5946, 12.9716]; // Bangalore coordinates

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-violet-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-full p-2">
                <Map size={24} className="text-blue-600" />
              </div>
              <span className="text-white font-bold text-xl">RideSync</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-all duration-200">
                  <Bell size={18} className="text-white" />
                </button>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
              <div className="bg-white/10 rounded-full p-2 hover:bg-white/20 transition-all duration-200">
                <User size={18} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex bg-slate-100 p-1 gap-1">
              {[
                { icon: Map, text: "Map" },
                { icon: Bell, text: "Notifications" },
                { icon: User, text: "Profile" }
              ].map((item, index) => (
                <Tab key={index} className={({ selected }) =>
                  `w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                  ${selected 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:bg-white/60 hover:text-blue-500'}`
                }>
                  {/* <item.icon  /> */}
                  <span>{item.text}</span>
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <MapTabPanel rideRequests={rideRequests} center={center} />
              </Tab.Panel>
              <Tab.Panel>
                <NotificationsTabPanel notifications={notifications} />
              </Tab.Panel>
              <Tab.Panel>
                <ProfileTabPanel center={center} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;