// src/repositories/WeatherRepository.ts
// Purpose: W3 Weather/Date/Time — provides real weather data via external API,
// with fallback to hardcoded "Santiago, 18°C" mock.
// Phase B-3 — W3 Weather Repository Migration
//
// ## Data source sequence
// 1. Try external weather API (e.g., OpenWeatherMap, WeatherAPI)
// 2. If API unavailable, return fallback hardcoded data
// 3. Date/time remain client-side (new Date()) — not in repository scope
//
// ## Future improvements
// - Configurable city/location
// - Weather icons mapped to condition codes
// - Caching layer to rate-limit API calls

export interface WeatherData {
  city: string;
  temperature: string;   // e.g. "18°C"
  condition: string;     // e.g. "cloudy", "sunny", "rainy"
  icon: string;          // emoji or icon name for UI
  humidity?: string;
  windSpeed?: string;
  isMock: boolean;       // true when using fallback
}

const FALLBACK_WEATHER: WeatherData = {
  city: 'Santiago',
  temperature: '18°C',
  condition: 'cloudy',
  icon: 'cloud-sun',
  isMock: true,
};

export class WeatherRepository {
  /**
   * Get current weather data.
   * Tries external API first, falls back to hardcoded defaults.
   */
  async getWeather(): Promise<WeatherData> {
    try {
      // Phase B-3: API call is placeholder — always falls through to fallback
      const apiData = await this.fetchFromApi();
      if (apiData) {
        return this.mapApiResponse(apiData);
      }
    } catch {
      // API unavailable — use fallback
    }
    return this.getFallbackWeather();
  }

  /**
   * Get current weather conditions (temperature, condition text).
   * Convenience method for inline display.
   */
  async getCurrentConditions(): Promise<string> {
    const weather = await this.getWeather();
    return `${weather.city}, ${weather.temperature}`;
  }

  /**
   * Get hardcoded fallback weather data.
   * Used when external API is unavailable.
   */
  getFallbackWeather(): WeatherData {
    return { ...FALLBACK_WEATHER };
  }

  /**
   * Attempt to fetch weather from an external API.
   * Currently returns null (API not integrated yet).
   * Future: replace with real fetch call.
   */
  private async fetchFromApi(): Promise<Record<string, unknown> | null> {
    // Placeholder — API key and endpoint not configured
    // Example implementation:
    // const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    // if (!apiKey) return null;
    // const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Santiago`);
    // if (!res.ok) return null;
    // return res.json();
    return null;
  }

  /**
   * Map external API response to our WeatherData shape.
   */
  private mapApiResponse(_data: Record<string, unknown>): WeatherData {
    // Placeholder — implement when API is connected
    return this.getFallbackWeather();
  }

  /**
   * Check if weather data source is available.
   */
  hasRealSource(): boolean {
    // Phase B-3: Always false — real API not integrated yet
    return false;
  }
}
