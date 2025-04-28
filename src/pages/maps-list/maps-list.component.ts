import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-maps-list",
  imports: [],
  template: ` <p>maps-list works!</p> `,
  styleUrl: "./maps-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MapsListComponent {}
