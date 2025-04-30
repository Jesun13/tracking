import { Injectable } from "@angular/core";
import { openDB } from "idb";

@Injectable({
  providedIn: "root",
})
export class DbRoutesService {
  dbPromise = openDB("routes-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("routes")) {
        db.createObjectStore("routes", { keyPath: "data" });
      }
    },
  });

  async saveRoute(data: { date: Date; path: [number, number][] }) {
    const db = await this.dbPromise;
    await db.put("routes", data);
  }

  async getAllRoutes(): Promise<{ date: Date; path: [number, number][] }[]> {
    const db = await this.dbPromise;
    return await db.getAll("routes");
  }
}
