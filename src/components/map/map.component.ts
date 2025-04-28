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
import { registerPlugin } from '@capacitor/core';
import {BackgroundGeolocationPlugin} from "@capacitor-community/background-geolocation";
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

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
    iconUrl: "assets/location.svg", // Картинка иконки
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
    try {
      const callbackId = await BackgroundGeolocation.addWatcher(
          {
            backgroundTitle: 'Отслеживание маршрута',
            backgroundMessage: 'Приложение отслеживает ваш маршрут.',
            requestPermissions: true,
            stale: false,
          },
          (position, error) => {
            if (error) {
              console.error('Ошибка отслеживания:', error);
              return;
            }
            if (position) {
              const { latitude, longitude } = position;
              const newPoint: [number, number] = [latitude, longitude];
              this.routeCoordinates.push(newPoint);

              if (this.trackingMarker) {
                this.trackingMarker.setLatLng(newPoint);
              }

              if (this.routePolyline) {
                this.routePolyline.setLatLngs(this.routeCoordinates);
              } else {
                this.routePolyline = polyline(this.routeCoordinates, {
                  color: 'blue',
                });
                this.layers.push(this.routePolyline);
              }

              if (this.map) {
                this.map.setView(newPoint);
              }
            }
          }
      );

      this.watchId = callbackId;
      this.trackingActive = true;
    } catch (error) {
      console.error('Ошибка при запуске отслеживания:', error);
    }
  }

  async stopTracking() {
    if (this.watchId) {
      await BackgroundGeolocation.removeWatcher({ id: this.watchId });
      this.watchId = undefined;
      this.trackingActive = false;
    }
  }

}
