'use client';

import React from 'react';
import DriverDashboard from '@/components/DriverDashboard';

export default function DriverDashboardPage() {
  // Default center location for Bangalore
  const defaultCenter: [number, number] = [12.9716, 77.5946];
  
  return (
    <main>
      <DriverDashboard center={defaultCenter} />
    </main>
  );
} 