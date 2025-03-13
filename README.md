# Namma Driver App - Ride Classification System

## Overview

This project implements a sophisticated ride classification and fare calculation system for a driver app. The system classifies rides into different categories based on demand-supply dynamics, driver characteristics, and other factors, and calculates appropriate fares using real-world distance data.

## Features

### Ride Classification System

The system classifies rides into the following categories:

- **Premium**: High-demand, low-supply situations with experienced drivers (rating ≥ 4.7)
- **Express**: High-demand rides or night rides requiring quick service
- **Standard**: Regular rides with balanced demand-supply
- **Economy**: Low-demand, high-supply rides offering cost-effective options

Classification factors include:
- Demand-supply ratio in the area
- Time of day (with special handling for night rides)
- Driver rating and experience
- Vehicle type and quality

### Dynamic Fare Calculation

The fare calculation system incorporates multiple factors:

- Base fare dependent on vehicle type (auto, car, premium)
- Per-kilometer rates with distance calculated via Mapbox API
- Dead mileage compensation (for distance to pickup)
- Demand-supply based price multipliers
- Time-of-day adjustments (rush hour, night)
- Driver incentives for long distances
- Fuel cost calculations based on vehicle mileage

### Real-time Notifications

The system includes a real-time notification component that:
- Displays incoming ride requests with details
- Shows countdown timers for request expiry
- Provides audio alerts for new requests
- Allows drivers to accept or decline rides
- Displays ride type and estimated fare information

## Technical Implementation

### Technologies Used

- React.js with TypeScript
- Mapbox API for distance calculations
- Tailwind CSS for styling

### Key Components

1. **Classification System**: Determines ride types based on multiple factors
2. **Fare Calculation Engine**: Computes fares with incentives and adjustments
3. **Mapbox Integration**: Provides accurate distance estimates
4. **Notification System**: Delivers real-time ride requests

### Distance Calculation

Distances are calculated using:
1. Mapbox Directions API (for accurate route distances)
2. Haversine formula as a fallback (with adjustments for real-world routes)

### Dead Mileage Calculation

Our system includes a novel approach to dead mileage compensation:
- Different compensation rates by vehicle type (60-80%)
- Integration with driver history to optimize pickup assignments
- Factored into driver incentives

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file with your Mapbox API key:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### Running the App

```bash
npm run dev
```

## Usage

1. Navigate to the Notifications tab to see incoming ride requests
2. Test the classification system by entering ride and driver IDs
3. View detailed fare breakdowns for each ride

## Future Enhancements

- Machine learning model for predictive demand-supply mapping
- Driver earnings predictions based on historical data
- Advanced route optimization with traffic predictions
- Integration with payment systems for seamless transactions
