import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export const StorageService = {
  setItem: async (key, value) => {
    await Preferences.set({
      key: key,
      value: JSON.stringify(value),
    });
  },

  getItem: async (key) => {
    const { value } = await Preferences.get({ key: key });
    return value ? JSON.parse(value) : null;
  },

  getNumber: async (key, defaultValue = 0) => {
    const value = await StorageService.getItem(key);
    return value !== null ? Number(value) : defaultValue;
  },

  removeItem: async (key) => {
    await Preferences.remove({ key: key });
  },

  clear: async () => {
    await Preferences.clear();
  },
};

// Migrate storage from browser local storage to capacitor preferences
export async function migrateStorage() {
  // Check if migration has already been performed
  const migrated = await Preferences.get({ key: "storageMigrationComplete" });
  if (migrated.value === "true") {
    console.log("Storage migration already completed");
    return;
  }

  // Only perform migration if running on web
  if (Capacitor.getPlatform() === "web") {
    console.log("Starting storage migration");

    // List of keys to migrate
    const keysToMigrate = [
      "points",
      "selectedDifficulty",
      "wonCards",
      "selectedCategory",
      "cardRevealProgress",
      "plinkoProgress",
    ];

    // Perform migration
    for (const key of keysToMigrate) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        await Preferences.set({
          key: key,
          value: value,
        });
        console.log(`Migrated ${key}: ${value}`);
      }
    }

    // Cleanup old keys
    for (const key of keysToMigrate) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        console.log(`Removed old key from localStorage: ${key}`);
      }
    }

    // Mark migration as complete
    await Preferences.set({
      key: "storageMigrationComplete",
      value: "true",
    });

    console.log("Storage migration and cleanup completed");
  } else {
    console.log("Not running on web, skipping storage migration");
  }
}
