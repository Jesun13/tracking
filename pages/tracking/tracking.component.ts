import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MapComponent } from "../../components/map/map.component";

@Component({
  selector: "app-tracking",
  imports: [MapComponent],
  template: ` <app-map></app-map>`,
  styleUrl: "./tracking.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TrackingComponent {}
