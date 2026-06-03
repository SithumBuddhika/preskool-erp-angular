import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import * as L from 'leaflet';

import {
  CreateTransportRoutePayload,
  TransportRoute,
  TransportRoutePoint,
  TransportRouteStatus,
} from '../../../core/models/transport-route.model';
import { TransportRoutesService } from '../../../core/services/transport-routes.service';

type ToastType = 'success' | 'error';

type GeocodeResult = {
  lat: string;
  lon: string;
  display_name: string;
};

@Component({
  selector: 'app-routes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './routes.component.html',
  styleUrl: './routes.component.scss',
})
export class RoutesComponent implements OnInit, OnDestroy {
  routes = signal<TransportRoute[]>([]);
  selectedRoute = signal<TransportRoute | null>(null);
  routeToDelete = signal<TransportRoute | null>(null);

  routePoints = signal<TransportRoutePoint[]>([]);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  isGeneratingMap = signal(false);
  showRouteModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  private map: L.Map | null = null;
  private polyline: L.Polyline | null = null;
  private markerLayer: L.LayerGroup | null = null;

  isEditMode = computed(() => this.selectedRoute() !== null);

  activeRoutes = computed(
    () => this.routes().filter((route) => route.status === 'ACTIVE').length,
  );

  inactiveRoutes = computed(
    () => this.routes().filter((route) => route.status === 'INACTIVE').length,
  );

  totalStops = computed(() =>
    this.routes().reduce(
      (total, route) => total + (route.stops?.length || 0),
      0,
    ),
  );

  totalDistance = computed(() =>
    this.routes().reduce(
      (total, route) => total + Number(route.distanceKm || 0),
      0,
    ),
  );

  routeForm = new FormGroup({
    routeCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    routeName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startLocation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    endLocation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    stopsText: new FormControl('', {
      nonNullable: true,
    }),
    distanceKm: new FormControl<number | null>(null),
    estimatedTime: new FormControl('', {
      nonNullable: true,
    }),
    vehicleNo: new FormControl('', {
      nonNullable: true,
    }),
    driverName: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<TransportRouteStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(private readonly routesService: TransportRoutesService) {}

  ngOnInit(): void {
    this.loadRoutes();
  }

  ngOnDestroy(): void {
    this.destroyMap();

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  loadRoutes(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.routesService.getRoutes(search).subscribe({
      next: (routes) => {
        this.routes.set(routes);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load transport routes.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load transport routes.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
    this.loadRoutes(value);
  }

  openCreateModal(): void {
    this.selectedRoute.set(null);

    this.routeForm.reset({
      routeCode: '',
      routeName: '',
      startLocation: '',
      endLocation: '',
      stopsText: '',
      distanceKm: null,
      estimatedTime: '',
      vehicleNo: '',
      driverName: '',
      status: 'ACTIVE',
      notes: '',
    });

    this.routePoints.set([]);
    this.serverError.set('');
    this.showRouteModal.set(true);

    this.routesService.generateNextRouteCode().subscribe({
      next: (routeCode) => {
        if (!this.isEditMode() && this.showRouteModal()) {
          this.routeForm.controls.routeCode.setValue(routeCode);
        }
      },
      error: () => {
        this.showToast(
          'Could not generate route code. Please enter it manually.',
          'error',
        );
      },
    });

    setTimeout(() => {
      this.initializeMap();
    }, 120);
  }

  openEditModal(route: TransportRoute): void {
    this.selectedRoute.set(route);

    this.routeForm.reset({
      routeCode: route.routeCode,
      routeName: route.routeName,
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      stopsText: route.stops?.join(', ') || '',
      distanceKm: route.distanceKm ?? null,
      estimatedTime: route.estimatedTime || '',
      vehicleNo: route.vehicleNo || '',
      driverName: route.driverName || '',
      status: route.status,
      notes: route.notes || '',
    });

    this.routePoints.set(this.normalizeRoutePoints(route.routePoints));
    this.serverError.set('');
    this.showRouteModal.set(true);

    setTimeout(() => {
      this.initializeMap();
    }, 120);
  }

  closeRouteModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showRouteModal.set(false);
    this.selectedRoute.set(null);
    this.routePoints.set([]);
    this.serverError.set('');
    this.destroyMap();
  }

  saveRoute(): void {
    this.routeForm.markAllAsTouched();
    this.serverError.set('');

    if (this.routeForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedRoute = this.selectedRoute();
    const payload = this.buildRoutePayload();

    this.isSubmitting.set(true);

    if (selectedRoute) {
      this.routesService.updateRoute(selectedRoute.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeRouteModal();
          this.loadRoutes();
          this.showToast('Transport route updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update transport route.',
          );
          this.showToast('Failed to update transport route.', 'error');
        },
      });

      return;
    }

    this.routesService.createRoute(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeRouteModal();
        this.loadRoutes();
        this.showToast('Transport route added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create transport route.',
        );
        this.showToast('Failed to create transport route.', 'error');
      },
    });
  }

  openDeleteModal(route: TransportRoute): void {
    this.routeToDelete.set(route);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.routeToDelete.set(null);
  }

  confirmDeleteRoute(): void {
    const route = this.routeToDelete();

    if (!route || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.routesService.deleteRoute(route.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.routeToDelete.set(null);
        this.loadRoutes();
        this.showToast('Transport route deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.routeToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete transport route.',
        );
        this.showToast('Failed to delete transport route.', 'error');
      },
    });
  }

  async generateMapFromLocations(): Promise<void> {
    this.routeForm.controls.startLocation.markAsTouched();
    this.routeForm.controls.endLocation.markAsTouched();

    const startLocation = this.routeForm.controls.startLocation.value.trim();
    const endLocation = this.routeForm.controls.endLocation.value.trim();
    const stops = this.getStopsFromText();

    if (!startLocation || !endLocation || this.isGeneratingMap()) {
      this.showToast('Enter start and end locations first.', 'error');
      return;
    }

    this.isGeneratingMap.set(true);
    this.serverError.set('');

    const locationNames = [startLocation, ...stops, endLocation];

    try {
      const generatedPoints: TransportRoutePoint[] = [];

      for (let index = 0; index < locationNames.length; index += 1) {
        const locationName = locationNames[index];
        const point = await this.geocodeLocation(locationName);

        generatedPoints.push({
          label: this.getGeneratedPointLabel(
            index,
            locationNames.length,
            locationName,
          ),
          lat: point.lat,
          lng: point.lng,
        });

        if (index < locationNames.length - 1) {
          await this.delay(1100);
        }
      }

      this.routePoints.set(this.relabelPoints(generatedPoints));
      this.calculateDistanceFromPoints();
      this.renderRouteOnMap();
      this.showToast('Map generated from route locations.', 'success');
    } catch (error) {
      this.showToast(
        error instanceof Error
          ? error.message
          : 'Failed to generate map from locations.',
        'error',
      );
    } finally {
      this.isGeneratingMap.set(false);
    }
  }

  removeLastPoint(): void {
    const points = [...this.routePoints()];

    points.pop();
    this.routePoints.set(this.relabelPoints(points));
    this.calculateDistanceFromPoints();
    this.renderRouteOnMap();
  }

  clearRoutePoints(): void {
    this.routePoints.set([]);
    this.routeForm.controls.distanceKm.setValue(null);
    this.renderRouteOnMap();
  }

  getRouteInitial(route: TransportRoute): string {
    return route.routeName.charAt(0).toUpperCase();
  }

  getStatusLabel(status: TransportRouteStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getStopsLabel(route: TransportRoute): string {
    const count = route.stops?.length || 0;

    if (count === 0) {
      return 'No stops';
    }

    if (count === 1) {
      return '1 stop';
    }

    return `${count} stops`;
  }

  getPointsLabel(route: TransportRoute): string {
    const count = route.routePoints?.length || 0;

    if (count === 0) {
      return 'No map points';
    }

    if (count === 1) {
      return '1 point';
    }

    return `${count} points`;
  }

  isInvalid(controlName: keyof typeof this.routeForm.controls): boolean {
    const control = this.routeForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private initializeMap(): void {
    this.destroyMap();

    const mapElement = document.getElementById('transport-route-map');

    if (!mapElement) {
      return;
    }

    const defaultCenter: L.LatLngExpression = [6.9271, 79.8612];

    this.map = L.map(mapElement, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.addPointFromMap(event.latlng.lat, event.latlng.lng);
    });

    this.renderRouteOnMap();

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 150);
  }

  private addPointFromMap(lat: number, lng: number): void {
    const points = [
      ...this.routePoints(),
      {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      },
    ];

    this.routePoints.set(this.relabelPoints(points));
    this.calculateDistanceFromPoints();
    this.renderRouteOnMap();
  }

  private renderRouteOnMap(): void {
    if (!this.map || !this.markerLayer) {
      return;
    }

    this.markerLayer.clearLayers();

    if (this.polyline) {
      this.polyline.removeFrom(this.map);
      this.polyline = null;
    }

    const points = this.routePoints();

    points.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: this.createPointIcon(index, points.length),
      });

      marker.bindPopup(
        `<strong>${point.label || `Point ${index + 1}`}</strong><br/>${point.lat}, ${point.lng}`,
      );

      marker.addTo(this.markerLayer as L.LayerGroup);
    });

    if (points.length >= 2) {
      this.polyline = L.polyline(
        points.map((point) => [point.lat, point.lng] as L.LatLngExpression),
        {
          weight: 4,
          opacity: 0.85,
        },
      ).addTo(this.map);

      this.map.fitBounds(this.polyline.getBounds(), {
        padding: [24, 24],
      });
    } else if (points.length === 1) {
      this.map.setView([points[0].lat, points[0].lng], 14);
    }
  }

  private createPointIcon(index: number, total: number): L.DivIcon {
    let label = `${index + 1}`;
    let modifier = '';

    if (index === 0) {
      label = 'S';
      modifier = ' route-map-marker--start';
    }

    if (total > 1 && index === total - 1) {
      label = 'E';
      modifier = ' route-map-marker--end';
    }

    return L.divIcon({
      className: `route-map-marker${modifier}`,
      html: `<span>${label}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.polyline = null;
      this.markerLayer = null;
    }
  }

  private calculateDistanceFromPoints(): void {
    const points = this.routePoints();

    if (points.length < 2) {
      this.routeForm.controls.distanceKm.setValue(null);
      return;
    }

    let totalMeters = 0;

    for (let index = 1; index < points.length; index += 1) {
      const previous = L.latLng(points[index - 1].lat, points[index - 1].lng);
      const current = L.latLng(points[index].lat, points[index].lng);

      totalMeters += previous.distanceTo(current);
    }

    const distanceKm = Number((totalMeters / 1000).toFixed(2));

    this.routeForm.controls.distanceKm.setValue(distanceKm);
  }

  private relabelPoints(
    points: Omit<TransportRoutePoint, 'label'>[] | TransportRoutePoint[],
  ): TransportRoutePoint[] {
    return points.map((point, index) => {
      let label = `Stop ${index}`;

      if (index === 0) {
        label = 'Start';
      } else if (index === points.length - 1) {
        label = 'End';
      }

      return {
        ...point,
        label,
      };
    });
  }

  private normalizeRoutePoints(
    value?: TransportRoutePoint[] | null,
  ): TransportRoutePoint[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return this.relabelPoints(
      value
        .filter(
          (point) =>
            typeof point.lat === 'number' && typeof point.lng === 'number',
        )
        .map((point) => ({
          label: point.label,
          lat: point.lat,
          lng: point.lng,
        })),
    );
  }

  private getStopsFromText(): string[] {
    return this.routeForm.controls.stopsText.value
      .split(',')
      .map((stop) => stop.trim())
      .filter(Boolean);
  }

  private async geocodeLocation(
    locationName: string,
  ): Promise<{ lat: number; lng: number }> {
    const query = this.buildGeocodeQuery(locationName);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      query,
    )}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Could not search location: ${locationName}`);
    }

    const results = (await response.json()) as GeocodeResult[];

    if (!results.length) {
      throw new Error(`Location not found: ${locationName}`);
    }

    return {
      lat: Number(Number(results[0].lat).toFixed(6)),
      lng: Number(Number(results[0].lon).toFixed(6)),
    };
  }

  private buildGeocodeQuery(locationName: string): string {
    const cleanedLocation = locationName.trim();

    if (/sri\s*lanka|lk/i.test(cleanedLocation)) {
      return cleanedLocation;
    }

    return `${cleanedLocation}, Sri Lanka`;
  }

  private getGeneratedPointLabel(
    index: number,
    total: number,
    locationName: string,
  ): string {
    if (index === 0) {
      return `Start - ${locationName}`;
    }

    if (index === total - 1) {
      return `End - ${locationName}`;
    }

    return `Stop ${index} - ${locationName}`;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  private buildRoutePayload(): CreateTransportRoutePayload {
    const formValue = this.routeForm.getRawValue();

    const stops = this.getStopsFromText();

    const payload: CreateTransportRoutePayload = {
      routeCode: formValue.routeCode.trim(),
      routeName: formValue.routeName.trim(),
      startLocation: formValue.startLocation.trim(),
      endLocation: formValue.endLocation.trim(),
      stops,
      routePoints: this.routePoints(),
      status: formValue.status,
    };

    if (formValue.distanceKm !== null && formValue.distanceKm !== undefined) {
      payload.distanceKm = Number(formValue.distanceKm);
    }

    if (formValue.estimatedTime.trim()) {
      payload.estimatedTime = formValue.estimatedTime.trim();
    }

    if (formValue.vehicleNo.trim()) {
      payload.vehicleNo = formValue.vehicleNo.trim();
    }

    if (formValue.driverName.trim()) {
      payload.driverName = formValue.driverName.trim();
    }

    if (formValue.notes.trim()) {
      payload.notes = formValue.notes.trim();
    }

    return payload;
  }

  private showToast(message: string, type: ToastType): void {
    this.toast.set({ message, type });

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
    }, 2800);
  }
}
