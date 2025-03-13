'use client';

import React, { useState, useEffect } from 'react';
import { Bell, MapPin, AlertCircle, Car, Clock } from 'lucide-react';
import Classification from '@/utils/classification';

interface RideNotification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'Premium' | 'Express' | 'Standard' | 'Economy';
  pickup: string;
  destination: string;
  fare: number;
  currency: string;
  expiresIn: number; // in seconds
}

const NotificationsTabPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<RideNotification[]>([
    {
      id: 1,
      title: "New Ride Request",
      message: "You have a new Standard ride request",
      time: new Date().toLocaleTimeString(),
      type: "Standard",
      pickup: "Indiranagar",
      destination: "Koramangala",
      fare: 240,
      currency: "₹",
      expiresIn: 60
    }
  ]);
  
  // Simulate live notifications arriving
  useEffect(() => {
    // First simulation after 5 seconds
    const firstTimer = setTimeout(() => {
      const newNotification: RideNotification = {
        id: Date.now(),
        title: "New Ride Request",
        message: "You have a new Premium ride request",
        time: new Date().toLocaleTimeString(),
        type: "Premium",
        pickup: "Koramangala",
        destination: "Whitefield",
        fare: 580,
        currency: "₹",
        expiresIn: 45
      };
      
      // Add notification with sound effect
      setNotifications(prev => [newNotification, ...prev]);
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
      
    }, 5000);
    
    // Second simulation after 12 seconds
    const secondTimer = setTimeout(() => {
      const newNotification: RideNotification = {
        id: Date.now(),
        title: "New Ride Request",
        message: "You have a new Express ride request",
        time: new Date().toLocaleTimeString(),
        type: "Express",
        pickup: "MG Road",
        destination: "Airport",
        fare: 750,
        currency: "₹",
        expiresIn: 30
      };
      
      // Add notification with sound effect
      setNotifications(prev => [newNotification, ...prev]);
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
      
    }, 12000);
    
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, []);
  
  // Update expiry countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          expiresIn: Math.max(0, notification.expiresIn - 1)
        })).filter(notification => notification.expiresIn > 0)
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to get appropriate styling based on notification type
  const getNotificationStyle = (type: string) => {
    switch(type) {
      case 'Premium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'Express':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'Economy':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };
  
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-6 text-slate-800">Ride Requests</h3>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Bell size={32} className="mx-auto text-slate-400 mb-4" />
          <p>No active ride requests</p>
          <p className="text-sm mt-2">New requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-lg shadow-md border transition-all hover:shadow-lg ${getNotificationStyle(notification.type)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex space-x-3">
                  <div className="bg-white rounded-full p-2 flex-shrink-0 shadow-sm">
                    <Bell size={16} className={`
                      ${notification.type === 'Premium' ? 'text-yellow-600' : 
                        notification.type === 'Express' ? 'text-blue-600' : 
                        notification.type === 'Economy' ? 'text-green-600' : 'text-slate-600'}
                    `} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-bold text-slate-800">{notification.title}</p>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold
                        ${notification.type === 'Premium' ? 'bg-yellow-200 text-yellow-800' : 
                          notification.type === 'Express' ? 'bg-blue-200 text-blue-800' : 
                          notification.type === 'Economy' ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-800'}
                      `}>
                        {notification.type}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm">{notification.time}</span>
                  <span className="text-xs mt-2 font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
                    <Clock size={12} className="mr-1" />
                    Expires: {notification.expiresIn}s
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/60 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-emerald-600" />
                    <div>
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="font-medium text-sm">{notification.pickup}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-red-600" />
                    <div>
                      <p className="text-xs text-slate-500">Destination</p>
                      <p className="font-medium text-sm">{notification.destination}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Car size={14} className="text-slate-600" />
                    <div>
                      <p className="text-xs text-slate-500">Fare</p>
                      <p className="font-medium text-sm">{notification.currency}{notification.fare}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-white text-slate-800 font-semibold py-2 rounded-lg text-sm shadow-sm hover:shadow-md transition-all border border-slate-200">
                  View Details
                </button>
                <button className={`font-semibold py-2 rounded-lg text-sm shadow-sm hover:shadow-md transition-all text-white
                  ${notification.type === 'Premium' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                    notification.type === 'Express' ? 'bg-blue-600 hover:bg-blue-700' : 
                    notification.type === 'Economy' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'}
                `}>
                  Accept Ride
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Classification Component for Testing */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <h3 className="text-xl font-bold mb-4 text-slate-800">Ride Classification System</h3>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Classification />
        </div>
      </div>
    </div>
  );
};

export default NotificationsTabPanel; 