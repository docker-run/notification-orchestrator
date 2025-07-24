import { HttpNotFoundError } from "../../errors";
import { DndWindow, UserPreference, UserPreferenceInput } from "../../types";

export class MockRepository {
  private users: Map<string, UserPreference>;
  private dndWindows: Map<string, DndWindow[]>
  constructor() {
    this.users = new Map();
    this.dndWindows = new Map();
  }

  async getUserPreferences(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      throw new HttpNotFoundError('User preferences not found');
    }
    return user;
  }

  async setUserPreferences(userId: string, preferences: UserPreferenceInput) {
    this.users.set(userId, {
      userId,
      eventTypes: preferences.eventTypes,
    });
  }

  async updateUserPreferences(userId: string, preferences: UserPreferenceInput) {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error('User not found');
    }
    this.users.set(userId, {
      ...existing,
      eventTypes: preferences.eventTypes,
    });
  }

  async getDNDWindows(userId: string) {
    return this.dndWindows.get(userId) || [];
  }

  async addDNDWindow(userId: string, dndWindow: DndWindow) {
    const windowId = `window_${Date.now()}`;
    const windows = this.dndWindows.get(userId) || [];
    windows.push({
      ...dndWindow,
    });
    this.dndWindows.set(userId, windows);
    return windowId;
  }

  async removeDNDWindow(userId: string, windowId: string) {
    const windows = this.dndWindows.get(userId) || [];
    const filtered = windows.filter(w => w.windowId !== windowId);
    this.dndWindows.set(userId, filtered);
  }

  clear() {
    this.users.clear();
    this.dndWindows.clear();
  }
}
