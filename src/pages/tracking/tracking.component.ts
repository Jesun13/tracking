import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from "@angular/core";
import { icon, Map, marker, Marker, Polyline, polyline } from "leaflet";
import { registerPlugin } from "@capacitor/core";
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { MapLocationComponent } from "../../components/map-location/map-location.component";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation"
);

@Component({
  selector: "app-tracking-map",
  standalone: true,
  imports: [MapLocationComponent],
  template: `
    <app-map-location
      (currentLocation)="onCurrentLocation($event)"
      (mapReadyEmit)="onMapReady($event)"
    ></app-map-location>

    <div>{{ speed }}</div>

    <button
      (click)="toggleTracking()"
      class="start-button"
      [class.stop-button]="trackingActive()"
    >
      {{ trackingActive() ? "Остановить трекинг" : "Начать трекинг" }}
    </button>
  `,
  styleUrls: ["./tracking.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TrackingMapComponent {
  trackingActive = signal(false);
  private map = signal<Map | undefined>(undefined);
  private watchId: string | undefined;
  protected speed: number | null = 0;
  private routeCoordinates = signal<[number, number][]>([]);
  private routePolyline = signal<Polyline | undefined>(undefined);
  private endMarker = signal<Marker | undefined>(undefined);

  private readonly endIcon = icon({
    iconUrl: "assets/finish.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  private readonly lastPoint = computed(() => {
    const coords = this.routeCoordinates();
    return coords.length ? coords[coords.length - 1] : undefined;
  });

  constructor() {
    effect(() => {
      const map = this.map();
      const coords = this.routeCoordinates();
      if (!map || coords.length === 0) return;
      const point = coords[coords.length - 1];
      const line = this.routePolyline();
      if (line) {
        line.setLatLngs(coords);
      } else {
        const newLine = polyline(coords, { color: "blue" });
        map.addLayer(newLine);
        this.routePolyline.set(newLine);
      }

      map.setView(point);
    });
  }

  onMapReady(map: Map) {
    this.map.set(map);
  }

  onCurrentLocation(location: [number, number]) {
    this.routeCoordinates.update((coords) => [...coords, location]);
  }

  toggleTracking() {
    this.trackingActive() ? this.stopTracking() : this.startTracking();
  }

  async startTracking() {
    this.clearMap();
    this.watchId = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: "Отслеживание маршрута",
        backgroundMessage: "Приложение отслеживает ваш маршрут.",
        distanceFilter: 5,
        requestPermissions: true,
        stale: false,
      },
      (position, error) => {
        if (error) {
          console.error("Ошибка трекинга:", error);
          return;
        }

        if (position) {
          this.speed = position.speed;
          const point: [number, number] = [
            position.latitude,
            position.longitude,
          ];
          this.routeCoordinates.update((coords) => [...coords, point]);
        }
      }
    );
    this.trackingActive.set(true);
  }

  async stopTracking() {
    if (this.watchId) {
      await BackgroundGeolocation.removeWatcher({ id: this.watchId });
      this.watchId = undefined;
    }
    const last = this.lastPoint();
    if (last && this.map()) {
      const finish = marker(last, { icon: this.endIcon });
      this.map()?.addLayer(finish);
      this.endMarker.set(finish);
    }
    this.trackingActive.set(false);
  }

  private clearMap() {
    this.routeCoordinates.set([]);

    const map = this.map();
    if (!map) return;

    [this.routePolyline, this.endMarker].forEach((signalRef) => {
      const layer = signalRef();
      if (layer) {
        map.removeLayer(layer);
        signalRef.set(undefined);
      }
    });
  }
}
