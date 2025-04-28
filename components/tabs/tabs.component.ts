import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { list, playCircle, radio } from "ionicons/icons";

@Component({
  selector: "app-tabs",
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="list">
          <ion-icon name="list"></ion-icon>
          Список карт
        </ion-tab-button>
        <ion-tab-button tab="tracking">
          <ion-icon name="radio"></ion-icon>
          Треккинг
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styleUrl: "./tabs.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  constructor() {
    addIcons({ list, playCircle, radio });
  }
}
