import { Injectable, signal } from "@angular/core";
import { registerPlugin } from "@capacitor/core";
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation"
);
@Injectable({
  providedIn: "root",
})
export class BackgroundGeolocationService {
  private watchId: string | undefined;
  trackingActive = signal(false);
  routeCoordinates = signal<[number, number][]>([]);
  speed = signal<number | null>(null);

  async startTracking() {
    this.watchId = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: "Отслеживание маршрута",
        backgroundMessage: "Приложение отслеживает ваш маршрут.",
        distanceFilter: 5,
        requestPermissions: true,
        stale: false,
      },
      (position, error) => {
        if (error) {
          console.error("Ошибка трекинга:", error);
          return;
        }
        if (position) {
          this.speed.set(position.speed);
          const point: [number, number] = [
            position.latitude,
            position.longitude,
          ];
          this.routeCoordinates.update((coords) => [...coords, point]);
        }
      }
    );
    this.trackingActive.set(true);
  }

  async stopTracking() {
    if (this.watchId) {
      await BackgroundGeolocation.removeWatcher({ id: this.watchId });
      this.watchId = undefined;
    }
    this.trackingActive.set(false);
  }

  clear() {
    this.routeCoordinates.set([]);
    this.speed.set(null);
  }
}
