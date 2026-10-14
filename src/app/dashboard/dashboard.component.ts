
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DispatchService } from '../services/dispatch.service';
import {
  DispatchRequest,
  DispatchOptimizationResponse
} from '../models/dispatch.model';
import { AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GoogleMap } from '@angular/google-maps';

interface DriverFormEntry {
  id: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
}

interface RideFormEntry {
  id: string;
  riderId: string;
  pickupAddress: string;
  dropoffAddress: string;
  passengerCount: number;
  maxWaitSeconds: number;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GoogleMapsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements AfterViewInit {

  @ViewChild(MapInfoWindow)
  infoWindow!: MapInfoWindow;

  @ViewChild(GoogleMap)
  googleMap!: GoogleMap;

  openDriverInfo(marker: MapMarker, index: number): void {
    const driver = this.drivers[index];

    if (!driver) return;

    this.selectedMarkerTitle = `Driver: ${driver.id}`;

    this.selectedMarkerDetails = [
      `Address: ${driver.address}`,
      `Capacity: ${driver.capacity}`,
      `Latitude: ${driver.latitude.toFixed(5)}`,
      `Longitude: ${driver.longitude.toFixed(5)}`
    ];

    this.infoWindow.open(marker);
  }

  
fitMapToMarkers(): void {
  const allLocations: google.maps.LatLngLiteral[] = [
    ...this.driverMarkers,
    ...this.pickupMarkers,
    ...this.dropoffMarkers
  ];

  if (allLocations.length === 0 || !this.googleMap?.googleMap) {
    return;
  }

  const bounds = new google.maps.LatLngBounds();

  allLocations.forEach(location => {
    bounds.extend(location);
  });

  this.googleMap.fitBounds(bounds, 60);

  // Avoid excessive zoom when there is only one marker.
  if (allLocations.length === 1) {
    this.googleMap.googleMap.setZoom(14);
  }
}


  openPickupInfo(marker: MapMarker, index: number): void {
    const ride = this.rides[index];

    if (!ride) return;

    this.selectedMarkerTitle = `Pickup: ${ride.id}`;

    this.selectedMarkerDetails = [
      `Rider: ${ride.riderId}`,
      `Address: ${ride.pickupAddress}`,
      `Passengers: ${ride.passengerCount}`
    ];

    this.infoWindow.open(marker);
  }

  openDropoffInfo(marker: MapMarker, index: number): void {
    const ride = this.rides[index];

    if (!ride) return;

    this.selectedMarkerTitle = `Drop-off: ${ride.id}`;

    this.selectedMarkerDetails = [
      `Rider: ${ride.riderId}`,
      `Address: ${ride.dropoffAddress}`
    ];

    this.infoWindow.open(marker);
  }
  selectedMarkerTitle: string = '';
  selectedMarkerDetails: string[] = [];
  mapCenter: google.maps.LatLngLiteral = {
    lat: 32.7767,
    lng: -96.7970
  };
  
  mapZoom = 11;
  
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true
  };

  driverMarkers: google.maps.LatLngLiteral[] = [];
  pickupMarkers: google.maps.LatLngLiteral[] = [];
  dropoffMarkers: google.maps.LatLngLiteral[] = [];

  driverMarkerOptions: google.maps.MarkerOptions = {
    icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  };

  pickupMarkerOptions: google.maps.MarkerOptions = {
    icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
  };

  dropoffMarkerOptions: google.maps.MarkerOptions = {
    icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
  };

  @ViewChild('dropoffAddressContainer')
  dropoffAddressContainer!: ElementRef<HTMLDivElement>;
  
  selectedDropoffLocation: {
    latitude: number;
    longitude: number;
  } | null = null;
  
  private async initializeDropoffAutocomplete(): Promise<void> {
    const { PlaceAutocompleteElement } =
      await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
  
    const autocomplete = new PlaceAutocompleteElement();
  
    autocomplete.setAttribute(
      'placeholder',
      'Search drop-off address'
    );
  
    autocomplete.style.colorScheme = 'light';
    autocomplete.style.backgroundColor = '#ffffff';
    autocomplete.style.color = '#1f2937';
    autocomplete.style.width = '100%';
  
    this.dropoffAddressContainer.nativeElement.appendChild(autocomplete);
  
    autocomplete.addEventListener('gmp-select', async (event: any) => {
      const place = event.placePrediction.toPlace();
  
      await place.fetchFields({
        fields: ['formattedAddress', 'location']
      });
  
      if (!place.location) {
        return;
      }
  
      this.selectedDropoffLocation = {
        latitude: place.location.lat(),
        longitude: place.location.lng()
      };
  
      this.rideForm.patchValue({
        dropoffAddress: place.formattedAddress ?? ''
      });
  
      console.log('Selected drop-off address:', place.formattedAddress);
      console.log('Drop-off coordinates:', this.selectedDropoffLocation);
    });
  }
  
@ViewChild('pickupAddressContainer')
pickupAddressContainer!: ElementRef<HTMLDivElement>;

selectedPickupLocation: {
  latitude: number;
  longitude: number;
} | null = null;

private async initializePickupAutocomplete(): Promise<void> {
  const { PlaceAutocompleteElement } =
    await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

  const autocomplete = new PlaceAutocompleteElement();

  autocomplete.setAttribute('placeholder', 'Search pickup address');
  autocomplete.style.colorScheme = 'light';
  autocomplete.style.backgroundColor = '#ffffff';
  autocomplete.style.color = '#1f2937';
  autocomplete.style.width = '100%';

  this.pickupAddressContainer.nativeElement.appendChild(autocomplete);

  autocomplete.addEventListener('gmp-select', async (event: any) => {
    const place = event.placePrediction.toPlace();

    await place.fetchFields({
      fields: ['formattedAddress', 'location']
    });

    if (!place.location) {
      return;
    }

    this.selectedPickupLocation = {
      latitude: place.location.lat(),
      longitude: place.location.lng()
    };

    this.rideForm.patchValue({
      pickupAddress: place.formattedAddress ?? ''
    });
  });
}


@ViewChild('driverAddressContainer')
driverAddressContainer!: ElementRef<HTMLDivElement>;

selectedDriverLocation: {
  latitude: number;
  longitude: number;
} | null = null;


async ngAfterViewInit(): Promise<void> {
  await Promise.all([
    this.initializeDriverAutocomplete(),
    this.initializePickupAutocomplete(),
    this.initializeDropoffAutocomplete()
  ]);
}

private async initializeDriverAutocomplete(): Promise<void> {
  const { PlaceAutocompleteElement } =
    await google.maps.importLibrary('places') as
      google.maps.PlacesLibrary;

  const autocomplete = new PlaceAutocompleteElement();
  autocomplete.style.colorScheme = 'light';
  autocomplete.style.backgroundColor = '#ffffff';
  autocomplete.style.color = '#1f2937';
  autocomplete.style.width = '100%';
  autocomplete.setAttribute(
    'placeholder',
    'Search for driver current address'
  );

  this.driverAddressContainer.nativeElement.appendChild(
    autocomplete
  );

  autocomplete.addEventListener('gmp-select', async (event: any) => {
    const place = event.placePrediction.toPlace();

    await place.fetchFields({
      fields: ['formattedAddress', 'location']
    });

    if (!place.location) {
      return;
    }

    this.selectedDriverLocation = {
      latitude: place.location.lat(),
      longitude: place.location.lng()
    };

    this.driverForm.patchValue({
      address: place.formattedAddress ?? ''
    });

    console.log('Selected driver address:', place.formattedAddress);
    console.log('Coordinates:', this.selectedDriverLocation);
  });
}

  private readonly fb = inject(FormBuilder);

  driverForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    address: ['', Validators.required],
    capacity: [4, [Validators.required, Validators.min(1)]]
  });

  rideForm = this.fb.nonNullable.group({
    id: ['', Validators.required],
    riderId: ['', Validators.required],
    pickupAddress: ['', Validators.required],
    dropoffAddress: ['', Validators.required],
    passengerCount: [
      1,
      [Validators.required, Validators.min(1)]
    ],
    maxWaitSeconds: [
      900,
      [Validators.required, Validators.min(0)]
    ]
  });
  private readonly dispatchService = inject(DispatchService);

  loading = false;
  errorMessage = '';
  response: DispatchOptimizationResponse | null = null;

  drivers: DriverFormEntry[] = [];
  rides: RideFormEntry[] = [];


  addDriver(): void {
    if (this.driverForm.invalid || !this.selectedDriverLocation) {
      this.driverForm.markAllAsTouched();
      this.errorMessage = 'Please select a valid address from Google suggestions.';
      return;
    }

    const formValue = this.driverForm.getRawValue();

    if (this.drivers.some(d => d.id === formValue.id)) {
      this.errorMessage = 'Driver ID already exists';
      return;
    }

    this.drivers.push({
      ...formValue,
      latitude: this.selectedDriverLocation.latitude,
      longitude: this.selectedDriverLocation.longitude
    });

    this.errorMessage = '';

    this.driverForm.reset({
      id: '',
      address: '',
      capacity: 4
    });

    this.selectedDriverLocation = null;

    // Clear Google's address input after adding the driver.
    const autocomplete =
      this.driverAddressContainer.nativeElement
        .querySelector('gmp-place-autocomplete');

    if (autocomplete) {
      (autocomplete as google.maps.places.PlaceAutocompleteElement).value = '';
    }
    this.updateMapMarkers();
  }


optimizedRoutes: {
  driverId: string;
  path: google.maps.LatLngLiteral[];
  options: google.maps.PolylineOptions;
}[] = [];

private readonly routeColors = [
  '#2563eb',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#be123c'
];

updateOptimizedRoutes(): void {
  if (!this.response) {
    this.optimizedRoutes = [];
    return;
  }

  this.optimizedRoutes = this.response.result.driverRoutes
    .map((route, index) => {
      const driver = this.drivers.find(
        d => d.id === route.driverId
      );

      if (!driver || route.stops.length === 0) {
        return null;
      }

      const path: google.maps.LatLngLiteral[] = [
        {
          lat: driver.latitude,
          lng: driver.longitude
        },
        ...route.stops.map(stop => ({
          lat: stop.location.latitude,
          lng: stop.location.longitude
        }))
      ];

      return {
        driverId: route.driverId,
        path,
        options: {
          strokeColor:
            this.routeColors[index % this.routeColors.length],
          strokeOpacity: 0.85,
          strokeWeight: 4
        }
      };
    })
    .filter((route): route is NonNullable<typeof route> =>
      route !== null
    );
}

  updateMapMarkers(): void {
    this.optimizedRoutes = [];
    this.response = null;
    this.driverMarkers = this.drivers.map(driver => ({
      lat: driver.latitude,
      lng: driver.longitude
    }));
  
    this.pickupMarkers = this.rides.map(ride => ({
      lat: ride.pickupLatitude,
      lng: ride.pickupLongitude
    }));
  
    this.dropoffMarkers = this.rides.map(ride => ({
      lat: ride.dropoffLatitude,
      lng: ride.dropoffLongitude
    }));
  
    const allMarkers = [
      ...this.driverMarkers,
      ...this.pickupMarkers,
      ...this.dropoffMarkers
    ];
  
    if (allMarkers.length > 0) {
      this.mapCenter = {
        lat: allMarkers.reduce((sum, p) => sum + p.lat, 0) / allMarkers.length,
        lng: allMarkers.reduce((sum, p) => sum + p.lng, 0) / allMarkers.length
      };
    }
    this.fitMapToMarkers();
  }
  
addRide(): void {
  if (
    this.rideForm.invalid ||
    !this.selectedPickupLocation ||
    !this.selectedDropoffLocation
  ) {
    this.rideForm.markAllAsTouched();
    this.errorMessage =
      'Please select valid pickup and drop-off addresses from Google suggestions.';
    return;
  }

  const formValue = this.rideForm.getRawValue();

  if (this.rides.some(r => r.id === formValue.id)) {
    this.errorMessage = 'Ride ID already exists';
    return;
  }

  this.rides.push({
    ...formValue,
    pickupLatitude: this.selectedPickupLocation.latitude,
    pickupLongitude: this.selectedPickupLocation.longitude,
    dropoffLatitude: this.selectedDropoffLocation.latitude,
    dropoffLongitude: this.selectedDropoffLocation.longitude
  });

  this.errorMessage = '';

  this.rideForm.reset({
    id: '',
    riderId: '',
    pickupAddress: '',
    dropoffAddress: '',
    passengerCount: 1,
    maxWaitSeconds: 900
  });

  this.selectedPickupLocation = null;
  this.selectedDropoffLocation = null;

  // Clear Google Places inputs after adding the ride.
  const pickupAutocomplete =
    this.pickupAddressContainer.nativeElement
      .querySelector('gmp-place-autocomplete');

  const dropoffAutocomplete =
    this.dropoffAddressContainer.nativeElement
      .querySelector('gmp-place-autocomplete');

  if (pickupAutocomplete) {
    (pickupAutocomplete as google.maps.places.PlaceAutocompleteElement).value = '';
  }

  if (dropoffAutocomplete) {
    (dropoffAutocomplete as google.maps.places.PlaceAutocompleteElement).value = '';
  }
  this.updateMapMarkers();
}


  removeDriver(id: string): void {
    this.drivers = this.drivers.filter(d => d.id !== id);
    this.updateMapMarkers();
  }

  removeRide(id: string): void {
    this.rides = this.rides.filter(r => r.id !== id);
    this.updateMapMarkers();
  }
  
runOptimization(): void {
  this.optimizedRoutes = [];
  if (this.drivers.length === 0 || this.rides.length === 0) {
    this.errorMessage =
      'Please add at least one driver and one ride before optimizing.';
    return;
  }

  const request: DispatchRequest = {
    drivers: this.drivers.map(driver => ({
      id: driver.id,
      currentLocation: {
        latitude: driver.latitude,
        longitude: driver.longitude
      },
      capacity: driver.capacity,
      availableAtSeconds: 0
    })),

    rides: this.rides.map(ride => ({
      id: ride.id,
      riderId: ride.riderId,
      pickupLocation: {
        latitude: ride.pickupLatitude,
        longitude: ride.pickupLongitude
      },
      dropoffLocation: {
        latitude: ride.dropoffLatitude,
        longitude: ride.dropoffLongitude
      },
      rideType: 'SOLO',
      passengerCount: ride.passengerCount,
      requestedAtSeconds: 0,
      maxWaitSeconds: ride.maxWaitSeconds,
      maxDetourSeconds: 0
    }))
  };

  this.loading = true;
  this.errorMessage = '';
  this.response = null;

  this.dispatchService.optimize(request).subscribe({
    next: response => {
      this.response = response;
      this.loading = false;
    
      this.updateOptimizedRoutes();
    
      console.log('Optimization response:', response);
    },
    error: error => {
      this.loading = false;
      this.errorMessage =
        error.error?.message || 'Dispatch optimization failed.';

      console.error('Optimization error:', error);
    }
  });
}

}
