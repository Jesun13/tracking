import {
  ChangeDetectionStrategy,
  Component,
  createComponent,
  effect,
  EnvironmentInjector,
  inject,
  OnDestroy,
  output,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { MapComponent } from "../map/map.component";
import { Map, latLng, Layer, marker, divIcon } from "leaflet";
import { CurrentLocationService } from "../../service/current-location.service";
import { MarkerOrientationComponent } from "../marker-orientation/marker-orientation.component";

@Component({
  selector: "app-map-location",
  imports: [MapComponent],
  template: `
    <app-map
      [layers]="layers()"
      (mapReady)="mapReady($event)"
      [defaultCoords]="defaultCoords"
    ></app-map>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrl: "./map-location.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapLocationComponent implements OnDestroy {
  private locationService = inject(CurrentLocationService);
  layers = signal<Layer[]>([]);
  map = signal<Map | undefined>(undefined);
  defaultCoords = latLng(56.326797, 44.006516); // Moscow
  mapReadyEmit = output<Map>();
  private orientation = signal<number>(0); // в градусах

  private readonly locationMarker = marker(this.defaultCoords, {
    icon: divIcon({
      className: "custom-orientation-marker",
      html: this.generateMarkerHtml(0),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    }),
  });

  constructor(private injector: EnvironmentInjector) {
    this.locationService.watchPosition().then();
    this.layers.update((layers) => [...layers, this.locationMarker]);
    window.addEventListener("deviceorientation", this.handleOrientation, true);

    effect(() => {
      const coords = this.locationService.currentCoords();
      if (coords[0] && coords[1]) {
        this.locationMarker.setLatLng([coords[0], coords[1]]);
        this.map()?.setView([coords[0], coords[1]]); // TODO: убрать
      }
    });

    effect(() => {
      const heading = this.orientation();
      this.locationMarker.setIcon(
        divIcon({
          className: "custom-orientation-marker",
          html: this.generateMarkerHtml(heading),
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })
      );
    });
  }

  private generateMarkerHtml(heading: number): string {
    const componentRef = createComponent(MarkerOrientationComponent, {
      environmentInjector: this.injector,
    });
    componentRef.instance.heading = heading;
    componentRef.changeDetectorRef.detectChanges();

    const div = document.createElement("div");
    div.appendChild(componentRef.location.nativeElement);

    return div.innerHTML;
  }

  private handleOrientation = (event: DeviceOrientationEvent) => {
    console.log(event, "orientation");
    if (event.alpha != null) {
      this.orientation.set(event.alpha);
    }
  };

  mapReady(map: Map) {
    this.map.set(map);
    this.mapReadyEmit.emit(map);
  }

  ngOnDestroy() {
    this.locationService.clearWatchPosition();
    window.removeEventListener("deviceorientation", this.handleOrientation);
  }
}
