import type { WeatherForecast } from '../types/weather.ts';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDemoForecast(): WeatherForecast {
  const today = new Date();
  const days = [
    { offset: 0, temp_high: 28, temp_low: 15, condition: 'partly_cloudy' as const, description: 'Partly cloudy skies', precipitation_pct: 10, wind_mph: 12, icon: '02d' },
    { offset: 1, temp_high: 32, temp_low: 22, condition: 'cloudy' as const, description: 'Overcast clouds', precipitation_pct: 30, wind_mph: 8, icon: '04d' },
    { offset: 2, temp_high: 26, temp_low: 18, condition: 'snow' as const, description: 'Heavy snow expected', precipitation_pct: 80, wind_mph: 18, icon: '13d' },
    { offset: 3, temp_high: 24, temp_low: 14, condition: 'snow' as const, description: 'Continued snowfall', precipitation_pct: 70, wind_mph: 15, icon: '13d' },
    { offset: 4, temp_high: 35, temp_low: 20, condition: 'clear' as const, description: 'Clear skies', precipitation_pct: 5, wind_mph: 6, icon: '01d' },
    { offset: 5, temp_high: 40, temp_low: 30, condition: 'rain' as const, description: 'Light rain', precipitation_pct: 60, wind_mph: 10, icon: '10d' },
    { offset: 6, temp_high: 38, temp_low: 25, condition: 'partly_cloudy' as const, description: 'Partly cloudy', precipitation_pct: 15, wind_mph: 9, icon: '02d' },
  ];

  return {
    location: 'Davenport, IA',
    days: days.map(d => {
      const date = new Date(today);
      date.setDate(today.getDate() + d.offset);
      return {
        date: formatDate(date),
        temp_high: d.temp_high,
        temp_low: d.temp_low,
        condition: d.condition,
        description: d.description,
        precipitation_pct: d.precipitation_pct,
        wind_mph: d.wind_mph,
        icon: d.icon,
      };
    }),
    fetched_at: new Date().toISOString(),
  };
}

export const demoForecast: WeatherForecast = buildDemoForecast();
