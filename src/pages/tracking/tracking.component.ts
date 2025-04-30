import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { icon, Map, marker, Marker, Polyline, polyline } from "leaflet";
import { MapLocationComponent } from "../../components/map-location/map-location.component";
import { BackgroundGeolocationService } from "../../service/background-geolocation.service";
import { TransformSpeedPipe } from "../../pipes/transform-speed.pipe";
import { IonButton } from "@ionic/angular/standalone";
import { DbRoutesService } from "../../service/db-routes.service";

@Component({
  selector: "app-tracking-map",
  standalone: true,
  imports: [MapLocationComponent, TransformSpeedPipe, IonButton],
  template: `
    <app-map-location (mapReadyEmit)="onMapReady($event)"></app-map-location>
    <button
      (click)="toggleTracking()"
      class="start-button"
      [class.stop-button]="tracking.trackingActive()"
    >
      {{ tracking.trackingActive() ? "Остановить трекинг" : "Начать трекинг" }}
    </button>

    @if (tracking.trackingActive()) {
    <p>Скорость: {{ tracking.speed() | transformSpeed }}</p>
    } @if(endMarker()){
    <ion-button (click)="saveTracking()">Сохранить маршрут</ion-button>
    }
  `,
  styleUrls: ["./tracking.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TrackingMapComponent {
  private dbRoutesService = inject(DbRoutesService);
  public readonly tracking = inject(BackgroundGeolocationService);
  private map = signal<Map | undefined>(undefined);
  private routePolyline = signal<Polyline | undefined>(undefined);
  protected endMarker = signal<Marker | null>(null);

  private readonly endIcon = icon({
    iconUrl: "assets/finish.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  private readonly lastPoint = computed(() => {
    const coords = this.tracking.routeCoordinates();
    return coords.length ? coords[coords.length - 1] : undefined;
  });

  constructor() {
    effect(() => {
      const map = this.map();
      const coords = this.tracking.routeCoordinates();
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

  toggleTracking() {
    this.tracking.trackingActive() ? this.stopTracking() : this.startTracking();
  }

  async saveTracking() {
    const coords = this.tracking.routeCoordinates();
    if (coords.length === 0) return;

    await this.dbRoutesService.saveRoute({
      date: new Date(),
      path: coords,
    });

    this.clearTracking();
    console.log("Маршрут сохранён.");
  }

  clearTracking() {
    const marker = this.endMarker();
    const map = this.map();
    if (marker && map) {
      map.removeLayer(marker);
    }
    this.endMarker.set(null);
    this.tracking.clear();
  }

  startTracking() {
    this.clearTracking();
    this.tracking.startTracking().then();
  }

  async stopTracking() {
    const last = this.lastPoint();

    await this.tracking.stopTracking();

    if (last && this.map()) {
      const finish = marker(last, { icon: this.endIcon });
      this.map()?.addLayer(finish);
      this.endMarker.set(finish);
    }
  }
}
