'use server';

import { initializeStorage } from "@/lib/experimentStorage";

// Initialize storage on app startup
initializeStorage();

export default async function InitStorage() {
  // This is a server component that doesn't render anything.
  // It's just used to initialize the storage.
  return null;
}