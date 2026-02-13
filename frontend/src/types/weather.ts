export interface WeatherDay {
  date: string;          // YYYY-MM-DD
  temp_high: number;     // Fahrenheit
  temp_low: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'partly_cloudy' | 'storm';
  description: string;
  precipitation_pct: number;  // 0-100
  wind_mph: number;
  icon: string;          // OpenWeatherMap icon code
}

export interface WeatherForecast {
  location: string;
  days: WeatherDay[];
  fetched_at: string;
}
