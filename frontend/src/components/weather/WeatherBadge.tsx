import {
  Sun, Cloud, CloudRain, Snowflake, CloudSun, CloudLightning,
} from 'lucide-react';
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

const CONDITION_LABEL: Record<WeatherDay['condition'], string> = {
  clear: 'Clear',
  partly_cloudy: 'Ptly Cloudy',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Storm',
};

interface WeatherBadgeProps {
  date: string;
}

export function WeatherBadge({ date }: WeatherBadgeProps) {
  const { forecast } = useWeather();

  if (!forecast) return null;

  const day = forecast.days.find((d) => d.date === date);
  if (!day) return null;

  const Icon = CONDITION_ICON[day.condition];
  const isBad = day.precipitation_pct > 50;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium leading-none ${
        isBad
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      }`}
      style={{ minHeight: 'auto' }}
    >
      <Icon className="w-3 h-3" />
      {isBad ? CONDITION_LABEL[day.condition] : ''}
    </span>
  );
}
