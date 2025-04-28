import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import {
  latLng,
  marker,
  polyline,
  tileLayer,
  Map,
  Layer,
  icon,
  Marker,
  Polyline,
} from "leaflet";
import { Geolocation, Position } from "@capacitor/geolocation";

@Component({
  selector: "app-map",
  standalone: true,
  imports: [LeafletModule],
  template: `
    <div
      style="height: 600px; width: 100vw;"
      leaflet
      [leafletOptions]="mapOptions"
      [leafletLayers]="layers"
      (leafletMapReady)="onMapReady($event)"
    ></div>
    <p>{{ watchId }}</p>
    <div class="buttons-container">
      <button
        (click)="startTracking()"
        class="track-button"
        [disabled]="trackingActive"
      >
        Начать трекинг
      </button>
      <button
        (click)="stopTracking()"
        class="stop-button"
        [disabled]="!trackingActive"
      >
        Остановить трекинг
      </button>
    </div>
  `,
  styleUrls: ["./map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  mapOptions = {
    center: latLng(56.304315, 44.021914),
    zoom: 13,
  };

  layers: Layer[] = [
    tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
  ];

  private map?: Map;
  private trackingMarker?: Marker;
  private routePolyline?: Polyline;
  private routeCoordinates: [number, number][] = [];
  protected watchId?: string;
  trackingActive: boolean = false;

  currentLocationIcon = icon({
    iconUrl: "assets/location.png", // Картинка иконки
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  async ngOnInit() {
    const position = await Geolocation.getCurrentPosition();
    const currentLat = position.coords.latitude;
    const currentLng = position.coords.longitude;

    this.trackingMarker = marker([currentLat, currentLng], {
      icon: this.currentLocationIcon,
    });
    this.layers.push(this.trackingMarker);

    if (this.map) {
      this.map.setView([currentLat, currentLng], 15);
    }
  }

  onMapReady(map: Map) {
    this.map = map;
  }

  async startTracking() {
    if (this.watchId) return;

    this.trackingActive = true;
    this.routeCoordinates = []; // Очищаем старый маршрут

    this.watchId = await Geolocation.watchPosition(
      {},
      (position: Position | null, err?) => {
        if (err) {
          console.error("Ошибка трекинга:", err);
          return;
        }
        if (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const newPoint: [number, number] = [lat, lng];
          this.routeCoordinates.push(newPoint);

          // Обновляем маркер
          if (this.trackingMarker) {
            this.trackingMarker.setLatLng(newPoint);
          }

          // Обновляем/перерисовываем маршрут
          if (this.routePolyline) {
            this.routePolyline.setLatLngs(this.routeCoordinates);
          } else {
            this.routePolyline = polyline(this.routeCoordinates, {
              color: "blue",
            });
            this.layers.push(this.routePolyline);
          }

          // Центрируем карту
          if (this.map) {
            this.map.setView(newPoint);
          }
        }
      }
    );
  }

  async stopTracking() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = undefined;
      this.trackingActive = false;
    }
  }
}
