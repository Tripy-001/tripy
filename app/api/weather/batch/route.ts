import { NextRequest, NextResponse } from 'next/server';

type WeatherCode = number;

const WEATHER_CODE_MAP: Record<WeatherCode, string> = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

interface OpenMeteoHourly { time?: string[]; temperature_2m?: number[]; precipitation_probability?: number[]; weathercode?: number[]; }
interface OpenMeteoDaily { time?: string[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_probability_max?: number[]; weathercode?: number[]; }
interface OpenMeteoResponse { hourly?: OpenMeteoHourly; daily?: OpenMeteoDaily; }

interface WeatherCurrent { time: string; temperatureC: number | null; precipitationProbability: number | null; weatherCode: number | null; condition: string; }
interface WeatherDaily { date: string; maxTempC: number | null; minTempC: number | null; precipitationProbabilityMax: number | null; weatherCode: number | null; condition: string; }

type Point = { key?: string; lat: number; lng: number };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let points: Point[] = [];
    if (Array.isArray(body)) points = body as Point[];
    else if (Array.isArray(body?.points)) points = body.points as Point[];

    // Basic validation
    const valid = points
      .map((p) => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (valid.length === 0) {
      return NextResponse.json({ error: 'No valid points provided' }, { status: 400 });
    }

    const base = 'https://api.open-meteo.com/v1/forecast';
    const makeUrl = (lat: number, lng: number) => {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        timezone: 'auto',
        current: 'temperature_2m,precipitation_probability,weather_code',
        hourly: 'temperature_2m,precipitation_probability,weathercode',
        daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        forecast_days: '1',
      });
      return `${base}?${params.toString()}`;
    };

    // limit concurrency to avoid upstream throttling
    const concurrency = 6;
    const results: Record<string, { current: WeatherCurrent | null; daily: WeatherDaily | null } | { error: string }> = {};

    for (let i = 0; i < valid.length; i += concurrency) {
      const batch = valid.slice(i, i + concurrency);
      const settled = await Promise.allSettled(
        batch.map(async (p) => {
          const url = makeUrl(p.lat, p.lng);
          const res = await fetch(url, { next: { revalidate: 600 } });
          if (!res.ok) throw new Error(`Upstream ${res.status}`);
          const data: OpenMeteoResponse = await res.json();
          
          // Get current weather from hourly data
          let current: WeatherCurrent | null = null;
          const nowIso = new Date().toISOString().slice(0, 13) + ':00';
          const idx = data?.hourly?.time?.indexOf?.(nowIso) ?? -1;
          if (idx >= 0 && data.hourly) {
            current = {
              time: data.hourly.time![idx]!,
              temperatureC: data.hourly.temperature_2m?.[idx] ?? null,
              precipitationProbability: data.hourly.precipitation_probability?.[idx] ?? null,
              weatherCode: data.hourly.weathercode?.[idx] ?? null,
              condition: WEATHER_CODE_MAP[(data.hourly.weathercode?.[idx] as WeatherCode) ?? -1] ?? 'Unknown',
            };
          }
          
          // Use today's daily summary
          let daily: WeatherDaily | null = null;
          if (Array.isArray(data?.daily?.time) && data.daily!.time!.length > 0) {
            const i = 0;
            daily = {
              date: data.daily!.time![i]!,
              maxTempC: data.daily!.temperature_2m_max?.[i] ?? null,
              minTempC: data.daily!.temperature_2m_min?.[i] ?? null,
              precipitationProbabilityMax: data.daily!.precipitation_probability_max?.[i] ?? null,
              weatherCode: data.daily!.weathercode?.[i] ?? null,
              condition: WEATHER_CODE_MAP[(data.daily!.weathercode?.[i] as WeatherCode) ?? -1] ?? 'Unknown',
            };
          }
          
          const key = p.key ?? `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
          return { key, current, daily };
        })
      );

      settled.forEach((s, idx) => {
        const p = batch[idx];
        const key = p.key ?? `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
        if (s.status === 'fulfilled') {
          results[key] = { current: s.value.current, daily: s.value.daily };
        } else {
          results[key] = { error: s.reason?.message || 'Fetch error' } as { error: string };
        }
      });
    }

  type ResultVal = { current: WeatherCurrent | null; daily: WeatherDaily | null } | { error: string };
  const values = Object.values(results) as ResultVal[];
  const okCount = values.filter((v) => !('error' in v)).length;
  const errorCount = values.length - okCount;
    return NextResponse.json({ results, okCount, errorCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
