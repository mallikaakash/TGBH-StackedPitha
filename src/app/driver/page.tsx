'use client';

import React, { useState } from 'react';
import { Bell, User, Map } from 'lucide-react';
import { Tab } from '@headlessui/react';
import MapTabPanel from '@/components/MapTabPanel';
import NotificationsTabPanel from '@/components/NotificationsTabPanel';
import ProfileTabPanel from '@/components/ProfileTabPanel';
import { VIJARAHALLI_LOCATION } from '@/services/modelService';

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

  // Vijarahalli coordinates - [longitude, latitude]
  const center: [number, number] = [VIJARAHALLI_LOCATION.longitude, VIJARAHALLI_LOCATION.latitude];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="text-xl font-bold text-blue-600">NammaYatri</div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-slate-500 hover:text-slate-600 hover:bg-slate-100">
                <Bell size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  D
                </div>
                <span className="font-medium text-slate-700">Driver</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                <MapTabPanel center={center} />
              </Tab.Panel>
              <Tab.Panel>
                <NotificationsTabPanel />
              </Tab.Panel>
              <Tab.Panel>
                <ProfileTabPanel />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;