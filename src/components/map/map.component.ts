import {ChangeDetectionStrategy, Component, OnInit} from "@angular/core";
import {LeafletModule} from "@bluehalo/ngx-leaflet";
import {icon, latLng, Layer, Map, marker, Marker, polyline, Polyline, tileLayer,} from "leaflet";
import {Geolocation} from "@capacitor/geolocation";
import {registerPlugin} from "@capacitor/core";
import {BackgroundGeolocationPlugin} from "@capacitor-community/background-geolocation";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

@Component({
    selector: "app-map",
    standalone: true,
    imports: [LeafletModule],
    template: `
        <div
                style="height: 600px; width: 100vw;"
                leaflet
                [leafletOptions]="mapOptions"
                [leafletLayers]="layers"
                (leafletMapReady)="onMapReady($event)"
        ></div>
        <p>{{ trackingActive }}</p>
        <button
                (click)="trackingActive ? stopTracking() :  startTracking()"
                class="track-button"
                [disabled]="trackingActive"
        >
            {{ trackingActive ? "Остановить трекинг" : "Начать трекинг" }}
        </button>
    `,
    styleUrls: ["./map.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
    mapOptions = {
        center: latLng(56.304315, 44.021914),
        zoom: 13,
    };

    layers: Layer[] = [
        tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
    ];
    trackingActive: boolean = false;
    currentLocationIcon = icon({
        iconUrl: "assets/location.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
    protected watchId?: string;
    private map?: Map;
    private trackingMarker?: Marker;
    private routePolyline?: Polyline;
    private routeCoordinates: [number, number][] = [];

    async ngOnInit() {
        const position = await Geolocation.getCurrentPosition();
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;

        this.trackingMarker = marker([currentLat, currentLng], {
            icon: this.currentLocationIcon,
        });
        this.layers.push(this.trackingMarker);

        this.routeCoordinates.push([currentLat, currentLng]); // Добавляем начальную точку маршрута

        if (this.map) {
            this.map.setView([currentLat, currentLng], 15);
        }
    }

    onMapReady(map: Map) {
        this.map = map;
    }

    async startTracking() {
        try {
            const callbackId = await BackgroundGeolocation.addWatcher(
                {
                    backgroundTitle: 'Отслеживание маршрута',
                    backgroundMessage: 'Приложение отслеживает ваш маршрут.',
                    distanceFilter: 5,
                    requestPermissions: true,
                    stale: false,
                },
                (position, error) => {
                    if (error) {
                        console.error('Ошибка отслеживания:', error);
                        return;
                    }
                    if (position) {
                        const {latitude, longitude} = position;
                        const newPoint: [number, number] = [latitude, longitude];
                        this.routeCoordinates.push(newPoint);

                        if (this.trackingMarker) {
                            this.trackingMarker.setLatLng(newPoint);
                        }

                        if (!this.routePolyline) {
                            this.routePolyline = polyline(this.routeCoordinates, {
                                color: 'blue',
                            });
                            if (this.map) {
                                this.map.addLayer(this.routePolyline);
                            }
                        } else {
                            this.routePolyline.setLatLngs(this.routeCoordinates);
                        }

                        if (this.map) {
                            this.map.setView(newPoint);
                        }
                    }
                }
            );

            this.watchId = callbackId;
            this.trackingActive = true;
        } catch (error) {
            console.error('Ошибка при запуске отслеживания:', error);
        }
    }

    async stopTracking() {
        if (this.watchId) {
            await BackgroundGeolocation.removeWatcher({id: this.watchId});
            this.watchId = undefined;
            this.trackingActive = false;
        }
    }
}
