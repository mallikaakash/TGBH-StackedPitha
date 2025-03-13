'use client';

import React, { useState } from 'react';
import { 
  User, Star, FileText, Bell, DollarSign, Calendar,
  MapPin, Settings, HelpCircle, Clock, Award, Truck,
  Check, AlertCircle, BarChart2, Repeat, CreditCard
} from 'lucide-react';
import Map from '@/components/Map';

interface DriverDashboardProps {
  center: [number, number];
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ center }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Mock data - would be fetched from API in a real implementation
  const driverData = {
    name: "Venkatesh Rao",
    id: "#BLR2345",
    rating: 4.7,
    reviews: 987,
    vehicle: {
      make: "TVS",
      model: "King", 
      year: "2021",
      regNumber: "KA 01 AB 5678"
    },
    earnings: {
      today: 950,
      week: 6200,
      month: 24500,
      pending: 850
    },
    trips: {
      total: 1567,
      today: 14,
      completed: 1498,
      cancelled: 15,
      acceptance: 96
    },
    distance: {
      total: 9876,
      today: 95
    },
    subscription: {
      active: true,
      expires: "Today, 11:59 PM",
      fee: 99,
      benefits: [
        "Priority bookings in tech parks",
        "Guaranteed min. earnings"
      ]
    },
    incentives: [
      {
        title: "Tech Park Bonus",
        description: "Complete 10 trips in Electronic City",
        reward: "₹200 bonus",
        progress: 6,
        total: 10
      },
      {
        title: "Daily Target", 
        description: "18 trips today",
        reward: "₹350 bonus",
        progress: 9,
        total: 18
      }
    ],
    recentTrips: [
      {
        id: "BLR-1234",
        time: "Today, 10:45 AM",
        from: "Koramangala",
        to: "Indiranagar",
        fare: 180,
        status: "Completed"
      },
      {
        id: "BLR-1233",
        time: "Today, 9:30 AM", 
        from: "HSR Layout",
        to: "Whitefield",
        fare: 320,
        status: "Completed"
      },
      {
        id: "BLR-1232",
        time: "Yesterday, 6:30 PM",
        from: "MG Road",
        to: "Marathahalli",
        fare: 250,
        status: "Completed"
      }
    ],
    notifications: [
      {
        title: "New incentive available",
        description: "Tech Park Bonus - earn extra ₹200",
        time: "2 hours ago",
        read: false
      },
      {
        title: "Document expiring soon",
        description: "Your auto permit expires in 20 days",
        time: "6 hours ago",
        read: true
      }
    ]
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Top Header with Balance Overview */}
      <div className="bg-blue-600 text-white p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Namaskara, {driverData.name}</h1>
            <p className="text-blue-100 text-sm">Auto ID: {driverData.id}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-blue-100 text-sm">Today's Earnings</p>
            <p className="text-2xl md:text-3xl font-bold">₹{driverData.earnings.today}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-500">Today's Trips</p>
              <p className="text-lg md:text-2xl font-bold text-slate-800">{driverData.trips.today}</p>
            </div>
            <FileText className="text-blue-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-500">Rating</p>
              <div className="flex items-center">
                <p className="text-lg md:text-2xl font-bold text-slate-800">{driverData.rating}</p>
                <Star size={14} className="text-amber-500 ml-1" fill="currentColor" />
              </div>
            </div>
            <Star className="text-blue-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-500">Acceptance</p>
              <p className="text-lg md:text-2xl font-bold text-slate-800">{driverData.trips.acceptance}%</p>
            </div>
            <Check className="text-blue-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-500">Distance Today</p>
              <p className="text-lg md:text-2xl font-bold text-slate-800">{driverData.distance.today} km</p>
            </div>
            <MapPin className="text-blue-600" size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          {/* Earnings Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Earnings Overview</h2>
              <select className="border border-slate-200 rounded-md p-2 text-sm w-full md:w-auto">
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs md:text-sm text-slate-600">Today</p>
                <p className="text-xl md:text-2xl font-bold text-slate-800">₹{driverData.earnings.today}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs md:text-sm text-slate-600">This Week</p>
                <p className="text-xl md:text-2xl font-bold text-slate-800">₹{driverData.earnings.week}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs md:text-sm text-slate-600">This Month</p>
                <p className="text-xl md:text-2xl font-bold text-slate-800">₹{driverData.earnings.month}</p>
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold text-slate-700 mb-3">Recent Earnings</h3>
              <div className="space-y-3">
                {driverData.recentTrips.map((trip) => (
                  <div key={trip.id} className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <p className="font-medium text-sm md:text-base text-slate-800">{trip.from} to {trip.to}</p>
                      <p className="text-xs text-slate-500">{trip.time}</p>
                    </div>
                    <p className="font-bold text-slate-800">₹{trip.fare}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trip Management */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Trip Management</h2>
              <button className="text-blue-600 text-sm font-medium">View All</button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-semibold text-slate-700 mb-3">Recent Trips</h3>
              <div className="space-y-3">
                {driverData.recentTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center bg-slate-50 rounded-lg p-3">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="font-medium text-sm text-slate-800 truncate">{trip.id}</p>
                        <p className="text-xs md:text-sm font-medium text-green-600 ml-2">{trip.status}</p>
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 truncate">{trip.from} → {trip.to}</p>
                      <p className="text-xs text-slate-500">{trip.time}</p>
                    </div>
                    <p className="font-bold text-slate-800 ml-4">₹{trip.fare}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-semibold text-slate-700 mb-3">Trip Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-base md:text-lg font-bold text-slate-800">{driverData.trips.total}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="text-base md:text-lg font-bold text-slate-800">{driverData.trips.completed}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Cancelled</p>
                  <p className="text-base md:text-lg font-bold text-slate-800">{driverData.trips.cancelled}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Acceptance</p>
                  <p className="text-base md:text-lg font-bold text-slate-800">{driverData.trips.acceptance}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">
          {/* Driver Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-14 w-14 md:h-16 md:w-16 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={24} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-bold text-slate-800 truncate">{driverData.name}</h2>
                <p className="text-xs md:text-sm text-slate-500">Auto ID: {driverData.id}</p>
                <div className="flex items-center mt-1">
                  <Star size={14} className="text-amber-500" fill="currentColor" />
                  <span className="text-xs md:text-sm font-medium ml-1">{driverData.rating}</span>
                  <span className="text-xs text-slate-500 ml-1">({driverData.reviews} reviews)</span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Auto Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-500">Vehicle</span>
                  <span className="text-slate-800 text-right">{driverData.vehicle.make} {driverData.vehicle.model} ({driverData.vehicle.year})</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-500">Reg. Number</span>
                  <span className="text-slate-800">{driverData.vehicle.regNumber}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Daily Subscription Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-4 md:p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-base md:text-lg font-bold">Daily Subscription</h2>
              <div className="bg-blue-500 rounded-full px-2 py-1 text-xs font-medium">Active</div>
            </div>
            <p className="text-blue-100 text-xs md:text-sm mb-4">Expires: {driverData.subscription.expires}</p>
            <div className="space-y-2 mb-4">
              {driverData.subscription.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <Check size={14} className="mr-2 text-blue-200" />
                  <p className="text-xs md:text-sm">{benefit}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-500">
              <span className="text-xs md:text-sm text-blue-100">Fee: ₹{driverData.subscription.fee}/day</span>
              <button className="bg-white text-blue-600 px-3 py-1 rounded text-xs md:text-sm font-medium">Renew</button>
            </div>
          </div>
          
          {/* Incentives Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-bold text-slate-800">Current Incentives</h2>
              <Award className="text-amber-500" size={20} />
            </div>
            <div className="space-y-3">
              {driverData.incentives.map((incentive, index) => (
                <div key={index} className="bg-amber-50 rounded-lg p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm md:text-base text-slate-800">{incentive.title}</h3>
                    <span className="text-xs md:text-sm text-amber-600 font-medium">{incentive.reward}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 mb-3">{incentive.description}</p>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="text-slate-800 font-medium">{incentive.progress}/{incentive.total}</span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${(incentive.progress / incentive.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Notifications Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-bold text-slate-800">Notifications</h2>
              <Bell className="text-blue-600" size={20} />
            </div>
            <div className="space-y-3">
              {driverData.notifications.map((notification, index) => (
                <div key={index} className={`p-3 rounded-lg ${notification.read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                  <div className="flex items-start">
                    <div className={`mt-0.5 mr-3 ${notification.read ? 'text-slate-400' : 'text-blue-600'}`}>
                      {notification.read ? (
                        <Bell size={14} />
                      ) : (
                        <Bell size={14} fill="currentColor" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-medium text-sm truncate ${notification.read ? 'text-slate-700' : 'text-blue-700'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-600">{notification.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full text-center text-blue-600 font-medium text-xs md:text-sm mt-2">
                View All Notifications
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:px-6 md:py-3 z-50">
        <div className="flex justify-between max-w-screen-xl mx-auto">
          <button className="flex flex-col items-center text-blue-600">
            <BarChart2 size={18} />
            <span className="text-[10px] md:text-xs mt-1">Overview</span>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <DollarSign size={18} />
            <span className="text-[10px] md:text-xs mt-1">Earnings</span>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <MapPin size={18} />
            <span className="text-[10px] md:text-xs mt-1">Trips</span>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <Bell size={18} />
            <span className="text-[10px] md:text-xs mt-1">Alerts</span>
          </button>
          <button className="flex flex-col items-center text-slate-400">
            <User size={18} />
            <span className="text-[10px] md:text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;