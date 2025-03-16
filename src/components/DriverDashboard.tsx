'use client';

import React, { useState } from 'react';
import { 
  User, Star, FileText, Bell, DollarSign, Calendar,
  MapPin, Settings, HelpCircle, Clock, Award, Truck,
  Check, AlertCircle, BarChart2, Repeat, CreditCard,
  TrendingUp, Trophy, Zap, Target, Shield, Medal, Flame
} from 'lucide-react';
import Map from '@/components/Map';

interface DriverDashboardProps {
  center: [number, number];
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ center }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeFilter, setTimeFilter] = useState<string>('week');
  const [totalPoints, setTotalPoints] = useState<number>(3); // Initialize with 5 points
  
  // Mock data - would be fetched from API in a real implementation
  const driverData = {
    name: "Venkatesh Rao",
    id: "#BLR2345",
    rating: 4.7,
    reviews: 987,
    driverScore: 8.2, // Added driver score (0-10)
    persona: {
      type: "Long Haul Specialist",
      traits: [
        {
          name: "Long Distance Expert",
          description: "Prefers longer routes with higher fare",
          icon: "Road"
        },
        {
          name: "Off-Peak Warrior",
          description: "Reliable during non-rush hours",
          icon: "Clock"
        },
        {
          name: "No-Cancel Legend",
          description: "Rarely cancels accepted rides",
          icon: "Check"
        }
      ],
      badges: ["Road Warrior", "Reliable Driver", "Early Bird"]
    },
    streakData: {
      noCancellationDays: 28,
      currentStreak: true,
      streakBonus: 140,
      maxDays: 100
    },
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
      pending: 850,
      // Added new fields
      netProfit: {
        today: 720,
        week: 4680,
        month: 19200
      },
      incentives: {
        today: 230,
        week: 1520,
        month: 5300
      }
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
    dailyChallenges: [
      {
        title: "Daily Income Goal",
        description: "Complete 7 trips with total profit of ₹500+",
        reward: "5 points bonus",
        progress: 5,
        total: 7,
        type: "essential"
      },
      {
        title: "Long Distance Champion", 
        description: "Complete 3 High Demand Trips",
        reward: "₹50 extra bonus ",
        progress: 2,
        total: 3,
        type: "persona"
      },
      {
        title: "Evening Rush Expert", 
        description: "Complete 4 trips during 5-8 PM",
        reward: "5 points bonus",
        progress: 1,
        total: 4,
        type: "persona"
      }
    ],
    benefits: [
      {
        title: "Premium Ride Priority",
        description: "Get priority for high-value rides",
        minScore: 7.5,
        unlocked: true
      },
      {
        title: "Fuel Discount Card",
        description: "5% cashback on fuel purchases",
        minScore: 8.0,
        unlocked: true
      },
      {
        title: "Health Insurance",
        description: "Basic health coverage for family",
        minScore: 8.5,
        unlocked: false
      },
      {
        title: "Vehicle Loan Benefits",
        description: "Low-interest loans for new vehicles",
        minScore: 9.0,
        unlocked: false
      }
    ],
    recentTrips: [
      {
        id: "BLR-1234",
        time: "Today, 10:45 AM",
        from: "Koramangala",
        to: "Indiranagar",
        fare: 180,
        incentive: 20,
        status: "Completed"
      },
      {
        id: "BLR-1233",
        time: "Today, 9:30 AM", 
        from: "HSR Layout",
        to: "Whitefield",
        fare: 320,
        incentive: 50,
        status: "Completed"
      },
      {
        id: "BLR-1232",
        time: "Yesterday, 6:30 PM",
        from: "MG Road",
        to: "Marathahalli",
        fare: 250,
        incentive: 30,
        status: "Completed"
      },
      {
        id: "BLR-1231",
        time: "Yesterday, 4:15 PM",
        from: "Electronic City",
        to: "Whitefield",
        fare: 450,
        incentive: 70,
        status: "Completed"
      },
      {
        id: "BLR-1230",
        time: "Yesterday, 1:20 PM",
        from: "Jayanagar",
        to: "Hebbal",
        fare: 280,
        incentive: 40,
        status: "Completed"
      }
    ]
  };

  // Function to get active filter data
  const getFilteredEarnings = () => {
    switch(timeFilter) {
      case 'today':
        return {
          earnings: driverData.earnings.today,
          netProfit: driverData.earnings.netProfit.today,
          incentives: driverData.earnings.incentives.today
        };
      case 'week':
        return {
          earnings: driverData.earnings.week,
          netProfit: driverData.earnings.netProfit.week,
          incentives: driverData.earnings.incentives.week
        };
      case 'month':
        return {
          earnings: driverData.earnings.month,
          netProfit: driverData.earnings.netProfit.month,
          incentives: driverData.earnings.incentives.month
        };
      default:
        return {
          earnings: driverData.earnings.week,
          netProfit: driverData.earnings.netProfit.week,
          incentives: driverData.earnings.incentives.week
        };
    }
  };

  const filteredEarnings = getFilteredEarnings();

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
              <p className="text-lg md:text-2xl font-bold text-text-green-600">{driverData.trips.acceptance}%</p>
            </div>
            <Check className="text-green-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-slate-500">Driver Score</p>
              <p className="text-lg md:text-2xl font-bold text-blue-700">{driverData.driverScore}/10</p>
            </div>
            <Award className="text-blue-700" size={20} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          {/* No Cancellation Streak */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg shadow-sm p-4 md:p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center mb-3">
              <div className="flex items-center">
                <Flame size={22} className="mr-2 text-amber-300" />
                <h2 className="text-lg md:text-xl font-bold">No Cancellation Streak</h2>
              </div>
              <div className="bg-emerald-600 rounded-full px-3 py-1 mt-2 md:mt-0 text-sm font-medium flex items-center">
                <span className="mr-1">Bonus:</span>
                <span className="font-bold">₹{driverData.streakData.streakBonus}</span>
              </div>
            </div>
            
            <div className="w-full h-8 bg-emerald-600 rounded-lg overflow-hidden mb-3">
              <div 
                className="h-full bg-amber-400 flex items-center justify-end px-2"
                style={{ width: `${(driverData.streakData.noCancellationDays / driverData.streakData.maxDays) * 100}%` }}
              >
                <span className="text-xs font-bold text-emerald-900">{driverData.streakData.noCancellationDays} DAYS</span>
              </div>
            </div>
            
            <p className="text-sm text-emerald-100 mt-1">
              {driverData.streakData.currentStreak 
                ? "Your streak is active! Keep going to increase your bonus." 
                : "Streak ended. Start a new streak to earn bonuses again."}
            </p>
          </div>
        
          {/* Earnings Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Earnings Overview</h2>
              <select 
                className="border border-slate-200 rounded-md p-2 text-sm w-full md:w-auto"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs md:text-sm text-slate-600">Total Earnings</p>
                <p className="text-xl md:text-2xl font-bold text-slate-800">₹{filteredEarnings.earnings}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs md:text-sm text-slate-600">Net Profit</p>
                <p className="text-xl md:text-2xl font-bold text-slate-800">₹{filteredEarnings.netProfit}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-xs md:text-sm text-amber-700">Incentives Earned</p>
                <p className="text-xl md:text-2xl font-bold text-amber-600">₹{filteredEarnings.incentives}</p>
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
                    <div className="text-right">
                      <p className="font-bold text-slate-800">₹{trip.fare}</p>
                      {trip.incentive > 0 && (
                        <p className="text-xs font-medium text-amber-600">+₹{trip.incentive} bonus</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Challenges */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Daily Challenges</h2>
              <Trophy className="text-amber-500" size={20} />
            </div>
            <div className="space-y-4">
              {driverData.dailyChallenges.map((challenge, index) => (
                <div 
                  key={index} 
                  className={`rounded-lg p-4 ${
                    challenge.type === 'essential' 
                      ? 'bg-blue-50 border-l-4 border-blue-600' 
                      : 'bg-amber-50 border-l-4 border-amber-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      {challenge.type === 'essential' ? (
                        <Target className="text-blue-600 mr-2" size={18} />
                      ) : (
                        <Zap className="text-amber-600 mr-2" size={18} />
                      )}
                      <h3 className="font-medium text-sm md:text-base text-slate-800">{challenge.title}</h3>
                    </div>
                    <span className={`text-xs md:text-sm font-medium ${
                      challenge.type === 'essential' ? 'text-blue-600' : 'text-amber-600'
                    }`}>{challenge.reward}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 mb-3 ml-6">{challenge.description}</p>
                  <div className="ml-6">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="text-slate-800 font-medium">{challenge.progress}/{challenge.total}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          challenge.type === 'essential' ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trip Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Trip Statistics</h2>
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-1">
                  <FileText size={18} className="text-blue-600 mr-1" />
                  <p className="text-xs text-slate-600">Total Trips</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{driverData.trips.total}</p>
              </div>
              
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Check size={18} className="text-emerald-600 mr-1" />
                  <p className="text-xs text-slate-600">Acceptance</p>
                </div>
                <p className="text-xl font-bold text-emerald-600">{driverData.trips.acceptance}%</p>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-1">
                  <MapPin size={18} className="text-amber-600 mr-1" />
                  <p className="text-xs text-slate-600">KMs Traveled</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{driverData.distance.total}</p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-1">
                  <AlertCircle size={18} className="text-red-500 mr-1" />
                  <p className="text-xs text-slate-600">Cancelled</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{driverData.trips.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">
          {/* Driver Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex items-center space-x-4 mb-2">
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
            
            {/* Driver Score */}
            <div className="mb-4 mt-3 bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold text-slate-700">Driver Score</p>
                <p className="text-sm font-bold text-blue-700">{driverData.driverScore}/10</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1">
                <div 
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${(driverData.driverScore / 10) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">Based on your ride completions, challenges, and high-priority rides</p>
            </div>
            
            {/* Driver Persona */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Medal className="text-amber-500 mr-2" size={16} />
                <h3 className="text-sm font-semibold text-slate-700">Driver Persona</h3>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-700 mb-2">{driverData.persona.type}</p>
                <div className="space-y-2 mb-3">
                  {driverData.persona.traits.map((trait, idx) => (
                    <div key={idx} className="flex items-center text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span className="font-medium text-slate-700 mr-1">{trait.name}:</span>
                      <span className="text-slate-600">{trait.description}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {driverData.persona.badges.map((badge, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-3">
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
          
          {/* Driver Benefits Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-bold text-slate-800">Driver Benefits</h2>
              <Shield className="text-blue-600" size={20} />
            </div>
            <div className="space-y-3">
              {driverData.benefits.map((benefit, index) => (
                <div key={index} className={`rounded-lg p-3 ${benefit.unlocked ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium text-sm ${benefit.unlocked ? 'text-blue-700' : 'text-slate-500'}`}>
                      {benefit.title}
                    </h3>
                    {benefit.unlocked ? (
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    ) : (
                      <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{benefit.description}</p>
                  <div className="flex items-center">
                    <Award size={12} className={`mr-1 ${benefit.unlocked ? 'text-amber-500' : 'text-slate-400'}`} />
                    <p className="text-xs text-slate-500">
                      Requires Driver Score: <span className="font-medium">{benefit.minScore}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Points Card - Display driver's accumulated points */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              <Award className="mr-3" size={24} />
              <h3 className="font-semibold text-lg">Reward Points</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{totalPoints || 5}</p>
                <p className="text-xs mt-1 text-indigo-100">Free subscription at 10 points</p>
              </div>
              <div className="bg-white/20 p-2 rounded-full">
                <Trophy size={28} className="text-indigo-100" />
              </div>
            </div>
            
            {/* Progress bar for next reward */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{(totalPoints || 3)}/10 points</span>
              </div>
              <div className="w-full bg-indigo-800/40 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full" 
                  style={{ width: `${Math.min(((totalPoints || 3) / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Keep other cards here */}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;