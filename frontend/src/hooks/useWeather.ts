import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '../api/weather.ts';

export function useWeather() {
  const { data: forecast, isLoading, error } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return { forecast, isLoading, error };
}
