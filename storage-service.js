import { Preferences } from "@capacitor/preferences";

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
