import { Component, Input, input, signal } from "@angular/core";

@Component({
  selector: "app-marker-orientation",
  imports: [],
  template: `
    @let rotate = heading ?? 0;
    <div
      class="marker-point"
      [class.no-arrow]="heading === null"
      [style.transform]="'rotate(' + -rotate + 'deg)'"
    ></div>
  `,
  styleUrl: "./marker-orientation.component.scss",
})
export class MarkerOrientationComponent {
  @Input()
  heading: number | null = null;
}
