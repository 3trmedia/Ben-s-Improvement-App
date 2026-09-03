import Dexie, { type Table } from "dexie";

export type OutboxItem = {
  id?: number;
  table: string;
  op: "insert" | "update";
  payload: Record<string, unknown>;
  match?: Record<string, unknown>;
  createdAt: number;
};

class OfflineDB extends Dexie {
  cache!: Table<{ key: string; data: unknown }, string>;
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super("bens-app-offline");
    this.version(1).stores({
      cache: "key",
      outbox: "++id",
    });
  }
}

export const offlineDb = new OfflineDB();
