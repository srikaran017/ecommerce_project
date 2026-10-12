import { getApiBaseUrl } from "./apiConfig";
import { PublicStoreSettings, PublicStoreSettingsResponse } from "@/types/settings.types";

const getBaseUrl = () => getApiBaseUrl();

export class SettingsService {
  private static cachedSettings: PublicStoreSettings | null = null;
  private static cacheTimestamp = 0;
  private static CACHE_TTL_MS = 60 * 1000; // 60s cache

  /**
   * Fetch public store settings (No authentication required)
   * GET /api/v1/settings (or /api/settings)
   */
  static async getStoreSettings(forceRefresh = false): Promise<PublicStoreSettings | null> {
    const now = Date.now();
    if (!forceRefresh && this.cachedSettings && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cachedSettings;
    }

    try {
      const res = await fetch(`${getBaseUrl()}/settings`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      });

      if (!res.ok) return this.cachedSettings;
      const json: PublicStoreSettingsResponse = await res.json();
      if (json.success && json.data) {
        this.cachedSettings = json.data;
        this.cacheTimestamp = now;
        return json.data;
      }
      return this.cachedSettings;
    } catch (err) {
      console.warn("[SettingsService] Failed to fetch live store settings:", err);
      return this.cachedSettings;
    }
  }
}
