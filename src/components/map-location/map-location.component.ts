import {
  ChangeDetectionStrategy,
  Component,
  effect,
  output,
  signal,
} from "@angular/core";
import { Geolocation } from "@capacitor/geolocation";
import { MapComponent } from "../map/map.component";
import { icon, Map, latLng, Layer, marker } from "leaflet";

@Component({
  selector: "app-map-location",
  imports: [MapComponent],
  template: `
    <app-map
      [layers]="layers()"
      (mapReady)="mapReady($event)"
      [defaultCoords]="defaultCoords"
    ></app-map>
    <button (click)="test()">Позиция</button>
  `,
  styleUrl: "./map-location.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapLocationComponent {
  currentLocation = output<[number, number]>();
  layers = signal<Layer[]>([]);
  map = signal<Map | undefined>(undefined);
  defaultCoords = latLng(56.326797, 44.006516);
  mapReadyEmit = output<Map>();

  private readonly locationIcon = icon({
    iconUrl: "assets/location.svg",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  private readonly locationMarker = marker(this.defaultCoords, {
    icon: this.locationIcon,
  });

  private readonly currentCoords = signal<[number | null, number | null]>([
    null,
    null,
  ]);

  test() {
    this.map()?.setView([this.currentCoords()[0]!, this.currentCoords()[1]!]);
  }

  constructor() {
    this.layers.update((layers) => [...layers, this.locationMarker]);
    this.trackCurrentPosition().then();
    this.watchPosition().then();

    effect(() => {
      const [lat, lng] = this.currentCoords();
      if (lat && lng) {
        this.currentLocation.emit([lat, lng]);
      }
    });
  }

  mapReady(map: Map) {
    this.map.set(map);
    this.mapReadyEmit.emit(map);
  }

  private async watchPosition() {
    await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos, err) => {
        if (err) {
          console.error("Ошибка геопозиции:", err);
          return;
        }
        if (pos) {
          this.currentCoords.set([pos.coords.latitude, pos.coords.longitude]);
        }
      }
    );
  }

  private async trackCurrentPosition() {
    try {
      const { latitude, longitude } =
        await Geolocation.getCurrentPosition().then((res) => res.coords);
      this.currentCoords.set([latitude, longitude]);
      this.map()?.setView([latitude, longitude]);
      this.locationMarker.setLatLng([latitude, longitude]);
    } catch (err) {
      console.error("Ошибка получения начальной геопозиции:", err);
    }
  }
}
