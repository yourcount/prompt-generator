import { createBlobStorage } from "@/lib/storage/blob";
import { createLocalStorage } from "@/lib/storage/local";
import type { StorageAdapter } from "@/lib/storage/types";

let adapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (adapter) return adapter;

  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN) && process.env.NODE_ENV === "production";
  adapter = useBlob ? createBlobStorage() : createLocalStorage();
  return adapter;
}
