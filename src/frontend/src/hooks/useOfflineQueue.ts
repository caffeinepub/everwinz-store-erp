import { useState } from "react";

const QUEUE_KEY = "ewz_offline_queue";

interface QueueEntry {
  id: string;
  type: string;
  payload: any[];
  timestamp: number;
}

function loadQueue(): QueueEntry[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueEntry[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>(loadQueue);
  const [isSyncing, setIsSyncing] = useState(false);

  const enqueue = (type: string, payload: any[]) => {
    const entry: QueueEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload,
      timestamp: Date.now(),
    };
    const updated = [...loadQueue(), entry];
    saveQueue(updated);
    setQueue(updated);
  };

  const syncNow = async (actor: any) => {
    if (!actor) return;
    const current = loadQueue();
    if (current.length === 0) return;
    setIsSyncing(true);
    const remaining: QueueEntry[] = [];
    for (const entry of current) {
      try {
        switch (entry.type) {
          case "supplier":
            await actor.createSupplier(...entry.payload);
            break;
          case "po":
            await actor.createPO(...entry.payload);
            break;
          case "mrn":
            await actor.createMRN(...entry.payload);
            break;
          case "grn":
            await actor.createGRN(...entry.payload);
            break;
          case "dc":
            await actor.createDC(...entry.payload);
            break;
          default:
            remaining.push(entry);
        }
      } catch {
        remaining.push(entry);
      }
    }
    saveQueue(remaining);
    setQueue(remaining);
    setIsSyncing(false);
  };

  return { enqueue, pendingCount: queue.length, syncNow, isSyncing };
}
