import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import { latLng, tileLayer, Map, MapOptions, Layer, LatLng } from "leaflet";

@Component({
  selector: "app-map",
  standalone: true,
  imports: [LeafletModule],
  template: `
    <div
      leaflet
      style="height: 450px; width: 100vw;"
      [leafletOptions]="mapOptions()"
      [leafletLayers]="layers()"
      (leafletMapReady)="mapReady.emit($event)"
    ></div>
  `,

  styleUrl: "./map.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent {
  initialLayers: Layer[] = [
    tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
  ];

  defaultCoords = input<LatLng>(latLng(55.755864, 37.617698));

  layers = input<Layer[], Layer[]>(this.initialLayers, {
    transform: (incoming: Layer[] = []) => [...this.initialLayers, ...incoming],
  });

  mapReady = output<Map>();

  readonly mapOptions = computed<MapOptions>(() => ({
    center: this.defaultCoords(),
    zoom: 15,
  }));
}
