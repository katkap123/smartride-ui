
export interface Location {
    latitude: number;
    longitude: number;
  }
  
  export type RideType = 'SOLO' | 'SHARED';
  export type StopType = 'PICKUP' | 'DROPOFF';
  
  export interface Driver {
    id: string;
    currentLocation: Location;
    capacity: number;
    availableAtSeconds: number;
  }
  
  export interface RideRequest {
    id: string;
    riderId: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    rideType: RideType;
    passengerCount: number;
    requestedAtSeconds: number;
    maxWaitSeconds: number;
    maxDetourSeconds: number;
  }
  
  export interface RouteStop {
    rideId: string;
    type: StopType;
    location: Location;
    arrivalAtSeconds: number;
    occupancyAfterStop: number;
  }
  
  export interface DriverRoute {
    driverId: string;
    stops: RouteStop[];
    totalDistanceKm: number;
    emptyDistanceKm: number;
    occupiedDistanceKm: number;
    completedAtSeconds: number;
  }
  
  export interface DispatchResult {
    driverRoutes: DriverRoute[];
    unassignedRides: RideRequest[];
    totalDistanceKm: number;
    totalRiderWaitSeconds: number;
  }
  
  export interface DispatchMetrics {
    optimizationDurationMs: number;
    emptyDistancePercentage: number;
    assignedRides: number;
    unassignedRides: number;
  }
  
  export interface DispatchOptimizationResponse {
    result: DispatchResult;
    metrics: DispatchMetrics;
  }
  
  export interface DispatchRequest {
    drivers: Driver[];
    rides: RideRequest[];
  }
  