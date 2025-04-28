import { Routes } from "@angular/router";
import { TabsComponent } from "../components/tabs/tabs.component";

export const routes: Routes = [
  {
    path: "",
    component: TabsComponent,
    children: [
      {
        path: "list",
        loadComponent: () => import("../pages/maps-list/maps-list.component"),
      },
      {
        path: "tracking",
        loadComponent: () => import("../pages/tracking/tracking.component"),
      },

      {
        path: "",
        redirectTo: "/list",
        pathMatch: "full",
      },
    ],
  },
  {
    path: "",
    redirectTo: "/list",
    pathMatch: "full",
  },
];
