import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "transformSpeed",
  standalone: true,
})
export class TransformSpeedPipe implements PipeTransform {
  transform(value: number | null): string {
    if (value === null || isNaN(value)) return "0 км/ч";
    const kmh = value * 3.6;
    return `${kmh.toFixed(1)} км/ч`;
  }
}
