'use client';

import React, { useState } from 'react';
import { Bell, User, Star, FileText, RefreshCw, MapPin, Circle } from 'lucide-react';
import { Tab } from '@headlessui/react';
import Map from '@/components/Map';

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
                <Map center={center} zoom={13} />
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
                <div className="flex h-[calc(100vh-12rem)]">
                  <div className="w-3/4 p-4">
                    <div className="h-full rounded-lg overflow-hidden shadow-sm border border-slate-200">
                      <Map center={center} zoom={13} />
                    </div>
                  </div>
                  <div className="w-1/4 bg-slate-50 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Available Rides</h3>
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 rounded-full bg-white shadow-sm hover:bg-blue-50 transition-colors">
                          <RefreshCw size={14} className="text-blue-600" />
                        </button>
                        <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {rideRequests.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
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
                    </div>
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-slate-800">Notifications</h3>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div className="flex space-x-3">
                            <div className="bg-blue-50 rounded-full p-2 flex-shrink-0">
                              <Bell size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{notification.title}</p>
                              <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel>
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
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;