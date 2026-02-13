import {
  Sun, Cloud, CloudRain, Snowflake, CloudSun, CloudLightning, Loader2,
} from 'lucide-react';
import { Card } from '../common/Card.tsx';
import { useWeather } from '../../hooks/useWeather.ts';
import type { WeatherDay } from '../../types/weather.ts';

const CONDITION_ICON: Record<WeatherDay['condition'], React.ElementType> = {
  clear: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tmrw';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function WeatherWidget() {
  const { forecast, isLoading } = useWeather();

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading weather...
        </div>
      </Card>
    );
  }

  if (!forecast) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          7-Day Forecast - {forecast.location}
        </h3>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {forecast.days.map((day) => {
          const Icon = CONDITION_ICON[day.condition];
          const isBad = day.precipitation_pct > 50;
          return (
            <div
              key={day.date}
              className={`flex flex-col items-center rounded-lg py-2 px-1 text-center transition-colors ${
                isBad
                  ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-800'
                  : 'bg-gray-50 dark:bg-gray-700/30'
              }`}
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {dayLabel(day.date)}
              </span>
              <Icon
                className={`w-5 h-5 my-1 ${
                  isBad ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'
                }`}
              />
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {day.temp_high}°
              </span>
              <span className="text-xs text-gray-400">
                {day.temp_low}°
              </span>
              <span
                className={`text-[10px] mt-0.5 ${
                  isBad ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400'
                }`}
              >
                {day.precipitation_pct}%
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
