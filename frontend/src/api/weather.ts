import type { WeatherForecast, WeatherDay } from '../types/weather.ts';
import { demoForecast } from '../data/demoWeather.ts';

interface OWMListItem {
  dt: number;
  main: { temp_min: number; temp_max: number };
  weather: Array<{ id: number; description: string; icon: string }>;
  pop: number;
  wind: { speed: number };
}

interface OWMResponse {
  list: OWMListItem[];
  city: { name: string };
}

function mapConditionCode(id: number): WeatherDay['condition'] {
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 400) return 'rain';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'cloudy';
  if (id === 800) return 'clear';
  if (id === 801 || id === 802) return 'partly_cloudy';
  return 'cloudy';
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function fetchWeather(): Promise<WeatherForecast> {
  const key = import.meta.env.VITE_WEATHER_API_KEY as string | undefined;

  if (!key) {
    return demoForecast;
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=41.5236&lon=-90.5776&units=imperial&appid=${key}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.warn('Weather API request failed, using demo data');
    return demoForecast;
  }

  const data: OWMResponse = await res.json();

  // Group 3-hour intervals by day
  const dayMap = new Map<string, OWMListItem[]>();
  for (const item of data.list) {
    const dateStr = formatDate(new Date(item.dt * 1000));
    const existing = dayMap.get(dateStr);
    if (existing) {
      existing.push(item);
    } else {
      dayMap.set(dateStr, [item]);
    }
  }

  const days: WeatherDay[] = [];
  for (const [dateStr, items] of dayMap) {
    if (days.length >= 7) break;

    let highTemp = -Infinity;
    let lowTemp = Infinity;
    let maxPop = 0;
    let maxWind = 0;
    // Use the midday entry for condition, or the first one
    let representativeItem = items[0];

    for (const item of items) {
      if (item.main.temp_max > highTemp) highTemp = item.main.temp_max;
      if (item.main.temp_min < lowTemp) lowTemp = item.main.temp_min;
      if (item.pop > maxPop) maxPop = item.pop;
      if (item.wind.speed > maxWind) maxWind = item.wind.speed;

      const hour = new Date(item.dt * 1000).getHours();
      if (hour >= 11 && hour <= 14) {
        representativeItem = item;
      }
    }

    const weather = representativeItem.weather[0];
    days.push({
      date: dateStr,
      temp_high: Math.round(highTemp),
      temp_low: Math.round(lowTemp),
      condition: mapConditionCode(weather.id),
      description: weather.description,
      precipitation_pct: Math.round(maxPop * 100),
      wind_mph: Math.round(maxWind),
      icon: weather.icon,
    });
  }

  return {
    location: `${data.city.name}, IA`,
    days,
    fetched_at: new Date().toISOString(),
  };
}
