import { NextRequest, NextResponse } from 'next/server';

type WeatherCode = number;

const WEATHER_CODE_MAP: Record<WeatherCode, string> = {
	0: 'Clear',
	1: 'Mainly clear',
	2: 'Partly cloudy',
	3: 'Overcast',
	45: 'Fog',
	48: 'Depositing rime fog',
	51: 'Light drizzle',
	53: 'Moderate drizzle',
	55: 'Dense drizzle',
	56: 'Light freezing drizzle',
	57: 'Dense freezing drizzle',
	61: 'Slight rain',
	63: 'Moderate rain',
	65: 'Heavy rain',
	66: 'Light freezing rain',
	67: 'Heavy freezing rain',
	71: 'Slight snow fall',
	73: 'Moderate snow fall',
	75: 'Heavy snow fall',
	77: 'Snow grains',
	80: 'Slight rain showers',
	81: 'Moderate rain showers',
	82: 'Violent rain showers',
	85: 'Slight snow showers',
	86: 'Heavy snow showers',
	95: 'Thunderstorm',
	96: 'Thunderstorm with slight hail',
	99: 'Thunderstorm with heavy hail',
};

const toISODate = (d?: string | null) => {
	if (!d) return undefined;
	try {
		const dt = new Date(d);
		if (Number.isNaN(dt.getTime())) return undefined;
		return dt.toISOString().slice(0, 10);
	} catch {
		return undefined;
	}
};

interface OpenMeteoHourly {
	time?: string[];
	temperature_2m?: number[];
	precipitation_probability?: number[];
	weathercode?: number[];
}

interface OpenMeteoDaily {
	time?: string[];
	temperature_2m_max?: number[];
	temperature_2m_min?: number[];
	precipitation_probability_max?: number[];
	weathercode?: number[];
}

interface OpenMeteoResponse {
	hourly?: OpenMeteoHourly;
	daily?: OpenMeteoDaily;
}

interface WeatherCurrent {
	time: string;
	temperatureC: number | null;
	precipitationProbability: number | null;
	weatherCode: number | null;
	condition: string;
}

interface WeatherDaily {
	date: string;
	maxTempC: number | null;
	minTempC: number | null;
	precipitationProbabilityMax: number | null;
	weatherCode: number | null;
	condition: string;
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const latStr = searchParams.get('lat') ?? searchParams.get('latitude');
		const lngStr = searchParams.get('lng') ?? searchParams.get('lon') ?? searchParams.get('longitude');
		const dateParam = toISODate(searchParams.get('date'));

		if (!latStr || !lngStr) {
			return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
		}
		const latitude = Number(latStr);
		const longitude = Number(lngStr);
		if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
			return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 });
		}

		// Use Open-Meteo free API (no key required)
		const base = 'https://api.open-meteo.com/v1/forecast';
		const params = new URLSearchParams({
			latitude: String(latitude),
			longitude: String(longitude),
			timezone: 'auto',
			hourly: 'temperature_2m,precipitation_probability,weathercode',
			daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
		});
		if (dateParam) {
			params.set('start_date', dateParam);
			params.set('end_date', dateParam);
		}

		const url = `${base}?${params.toString()}`;
		const res = await fetch(url, { next: { revalidate: 600 } });
		if (!res.ok) {
			return NextResponse.json({ error: 'Upstream weather error', status: res.status }, { status: 502 });
		}
		const data: OpenMeteoResponse = await res.json();

		// Normalize response
			let daily: WeatherDaily | null = null;
			if (Array.isArray(data?.daily?.time) && data.daily!.time!.length > 0) {
				const i = 0; // single day when start=end; else take first
				daily = {
					date: data.daily!.time![i]!,
					maxTempC: data.daily!.temperature_2m_max?.[i] ?? null,
					minTempC: data.daily!.temperature_2m_min?.[i] ?? null,
					precipitationProbabilityMax: data.daily!.precipitation_probability_max?.[i] ?? null,
					weatherCode: data.daily!.weathercode?.[i] ?? null,
					condition: WEATHER_CODE_MAP[(data.daily!.weathercode?.[i] as WeatherCode) ?? -1] ?? 'Unknown',
				};
			}

			let current: WeatherCurrent | null = null;
			const nowIso = new Date().toISOString().slice(0, 13) + ':00'; // hour bucket
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

		return NextResponse.json({
			latitude,
			longitude,
			date: dateParam ?? null,
					current,
					daily,
			source: 'open-meteo',
		});
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Internal Server Error';
				return NextResponse.json({ error: message }, { status: 500 });
	}
}

