'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MapPin, AlertCircle, Car, Clock, DollarSign, Zap, Award, Info, User } from 'lucide-react';
import { RideType, processRideRequest } from '@/utils/classification';

// This interface should match the one in classification.tsx
interface RideNotification {
  ride_id: string;
  driver_id: string;
  pickup: string;
  destination: string;
  ride_type: string;
  display_name: string;
  estimated_fare: number;
  estimated_profit: number;
  compatibility_score: number;
  compatibility_reason: string; // Simple explanation of why this ride matches the driver
  incentives: {
    total: number;
    fare_component: number;
    points_component: number;
    points_earned: number;
    breakdown: {
      surgePrice: number; // Only using surge pricing now
    }
  };
  message: string;
  timestamp: Date;
  expiry?: Date;
  classification_reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'started' | 'completed';
}

// Simple tooltip component
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block" 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 w-64">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

const NotificationsTabPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<RideNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Initialize the audio element for notifications
    audioRef.current = new Audio('/notification.mp3');
    
    // Initialize with a default notification
    const initializeNotifications = async () => {
      try {
        const initialNotification = await processRideRequest("1234", "24680");
        setNotifications([initialNotification as unknown as RideNotification]);
        setTotalPoints(initialNotification.incentives.points_earned);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing notifications:", error);
        setLoading(false);
      }
    };
    
    initializeNotifications();
    
    // First simulation after 5 seconds
    const firstTimer = setTimeout(async () => {
      try {
        const newNotification = await processRideRequest("5678", "12345");
        setNotifications(prev => [...prev, newNotification as unknown as RideNotification]);
        setTotalPoints(prev => prev + newNotification.incentives.points_earned);
        
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
      } catch (error) {
        console.error("Error processing ride request:", error);
      }
    }, 5000);
    
    // Second simulation after 12 seconds
    const secondTimer = setTimeout(async () => {
      try {
        const newNotification = await processRideRequest("9876", "67890");
        setNotifications(prev => [...prev, newNotification as unknown as RideNotification]);
        setTotalPoints(prev => prev + newNotification.incentives.points_earned);
        
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
      } catch (error) {
        console.error("Error processing ride request:", error);
      }
    }, 12000);
    
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, []);
  
  // Update expiry countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      setNotifications(prev => 
        prev.map(notification => {
          if (notification.expiry && notification.expiry < now && notification.status === 'pending') {
            return { ...notification, status: 'rejected' };
          }
          return notification;
        })
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getTimeRemaining = (expiry?: Date): number => {
    if (!expiry) return 0;
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };
  
  const updateNotificationStatus = (id: string, status: 'accepted' | 'rejected' | 'started' | 'completed') => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.ride_id === id ? {...notif, status} : notif
      );
      
      // If ride is completed, add the points to the total
      if (status === 'completed') {
        const completedRide = prev.find(notif => notif.ride_id === id);
        if (completedRide) {
          setTotalPoints(current => current + completedRide.incentives.points_earned);
        }
      }
      
      return updated;
    });
  };
  
  const getNotificationStyle = (type: string) => {
    if (type.startsWith('HD_')) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (type.startsWith('MD_')) {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else if (type.startsWith('LD_')) {
      return 'bg-green-50 border-green-200 text-green-800';
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };
  
  const getIconColor = (type: string) => {
    if (type.startsWith('HD_')) {
      return 'text-red-600';
    } else if (type.startsWith('MD_')) {
      return 'text-blue-600';
    } else if (type.startsWith('LD_')) {
      return 'text-green-600';
    } else {
      return 'text-slate-600';
    }
  };
  
  const getBadgeStyle = (type: string) => {
    if (type.startsWith('HD_')) {
      return 'bg-red-200 text-red-800';
    } else if (type.startsWith('MD_')) {
      return 'bg-blue-200 text-blue-800';
    } else if (type.startsWith('LD_')) {
      return 'bg-green-200 text-green-800';
    } else {
      return 'bg-slate-200 text-slate-800';
    }
  };
  
  const getButtonStyle = (type: string) => {
    if (type.startsWith('HD_')) {
      return 'bg-red-600 hover:bg-red-700';
    } else if (type.startsWith('MD_')) {
      return 'bg-blue-600 hover:bg-blue-700';
    } else if (type.startsWith('LD_')) {
      return 'bg-green-600 hover:bg-green-700';
    } else {
      return 'bg-slate-600 hover:bg-slate-700';
    }
  };
  
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>;
      case 'accepted':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Accepted</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Rejected</span>;
      case 'started':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">In Progress</span>;
      case 'completed':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Completed</span>;
      default:
        return null;
    }
  };
  
  const renderCompatibilityScore = (score: number) => {
    let color = "";
    let label = "";
    
    if (score >= 80) {
      color = "bg-green-500";
      label = "Excellent Match";
    } else if (score >= 60) {
      color = "bg-blue-500";
      label = "Good Match";
    } else if (score >= 40) {
      color = "bg-yellow-500";
      label = "Fair Match";
    } else {
      color = "bg-red-500";
      label = "Poor Match";
    }
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color}`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <span className="text-xs font-semibold whitespace-nowrap">
          {score}% - {label}
        </span>
      </div>
    );
  };
  
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800">Ride Requests</h3>
        <div className="bg-indigo-100 px-3 py-2 rounded-lg flex items-center">
          <Award size={16} className="text-indigo-600 mr-2" />
          <div>
            <p className="text-xs text-indigo-800">Reward Points</p>
            <p className="font-bold text-indigo-600">{totalPoints} pts</p>
          </div>
          <Tooltip text="Earn 1 point for every ₹10 of incentive. Accumulate 10 points for 1 day free subscription.">
            <Info size={14} className="ml-2 text-indigo-400 cursor-help" />
          </Tooltip>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-slate-500">Loading ride requests...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-slate-500">
          <Bell size={24} className="mx-auto text-slate-400 mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base">No active ride requests</p>
          <p className="text-xs sm:text-sm mt-2">New requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.ride_id} 
              className={`p-3 sm:p-4 rounded-lg shadow-md border transition-all hover:shadow-lg ${getNotificationStyle(notification.ride_type)}`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto mb-2 sm:mb-0">
                  <div className="bg-white rounded-full p-1.5 sm:p-2 flex-shrink-0 shadow-sm">
                    <Bell size={14} className={getIconColor(notification.ride_type)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-sm sm:text-base text-slate-800">New Ride Request</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getBadgeStyle(notification.ride_type)}`}>
                        {notification.display_name}
                      </span>
                      {renderStatusBadge(notification.status)}
                    </div>
                    <p className="text-xs sm:text-sm mt-1">{notification.classification_reason}</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                  <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                  
                  {notification.status === 'pending' && notification.expiry && (
                    <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
                      <Clock size={12} className="mr-1" />
                      {getTimeRemaining(notification.expiry)}s
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-white/60 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-emerald-600" />
                    <div>
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="font-medium text-xs sm:text-sm">{notification.pickup}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-red-600" />
                    <div>
                      <p className="text-xs text-slate-500">Destination</p>
                      <p className="font-medium text-xs sm:text-sm">{notification.destination}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Tooltip text="Total fare amount charged to the customer, including all incentives and demand-based pricing.">
                      <div className="flex items-center">
                        <Zap size={14} className="text-green-600" />
                        <div className="ml-2">
                          <p className="text-xs text-slate-500 flex items-center">
                            Fare <Info size={10} className="ml-1 text-slate-400" />
                          </p>
                          <p className="font-medium text-xs sm:text-sm">₹{notification.estimated_fare}</p>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="bg-white/60 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Tooltip text="Your estimated profit after deducting platform fee (20%) and fuel costs based on vehicle type and distance.">
                      <div className="flex items-center">
                        <Award size={14} className="text-indigo-600" />
                        <div className="ml-2">
                          <p className="text-xs text-slate-500 flex items-center">
                            Your Profit <Info size={10} className="ml-1 text-slate-400" />
                          </p>
                          <p className="font-medium text-xs sm:text-sm">₹{notification.estimated_profit}</p>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
              
              {/* Driver compatibility section */}
              <div className="bg-green-50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 flex items-center">
                    <User size={12} className="mr-1 text-green-600" />
                    Driver Match
                  </p>
                  {renderCompatibilityScore(notification.compatibility_score)}
                </div>
                <p className="text-xs text-gray-700 mt-1">{notification.compatibility_reason}</p>
              </div>
              
              {/* Incentives breakdown with tooltips */}
              <div className="bg-indigo-50 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-indigo-700 flex items-center">
                    <Zap size={14} className="text-indigo-600 mr-1" />
                    <Tooltip text="Extra earnings added to your fare based on demand">
                      <div className="flex items-center">
                        Surge Pricing: ₹{notification.incentives.total}
                        <Info size={10} className="ml-1 text-indigo-400" />
                      </div>
                    </Tooltip>
                  </h4>
                  
                  <div className="flex items-center gap-1 text-xs bg-indigo-100 px-2 py-1 rounded-full">
                    <Award size={12} className="text-indigo-600" />
                    <span>+{notification.incentives.points_earned} pts</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <Tooltip text="Amount added directly to your fare (75% of surge)">
                      <span className="text-gray-600 flex items-center">
                        Added to fare <Info size={10} className="ml-1 text-gray-400" />
                      </span>
                    </Tooltip>
                    <span className="font-medium">₹{notification.incentives.fare_component}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <Tooltip text="Each 10 rupees of surge gives you 1 reward point (rounded if >0.5)">
                      <span className="text-gray-600 flex items-center">
                        Points earned <Info size={10} className="ml-1 text-gray-400" />
                      </span>
                    </Tooltip>
                    <span className="font-medium">{notification.incentives.points_earned} pts</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              {notification.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => updateNotificationStatus(notification.ride_id, 'rejected')}
                    className="bg-white text-slate-800 font-semibold py-2 rounded-lg text-xs sm:text-sm shadow-sm hover:shadow-md active:scale-95 transition-all border border-slate-200"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => updateNotificationStatus(notification.ride_id, 'accepted')}
                    className={`font-semibold py-2 rounded-lg text-xs sm:text-sm shadow-sm hover:shadow-md active:scale-95 transition-all text-white ${getButtonStyle(notification.ride_type)}`}
                  >
                    Accept Ride
                  </button>
                </div>
              )}
              
              {notification.status === 'accepted' && (
                <button 
                  onClick={() => updateNotificationStatus(notification.ride_id, 'started')}
                  className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg text-xs sm:text-sm shadow-sm hover:shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Start Ride
                </button>
              )}
              
              {notification.status === 'started' && (
                <button 
                  onClick={() => updateNotificationStatus(notification.ride_id, 'completed')}
                  className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg text-xs sm:text-sm shadow-sm hover:shadow-md hover:bg-purple-700 active:scale-95 transition-all"
                >
                  Complete Ride
                </button>
              )}
              
              {(notification.status === 'completed' || notification.status === 'rejected') && (
                <div className="text-center py-2 text-slate-500 text-xs sm:text-sm">
                  {notification.status === 'completed' ? 'Ride completed successfully' : 'Ride request declined'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTabPanel;
