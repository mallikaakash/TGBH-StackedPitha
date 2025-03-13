'use client';

import React from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
}

interface NotificationsTabPanelProps {
  notifications: Notification[];
}

const NotificationsTabPanel: React.FC<NotificationsTabPanelProps> = ({ notifications }) => {
  return (
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
  );
};

export default NotificationsTabPanel; 