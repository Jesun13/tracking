import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from "@angular/core";
import { DbRoutesService } from "../../service/db-routes.service";
import { from } from "rxjs";

@Component({
  selector: "app-maps-list",
  standalone: true,
  imports: [],
  template: `
    <div>
      @for (route of routes(); track route.date) {
      <div class="route">
        <p>Дата: {{ route.date.toLocaleString() }}</p>
        <p>Длина маршрута: {{ route.path.length }} точек</p>
      </div>
      }
    </div>
  `,
  styleUrl: "./maps-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MapsListComponent {
  private dbRoutesService = inject(DbRoutesService);
  readonly routes = signal<{ date: Date; path: [number, number][] }[]>([]);

  constructor() {
    this.loadRoutes();
  }

  private async loadRoutes() {
    const routes = await this.dbRoutesService.getAllRoutes();
    // Преобразуем строки дат обратно в Date, если нужно
    routes.forEach((r) => (r.date = new Date(r.date)));
    this.routes.set(routes);
  }
}
