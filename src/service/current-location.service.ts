import { computed, Injectable, signal } from "@angular/core";
import { Geolocation } from "@capacitor/geolocation";

@Injectable({
  providedIn: "root",
})
export class CurrentLocationService {
  readonly #currentCoords = signal<[number | null, number | null]>([
    null,
    null,
  ]);

  currentCoords = computed(() => this.#currentCoords());
  #watchId: string | null = null;

  async watchPosition() {
    this.#watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: false },
      (pos, err) => {
        if (err) {
          console.error("Ошибка геопозиции:", err);
          return;
        }
        if (pos) {
          this.#currentCoords.set([pos.coords.latitude, pos.coords.longitude]);
        }
      }
    );
  }

  async clearWatchPosition() {
    if (this.#watchId) {
      await Geolocation.clearWatch({ id: this.#watchId });
      this.#watchId = null;
    }
  }
}
