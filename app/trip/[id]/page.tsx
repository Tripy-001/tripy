'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GoogleMapsPreview from '@/components/GoogleMapsPreview';
import AutoCarousel from '@/components/AutoCarousel';
import { MapPin, Calendar, Clock, DollarSign, Users, Star, Download, Cloud, CloudRain, Sun, Wind } from 'lucide-react';
import ScrollSpyTabs from '@/components/ScrollSpyTabs';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/lib/store';

type Trip = unknown;

type TripPageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

const resolveParams = async (input: TripPageProps['params']): Promise<{ id: string } | null> => {
  try {
    const p = input as unknown;
    if (p && typeof p.then === 'function') {
      return await p;
    }
    return p || null;
  } catch {
    return null;
  }
};

export default function TripDetailPage(props: TripPageProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const { firebaseUser, authLoading } = useAppStore();
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherMap, setWeatherMap] = useState<Record<string, {
    loading: boolean;
    error?: string;
    data?: {
      current: { temperatureC: number | null; condition: string | null; precipitationProbability?: number | null } | null;
      daily: { maxTempC: number | null; minTempC: number | null; condition: string | null; precipitationProbabilityMax: number | null } | null;
    };
  }>>({});

  useEffect(() => {
    let mounted = true;
    resolveParams(props.params).then((res) => {
      if (!mounted) return;
      setTripId(res?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [props.params]);

  useEffect(() => {
    if (!tripId) return;
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const doFetch = async () => {
      try {
        const user = firebaseUser || auth.currentUser;
        if (!user) {
          setError('You must be signed in to view this trip.');
          setLoading(false);
          return;
        }
        const token = await user.getIdToken();
        const res = await fetch(`/api/trips/${tripId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        if (!res.ok) {
          const msg = res.status === 401 ? 'Unauthorized' : res.status === 403 ? 'Forbidden' : res.status === 404 ? 'Trip not found' : 'Failed to load trip';
          throw new Error(msg);
        }
        const data = await res.json();
        if (!cancelled) {
          setTrip(data?.trip || null);
          setLoading(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e?.message || 'Error loading trip');
          setLoading(false);
        }
      }
    };

    doFetch();
    return () => {
      cancelled = true;
    };
  }, [tripId, firebaseUser, authLoading]);

  const it = useMemo(() => (trip?.itinerary ?? {}), [trip]);
  const mapData = useMemo(() => it?.map_data || {}, [it]);
  const currency = it?.currency || it?.budget_breakdown?.currency;

  const formatCurrency = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (!isFinite(num)) return String(val);
    return `${num} ${currency || ''}`.trim();
  };

  const handleDownloadPdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      const title = `Trip Itinerary${it?.destination ? ` - ${it.destination}` : ''}`;
      doc.setFontSize(16);
      doc.text(title, 40, 40);

      // Overview table
      const overviewRows: Array<[string, string]> = [];
      if (it?.origin || it?.destination) overviewRows.push(['Route', `${it?.origin || ''} → ${it?.destination || ''}`]);
      if (trip?.request?.start_date || trip?.request?.end_date) overviewRows.push(['Dates', `${trip?.request?.start_date || ''} – ${trip?.request?.end_date || ''}`]);
      if (it?.trip_duration_days) overviewRows.push(['Duration', `${it.trip_duration_days} day(s)`]);
      if (it?.group_size || trip?.request?.group_size) overviewRows.push(['Group size', String(it?.group_size ?? trip?.request?.group_size)]);
      if (it?.total_budget || it?.budget_breakdown?.total_budget) overviewRows.push(['Budget', formatCurrency(it?.total_budget ?? it?.budget_breakdown?.total_budget)]);
      if (it?.travel_style || trip?.request?.primary_travel_style) overviewRows.push(['Travel style', String(it?.travel_style ?? trip?.request?.primary_travel_style)]);
      if (it?.activity_level || trip?.request?.activity_level) overviewRows.push(['Activity level', String(it?.activity_level ?? trip?.request?.activity_level)]);

      autoTable(doc, {
        startY: 60,
        head: [['Field', 'Value']],
        body: overviewRows,
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [32, 90, 167] },
      });

      // Budget breakdown
      if (it?.budget_breakdown) {
        const bb = it.budget_breakdown as Record<string, unknown>;
        const budgetRows = [
          ['Accommodation', formatCurrency(bb.accommodation_cost)],
          ['Food', formatCurrency(bb.food_cost)],
          ['Activities', formatCurrency(bb.activities_cost)],
          ['Transport', formatCurrency(bb.transport_cost)],
          ['Misc', formatCurrency(bb.miscellaneous_cost)],
          ['Daily suggestion', formatCurrency(bb.daily_budget_suggestion)],
          ['Total budget', formatCurrency(bb.total_budget)],
        ].filter((r) => r[1]);
        if (budgetRows.length) {
          autoTable(doc, {
            startY: (doc as unknown).lastAutoTable ? (doc as unknown).lastAutoTable.finalY + 8 : undefined,
            head: [['Budget item', 'Amount']],
            body: budgetRows as unknown,
            styles: { fontSize: 10, cellPadding: 5 },
            headStyles: { fillColor: [32, 90, 167] },
          });
        }
      }

      // Daily itineraries
      if (Array.isArray(it?.daily_itineraries)) {
        it.daily_itineraries.forEach((day: unknown, idx: number) => {
          doc.addPage();
          const dayTitle = `Day ${day?.day_number || idx + 1}${day?.theme ? ` - ${day.theme}` : ''}`;
          doc.setFontSize(14);
          doc.text(dayTitle, 40, 40);
          doc.setFontSize(10);
          if (day?.date) doc.text(`Date: ${new Date(day.date).toLocaleDateString()}`, 40, 58);
          let currentY = 72;
          // Day route link from map_data.daily_route_maps if available
          try {
            const drm = mapData?.daily_route_maps;
            const key = `Day ${day?.day_number || idx + 1}`;
            const routeUrl = drm?.[key];
            if (routeUrl) {
              doc.text(`Route map: ${routeUrl}`, 40, currentY, { maxWidth: 520 });
              currentY += 12;
            }
          } catch {}
          const sectionKeys = ['morning', 'afternoon', 'evening', 'lunch'] as const;
          sectionKeys.forEach((sectionKey) => {
            const section: unknown = day?.[sectionKey];
            if (!section) return;

            const headerRows: Array<[string, string]> = [];
            if (section?.total_duration_hours) headerRows.push(['Total duration (hrs)', String(section.total_duration_hours)]);
            if (section?.estimated_cost) headerRows.push(['Estimated cost', formatCurrency(section.estimated_cost)]);
            if (section?.transportation_notes) headerRows.push(['Transport notes', String(section.transportation_notes)]);

            if (headerRows.length) {
              autoTable(doc, {
                startY: currentY,
                head: [[`${String(sectionKey).toUpperCase()} SUMMARY`, '']],
                body: headerRows,
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
              });
              // @ts-expect-error - lastAutoTable property from jsPDF plugin
              currentY = (doc as unknown).lastAutoTable.finalY + 6;
            }

            if (Array.isArray(section?.activities) && section.activities.length) {
              const rows = section.activities.map((act: unknown) => {
                const p = act?.activity || {};
                const type = act?.activity_type || p?.subcategory || p?.category || '';
                const duration = p?.duration_hours ?? act?.duration_hours ?? '';
                const cost = act?.estimated_cost_per_person ?? p?.estimated_cost ?? '';
                const addr = p?.address || '';
                // Prefer concise coordinate map URL when possible
                const lat = p?.coordinates?.lat;
                const lng = p?.coordinates?.lng;
                const placeId = p?.place_id;
                const mapUrl = typeof lat === 'number' && typeof lng === 'number'
                  ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                  : (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : '');
                return [p?.name || type || 'Activity', type, String(duration || ''), formatCurrency(cost), addr, mapUrl];
              });

              autoTable(doc, {
                startY: currentY,
                head: [[`${String(sectionKey).toUpperCase()} ACTIVITIES`, 'Type', 'Duration (hrs)', 'Cost', 'Address', 'Map']],
                body: rows,
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: { 4: { cellWidth: 200 }, 5: { cellWidth: 160 } },
                headStyles: { fillColor: [32, 90, 167] },
              });
              // @ts-expect-error - lastAutoTable property from jsPDF plugin
              currentY = (doc as unknown).lastAutoTable.finalY + 6;

              // Optional descriptions block
              const descRows = section.activities
                .map((act: unknown) => {
                  const p = act?.activity || {};
                  const desc = p?.description || '';
                  if (!desc) return null;
                  return [p?.name || 'Activity', desc];
                })
                .filter(Boolean) as Array<[string, string]>;
              if (descRows.length) {
                autoTable(doc, {
                  startY: currentY,
                  head: [['Activity', 'Description']],
                  body: descRows,
                  styles: { fontSize: 9, cellPadding: 4 },
                  columnStyles: { 1: { cellWidth: 350 } },
                  headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
                });
                // @ts-expect-error - lastAutoTable property from jsPDF plugin
                currentY = (doc as unknown).lastAutoTable.finalY + 6;
              }
            }
          });
        });
      }

      doc.save(`Trip-Itinerary-${(it?.destination || 'trip').toString().replace(/\s+/g, '-')}-${trip?.id || 'id'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    }
  };

  // Build a set of unique weather queries from itinerary
  const weatherQueries = useMemo(() => {
    const qs: Array<{ key: string; lat: number; lng: number; date?: string }> = [];
    const seen = new Set<string>();
    try {
      const days: any[] = Array.isArray(it?.daily_itineraries) ? it.daily_itineraries : [];
      days.forEach((day) => {
        const date = day?.date ? new Date(day.date).toISOString().slice(0, 10) : undefined;
        (['morning','lunch','afternoon','evening'] as const).forEach((sectionKey) => {
          const section: any = day?.[sectionKey];
          if (!section) return;
          const acts: any[] = sectionKey === 'lunch' && section.restaurant ? [ { activity: section.restaurant } ] : (Array.isArray(section?.activities) ? section.activities : []);
          acts.forEach((act: any) => {
            const p = act?.activity || act || {};
            const lat = p?.coordinates?.lat;
            const lng = p?.coordinates?.lng;
            if (typeof lat === 'number' && typeof lng === 'number') {
              const key = `${lat.toFixed(3)},${lng.toFixed(3)}@${date ?? 'na'}`; // reduce duplicates by rounding
              if (!seen.has(key)) {
                seen.add(key);
                qs.push({ key, lat, lng, date });
              }
            }
          });
        });
      });
    } catch {}
    return qs;
  }, [it]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!weatherQueries || weatherQueries.length === 0) {
        setWeatherMap({});
        setWeatherLoading(false);
        setWeatherError(null);
        return;
      }
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const points = weatherQueries.map(q => ({ key: q.key, lat: q.lat, lng: q.lng, date: q.date }));
        const res = await fetch('/api/weather/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points }),
        });
        if (!res.ok) throw new Error(`Weather ${res.status}`);
        const json = await res.json();
        const results = json?.results || {};
        if (cancelled) return;
  const next: Record<string, { loading: boolean; error?: string; data?: { current: { temperatureC: number | null; condition: string | null; precipitationProbability?: number | null } | null; daily: { maxTempC: number | null; minTempC: number | null; condition: string | null; precipitationProbabilityMax: number | null } | null; } }> = {};
        for (const q of weatherQueries) {
          const val = (results as any)[q.key];
          if (!val) {
            next[q.key] = { loading: false, error: 'No data' };
            continue;
          }
          if ('error' in val) {
            next[q.key] = { loading: false, error: String(val.error || 'Error') };
          } else {
            const curr = val.current ? { temperatureC: val.current.temperatureC ?? null, condition: val.current.condition ?? null, precipitationProbability: val.current.precipitationProbability ?? null } : null;
            const daily = val.daily ? {
              maxTempC: val.daily.maxTempC ?? null,
              minTempC: val.daily.minTempC ?? null,
              condition: val.daily.condition ?? null,
              precipitationProbabilityMax: val.daily.precipitationProbabilityMax ?? null,
            } : null;
            next[q.key] = { loading: false, data: { current: curr, daily } };
          }
        }
        setWeatherMap(next);
        setWeatherLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setWeatherError(e?.message || 'Failed to fetch weather');
        setWeatherLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [weatherQueries]);

  const WeatherIcon = ({ condition }: { condition?: string | null }) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('clear') || c.includes('sun')) return <Sun className="w-4 h-4 text-yellow-500" />;
    if (c.includes('rain') || c.includes('shower')) return <CloudRain className="w-4 h-4 text-blue-500" />;
    if (c.includes('cloud')) return <Cloud className="w-4 h-4 text-gray-500" />;
    return <Wind className="w-4 h-4 text-muted-foreground" />;
  };

  type WeatherEntry = {
    loading: boolean;
    error?: string;
    data?: {
      current: { temperatureC: number | null; condition: string | null; precipitationProbability?: number | null } | null;
      daily: { maxTempC: number | null; minTempC: number | null; condition: string | null; precipitationProbabilityMax: number | null } | null;
    };
  };

  const CompactWeatherCard = ({ date, w }: { date?: string; w?: WeatherEntry }) => {
    if (!w) return null;
    const condition = w.data?.daily?.condition || w.data?.current?.condition || '—';
    const max = w.data?.daily?.maxTempC;
    const min = w.data?.daily?.minTempC;
    const precipDay = w.data?.daily?.precipitationProbabilityMax;
    const hasDetails = condition !== '—' || typeof max === 'number' || typeof min === 'number' || typeof precipDay === 'number';
    return (
      <div className="mt-3">
        <div className="rounded-lg border p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <WeatherIcon condition={w.data?.current?.condition || w.data?.daily?.condition} />
              <span className="font-medium text-foreground">Weather</span>
              {date && (
                <Badge variant="secondary" className="ml-1">{new Date(date).toLocaleDateString()}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {w.loading && <Badge variant="outline">Loading…</Badge>}
              {w.error && <Badge variant="destructive">Error</Badge>}
            </div>
          </div>
          {hasDetails && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="text-foreground font-medium mr-1">{condition}</span>
              {typeof max === 'number' && (
                <Badge variant="outline" className="px-2 py-0.5">Max {Math.round(max)}°C</Badge>
              )}
              {typeof min === 'number' && (
                <Badge variant="outline" className="px-2 py-0.5">Min {Math.round(min)}°C</Badge>
              )}
              {typeof precipDay === 'number' && (
                <Badge variant="secondary" className="px-2 py-0.5">Precip (day) {precipDay}%</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const sectionLinks: Array<{ href: string; label: string }> = useMemo(() => {
    const links: Array<{ href: string; label: string }> = [];
    links.push({ href: '#overview', label: 'Overview' });
    if (trip?.request) links.push({ href: '#request', label: 'Request' });
    if (Array.isArray(it?.daily_itineraries) && it.daily_itineraries.length) links.push({ href: '#itinerary', label: 'Itinerary' });
    if (Array.isArray(it?.travel_options) && it.travel_options.length) links.push({ href: '#travel-options', label: 'Travel options' });
    if (Array.isArray(it?.seasonal_considerations) && it.seasonal_considerations.length) links.push({ href: '#season', label: 'Seasonal' });
    if (it?.local_information || it?.weather_forecast_summary) links.push({ href: '#local-info', label: 'Local info' });
    if (Array.isArray(it?.hidden_gems) && it.hidden_gems.length) links.push({ href: '#gems', label: 'Hidden gems' });
    if (Array.isArray(it?.photography_spots) && it.photography_spots.length) links.push({ href: '#photo', label: 'Photography' });
    if (Array.isArray(it?.customization_suggestions) && it.customization_suggestions.length) links.push({ href: '#customize', label: 'Customize' });
    if (Array.isArray(it?.packing_suggestions) && it.packing_suggestions.length) links.push({ href: '#packing', label: 'Packing' });
    if (it?.budget_breakdown) links.push({ href: '#budget', label: 'Budget' });
    if (it?.accommodations) links.push({ href: '#stay', label: 'Stay' });
    if (it?.transportation) links.push({ href: '#transport', label: 'Transport' });
    if (mapData?.static_map_url || mapData?.daily_route_maps || mapData?.all_locations) links.push({ href: '#maps', label: 'Maps' });
    return links;
  }, [trip, it, mapData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold text-foreground">Loading trip…</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">{error || 'Trip not found'}</h2>
            <p className="text-muted-foreground">We couldn&apos;t load this trip.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const response = trip;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 theme-bg rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{response?.title || it?.destination || 'Trip'}</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {response?.visibility && (
                <Badge className="bg-blue-100 text-blue-800">{String(response.visibility).toUpperCase()}</Badge>
              )}
              {(response as unknown)?.updated_at && (
                <Badge variant="outline">Updated {new Date((response as unknown).updated_at).toLocaleDateString()}</Badge>
              )}
              {response?.updatedAt && (
                <Badge variant="outline">Updated {new Date(response.updatedAt).toLocaleDateString()}</Badge>
              )}
              <button onClick={handleDownloadPdf} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {response?.thumbnail_url && (
        <div className="w-full">
          <div className="relative h-[220px] sm:h-[280px] lg:h-[360px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={response.thumbnail_url} alt={response?.title || 'Trip thumbnail'} className="absolute inset-0 w-full h-full object-contain bg-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-5">
              <div className="max-w-7xl mx-auto text-white">
                <div className="text-lg font-semibold drop-shadow">{it?.destination || response?.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-90">
                  {response?.id && <Badge variant="secondary">ID: {response.id}</Badge>}
                  {(response as unknown)?.source_trip_id && <Badge variant="secondary">Source: {(response as unknown).source_trip_id}</Badge>}
                  {(response as unknown)?.schema_version && <Badge variant="secondary">Schema v{(response as unknown).schema_version}</Badge>}
                  {it?.version && <Badge variant="secondary">Itinerary v{it.version}</Badge>}
                  {typeof it?.confidence_score === 'number' && <Badge variant="outline" className="bg-white/20 text-white border-white/40">Confidence: {Math.round(it.confidence_score * 100)}%</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/70 sticky top-16 z-40 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSpyTabs links={sectionLinks} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card id="overview" className="glass-card mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Itinerary Overview</CardTitle>
                {response?.summary && (
                  <CardDescription className="max-w-3xl">{response.summary}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              {it?.origin && it?.destination && (
                <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{it.origin} → {it.destination}</span></div>
              )}
              {it?.trip_duration_days && (
                <div className="flex items-center space-x-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{it.trip_duration_days} day(s)</span></div>
              )}
              {(it?.group_size || response?.request?.group_size) && (
                <div className="flex items-center space-x-2"><Users className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{it.group_size ?? response.request.group_size} people</span></div>
              )}
              {(it?.total_budget && it?.currency) && (
                <div className="flex items-center space-x-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{it.total_budget} {it.currency}</span></div>
              )}
              {(it?.travel_style || response?.request?.primary_travel_style) && (
                <div className="flex items-center space-x-2"><Star className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{it.travel_style ?? response.request.primary_travel_style}</span></div>
              )}
              {(it?.activity_level || response?.request?.activity_level) && (
                <div className="flex items-center space-x-2"><Clock className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{it.activity_level ?? response.request.activity_level}</span></div>
              )}
            </div>

            {it?.map_data?.interactive_map_embed_url && (
              <div className="rounded-2xl overflow-hidden border">
                <iframe
                  src={it.map_data.interactive_map_embed_url}
                  className="w-full h-[200px] sm:h-[220px] md:h-[280px] lg:h-[320px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Trip map"
                />
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground flex flex-wrap gap-4">
              {response?.createdAt && (<span>Created: {new Date(response.createdAt).toLocaleString()}</span>)}
              {response?.updatedAt && (<span>Updated: {new Date(response.updatedAt).toLocaleString()}</span>)}
              {it?.last_updated && (<span>Itinerary updated: {new Date(it.last_updated).toLocaleString()}</span>)}
              {it?.generated_at && (<span>Generated: {new Date(it.generated_at).toLocaleString()}</span>)}
            </div>
          </CardContent>
        </Card>

        {response?.request && (
          <Card id="request" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Your request</CardTitle>
              <CardDescription>Preferences used to generate this itinerary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="font-medium mb-2">Trip basics</div>
                  <div className="space-y-1 text-muted-foreground">
                    {response.request.origin && response.request.destination && (<div>{response.request.origin} → {response.request.destination}</div>)}
                    {response.request.start_date && response.request.end_date && (<div>{new Date(response.request.start_date).toLocaleDateString()} – {new Date(response.request.end_date).toLocaleDateString()}</div>)}
                    {'group_size' in response.request && (<div>Group: {response.request.group_size}</div>)}
                    {'total_budget' in response.request && (<div>Budget: {response.request.total_budget} {response.request.budget_currency}</div>)}
                    {response.request.primary_travel_style && (<div>Style: {response.request.primary_travel_style}</div>)}
                    {response.request.activity_level && (<div>Activity: {response.request.activity_level}</div>)}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Preferences</div>
                  <div className="flex flex-wrap gap-2">
                    {(response.request.transport_preferences || []).map((m: string, i: number) => (<Badge key={`tp-${i}`} variant="secondary" className="capitalize">{m.replaceAll('_',' ')}</Badge>))}
                    {(response.request.accessibility_needs || []).map((m: string, i: number) => (<Badge key={`ac-${i}`} variant="outline">{m}</Badge>))}
                    {(response.request.dietary_restrictions || []).map((m: string, i: number) => (<Badge key={`diet-${i}`} variant="secondary">{m}</Badge>))}
                    {(response.request.special_occasions || []).map((m: string, i: number) => (<Badge key={`occ-${i}`} variant="outline">{m}</Badge>))}
                  </div>
                  {response.request.budget_breakdown && (
                    <div className="mt-4">
                      <div className="font-medium mb-1">Requested budget distribution</div>
                      {(() => {
                        const bb: unknown = response.request.budget_breakdown;
                        const items = [
                          ['Accommodation', bb.accommodation_percentage],
                          ['Food', bb.food_percentage],
                          ['Transport', bb.transport_percentage],
                          ['Activities', bb.activities_percentage],
                        ] as const;
                        return (
                          <div>
                            <div className="flex h-2 w-full overflow-hidden rounded bg-muted">
                              {items.map(([, value], i) => (
                                <div key={i} className="h-full" style={{ width: `${value}%`, backgroundColor: ['#60a5fa','#fbbf24','#34d399','#f472b6'][i % 4] }} />
                              ))}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {items.map((pair, i) => {
                                const [label, value] = pair as [string, number];
                                return (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: ['#60a5fa','#fbbf24','#34d399','#f472b6'][i % 4] }} />
                                    {label}: {value}%
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium mb-2">Musts & avoid</div>
                  <div className="space-y-1 text-muted-foreground">
                    {Array.isArray(response.request.must_visit_places) && response.request.must_visit_places.length > 0 && (<div>Must visit: {response.request.must_visit_places.join(', ')}</div>)}
                    {Array.isArray(response.request.avoid_places) && response.request.avoid_places.length > 0 && (<div>Avoid: {response.request.avoid_places.join(', ')}</div>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {Array.isArray(it?.daily_itineraries) && it.daily_itineraries.length > 0 && (
          <Card id="itinerary" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Daily Itinerary</CardTitle>
              <CardDescription>Explore each day&apos;s plan</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
              <Accordion type="single" collapsible defaultValue="day-1" className="w-full space-y-4">
                  {it.daily_itineraries.map((day: unknown, idx: number) => (
                  <AccordionItem key={idx} value={`day-${idx + 1}`} className="border-0 bg-transparent">
                    <AccordionTrigger className="relative pl-16 py-6 hover:no-underline group">
                      <div className="absolute left-4 top-6 w-4 h-4 rounded-full theme-bg border-4 border-white dark:border-gray-900 shadow-lg z-10 group-hover:scale-110 transition-transform"></div>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex flex-col items-start gap-2">
                          <div className="flex items-center gap-3">
                              {day?.day_number && <Badge variant="secondary" className="px-3 py-1">Day {day.day_number}</Badge>}
                              {day?.theme && <h3 className="text-lg font-semibold text-foreground">{day.theme}</h3>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {day?.date && (
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(day.date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {it?.currency && day?.daily_total_cost && (
                              <Badge variant="outline" className="px-3 py-1 font-medium">{day.daily_total_cost} {it.currency}</Badge>
                            )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative pl-16 pb-8">
                          <div className="rounded-2xl border bg-gradient-to-br from-white/80 to-gray-50/50 dark:from-gray-900/80 dark:to-gray-800/50 backdrop-blur-sm p-6 shadow-lg">
                            {(['morning','lunch','afternoon','evening'] as const).map((sectionKey) => {
                              const section: unknown = day?.[sectionKey];
                              if (!section) return null;
                              
                              if (sectionKey === 'lunch' && section.restaurant) {
                                const r = section.restaurant;
                                const lat = r?.coordinates?.lat;
                                const lng = r?.coordinates?.lng;
                                const dateKey = day?.date ? new Date(day.date).toISOString().slice(0,10) : 'na';
                                const wKey = (typeof lat === 'number' && typeof lng === 'number') ? `${lat.toFixed(3)},${lng.toFixed(3)}@${dateKey}` : undefined;
                                const w = wKey ? weatherMap[wKey] : undefined;
                                return (
                                  <div key={sectionKey} className="space-y-4">
                                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                      <span className="text-lg">🍽️</span>
                                      <h4 className="text-lg font-semibold capitalize text-foreground">{sectionKey}</h4>
                                    </div>
                                    <div className="p-6 rounded-xl border">
                                      <div className="mb-2 font-medium">{r?.name || 'Lunch'}</div>
                                      {r?.address && <div className="text-sm text-muted-foreground mb-2">{r.address}</div>}
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <GoogleMapsPreview lat={r?.coordinates?.lat} lng={r?.coordinates?.lng} placeId={r?.place_id} name={r?.name} ratio={16/9} className="w-full" />
                                        {Array.isArray(r?.photo_urls) && r.photo_urls.length > 0 && (
                                          <AutoCarousel images={r.photo_urls} className="w-full aspect-video" rounded="rounded-lg" showControls intervalMs={4000} imgAlt={r?.name || 'Restaurant'} />
                                        )}
                                      </div>
                                          {wKey && <CompactWeatherCard date={day?.date} w={w} />}
                                    </div>
                                  </div>
                                );
                              }
                              
                              if (!section.activities || section.activities.length === 0) return null;
                              
                              return (
                                <div key={sectionKey} className="space-y-4">
                                  <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                    <span className="text-lg">{sectionKey === 'morning' ? '🌅' : sectionKey === 'afternoon' ? '☀️' : '🌆'}</span>
                                    <h4 className="text-lg font-semibold capitalize text-foreground">{sectionKey}</h4>
                                  </div>
                                  {(section?.total_duration_hours || section?.estimated_cost || section?.transportation_notes) && (
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      {section?.total_duration_hours && <Badge variant="outline">Duration: {section.total_duration_hours} hrs</Badge>}
                                      {section?.estimated_cost && <Badge variant="outline">Cost: {formatCurrency(section.estimated_cost)}</Badge>}
                                      {section?.transportation_notes && <span className="opacity-80">{section.transportation_notes}</span>}
                                    </div>
                                  )}
                                  <div className="grid gap-4">
                                    {section.activities.map((act: unknown, aIdx: number) => {
                                      const p = act.activity || {};
                                      const lat = p?.coordinates?.lat;
                                      const lng = p?.coordinates?.lng;
                                      const dateKey = day?.date ? new Date(day.date).toISOString().slice(0,10) : 'na';
                                      const wKey = (typeof lat === 'number' && typeof lng === 'number') ? `${lat.toFixed(3)},${lng.toFixed(3)}@${dateKey}` : undefined;
                                      const w = wKey ? weatherMap[wKey] : undefined;
                                      return (
                                        <div key={aIdx} className="p-6 rounded-xl border">
                                          <div className="font-medium mb-1">{p?.name || act?.activity_type}</div>
                                          {p?.address && <div className="text-sm text-muted-foreground mb-2">{p.address}</div>}
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                                            <GoogleMapsPreview lat={p?.coordinates?.lat} lng={p?.coordinates?.lng} placeId={p?.place_id} name={p?.name} ratio={16/9} className="w-full" />
                                            {Array.isArray(p?.photo_urls) && p.photo_urls.length > 0 && (
                                              <AutoCarousel images={p.photo_urls} className="w-full aspect-video" rounded="rounded-lg" showControls intervalMs={4000} imgAlt={p?.name || 'Activity'} />
                                            )}
                                          </div>
                                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="space-y-1 text-muted-foreground">
                                              {p?.description && <div><span className="font-medium text-foreground">Why:</span> {p.description}</div>}
                                              {(p?.category || p?.subcategory || act?.activity_type) && (
                                                <div><span className="font-medium text-foreground">Type:</span> {(act?.activity_type || p?.subcategory || p?.category)}</div>
                                              )}
                                              {(p?.duration_hours || act?.duration_hours) && (
                                                <div><span className="font-medium text-foreground">Duration:</span> {(p?.duration_hours || act?.duration_hours)} hrs</div>
                                              )}
                                              {(typeof p?.rating === 'number') && (
                                                <div><span className="font-medium text-foreground">Rating:</span> {p.rating}{p?.user_ratings_total ? ` (${p.user_ratings_total})` : ''}</div>
                                              )}
                                              {p?.price_level && (
                                                <div><span className="font-medium text-foreground">Price level:</span> {p.price_level}</div>
                                              )}
                                            </div>
                                            <div className="space-y-1 text-muted-foreground">
                                              {(typeof act?.estimated_cost_per_person !== 'undefined' || typeof p?.estimated_cost !== 'undefined') && (
                                                <div><span className="font-medium text-foreground">Cost per person:</span> {formatCurrency(act?.estimated_cost_per_person ?? p?.estimated_cost)}</div>
                                              )}
                                              {typeof act?.group_cost !== 'undefined' && (
                                                <div><span className="font-medium text-foreground">Group cost:</span> {formatCurrency(act.group_cost)}</div>
                                              )}
                                              {Array.isArray(act?.age_suitability) && act.age_suitability.length > 0 && (
                                                <div><span className="font-medium text-foreground">Ages:</span> {act.age_suitability.join(', ')}</div>
                                              )}
                                              {act?.difficulty_level && (
                                                <div><span className="font-medium text-foreground">Difficulty:</span> {act.difficulty_level}</div>
                                              )}
                                              {(act?.advance_booking_required || p?.booking_required) && (
                                                <div><span className="font-medium text-foreground">Booking:</span> {act?.advance_booking_required || p?.booking_required ? 'Required' : 'Optional'}</div>
                                              )}
                                              {(p?.booking_url) && (
                                                <div><a href={p.booking_url} target="_blank" rel="noreferrer" className="underline">Booking link</a></div>
                                              )}
                                              {typeof act?.weather_dependent !== 'undefined' && (
                                                <div><span className="font-medium text-foreground">Weather dependent:</span> {act.weather_dependent ? 'Yes' : 'No'}</div>
                                              )}
                                              {wKey && <CompactWeatherCard date={day?.date} w={w} />}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            </CardContent>
          </Card>
        )}

        {Array.isArray(it?.travel_options) && it.travel_options.length > 0 && (
          <Card id="travel-options" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Travel options</CardTitle>
              <CardDescription>Ways to reach and move between places</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.travel_options.map((opt: unknown, i: number) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{opt.mode}</div>
                      {opt.estimated_cost && <Badge variant="secondary">{opt.estimated_cost} {it.currency}</Badge>}
                    </div>
                    {opt.details && (<p className="text-sm text-muted-foreground mt-1">{opt.details}</p>)}
                    {opt.booking_link && (
                      <div className="mt-2">
                        <a href={opt.booking_link} target="_blank" rel="noreferrer" className="text-sm underline">Book now</a>
                      </div>
                    )}
                    {Array.isArray(opt.legs) && opt.legs.length > 0 && (
                      <div className="mt-3 space-y-2 text-sm">
                        {opt.legs.map((leg: unknown, j: number) => (
                          <div key={j} className="p-3 rounded-md border">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{leg.mode}</div>
                              {leg.estimated_cost && <span className="text-muted-foreground">{leg.estimated_cost} {it.currency}</span>}
                            </div>
                            <div className="text-muted-foreground">{leg.from_location} → {leg.to_location}</div>
                            <div className="text-muted-foreground">{typeof leg.duration_hours === 'number' ? `${leg.duration_hours} hrs` : ''}</div>
                            {leg.notes && <div className="text-xs text-muted-foreground mt-1">{leg.notes}</div>}
                            {leg.booking_link && (
                              <div className="mt-2">
                                <a href={leg.booking_link} target="_blank" rel="noreferrer" className="text-xs underline">Book leg</a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {Array.isArray(it?.seasonal_considerations) && it.seasonal_considerations.length > 0 && (
          <Card id="season" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Seasonal considerations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {it.seasonal_considerations.map((item: string, i: number) => (<li key={i}>{item}</li>))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(it?.weather_forecast_summary || it?.local_information) && (
          <Card id="local-info" className="glass-card mb-8">
                <CardHeader>
              <CardTitle className="text-lg">Local information</CardTitle>
              {it.weather_forecast_summary && (<CardDescription>{it.weather_forecast_summary}</CardDescription>)}
                </CardHeader>
                <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {it.local_information?.language_info && (
                  <div>
                    <div className="font-medium mb-2">Languages</div>
                    <div className="text-muted-foreground">Primary: {it.local_information.language_info.primary_language}</div>
                    {it.local_information.language_info.secondary_languages && (
                      <div className="text-muted-foreground">Secondary: {it.local_information.language_info.secondary_languages}</div>
                    )}
                    {it.local_information.language_info.notes && (
                      <div className="text-muted-foreground mt-1">{it.local_information.language_info.notes}</div>
                    )}
                  </div>
                )}
                {Array.isArray(it.local_information?.safety_tips) && (
                  <div>
                    <div className="font-medium mb-2">Safety tips</div>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      {it.local_information.safety_tips.map((t: string, i: number) => (<li key={i}>{t}</li>))}
                    </ul>
                  </div>
                )}
                {it.local_information?.currency_info && (
                  <div>
                    <div className="font-medium mb-2">Currency</div>
                    <div className="text-muted-foreground">{it.local_information.currency_info.name} ({it.local_information.currency_info.symbol})</div>
                    {it.local_information.currency_info.exchange_rate_notes && (<div className="text-muted-foreground mt-1">{it.local_information.currency_info.exchange_rate_notes}</div>)}
                  </div>
                )}
                {it.local_information?.emergency_contacts && (
                  <div>
                    <div className="font-medium mb-2">Emergency contacts</div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      {Object.entries(it.local_information.emergency_contacts).map(([k,v]: unknown, i: number) => (<div key={i}><span className="font-medium capitalize">{k.replaceAll('_',' ')}:</span> {v as string}</div>))}
                    </div>
                  </div>
                )}
                {Array.isArray(it.local_information?.local_customs) && (
                  <div>
                    <div className="font-medium mb-2">Local customs</div>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      {it.local_information.local_customs.map((t: string, i: number) => (<li key={i}>{t}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(it.local_information?.cultural_etiquette) && (
                  <div>
                    <div className="font-medium mb-2">Cultural etiquette</div>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      {it.local_information.cultural_etiquette.map((t: string, i: number) => (<li key={i}>{t}</li>))}
                    </ul>
                  </div>
                )}
                {it.local_information?.useful_phrases && (
                  <div>
                    <div className="font-medium mb-2">Useful phrases</div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      {Object.entries(it.local_information.useful_phrases).map(([k,v]: unknown, i: number) => (<div key={i}><span className="font-medium">{k}:</span> {v as string}</div>))}
                    </div>
                  </div>
                )}
                  </div>
                </CardContent>
              </Card>
        )}

        {Array.isArray(it?.hidden_gems) && it.hidden_gems.length > 0 && (
          <Card id="gems" className="glass-card mb-8">
                <CardHeader>
              <CardTitle className="text-lg">Hidden gems</CardTitle>
              <CardDescription>Curated lesser-known spots</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.hidden_gems.map((gem: unknown, i: number) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{gem.name}</div>
                        {gem.address && <div className="text-sm text-muted-foreground">{gem.address}</div>}
                      </div>
                      {typeof gem.rating === 'number' && (
                        <Badge variant="secondary">{gem.rating}★</Badge>
                      )}
                    </div>
                    {gem.description && <p className="text-sm text-muted-foreground mt-2">{gem.description}</p>}
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <GoogleMapsPreview lat={gem?.coordinates?.lat} lng={gem?.coordinates?.lng} placeId={gem?.place_id} name={gem?.name} ratio={16/9} className="w-full" />
                      {Array.isArray(gem?.photo_urls) && gem.photo_urls.length > 0 && (
                        <AutoCarousel images={gem.photo_urls} className="w-full aspect-video" rounded="rounded-lg" showControls intervalMs={4000} imgAlt={gem?.name || 'Hidden gem'} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {Array.isArray(it?.photography_spots) && it.photography_spots.length > 0 && (
          <Card id="photo" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Photography spots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.photography_spots.map((spot: unknown, i: number) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{spot.name}</div>
                      {typeof spot.rating === 'number' && <Badge variant="secondary">{spot.rating}★</Badge>}
                    </div>
                    {spot.description && <p className="text-sm text-muted-foreground mt-1">{spot.description}</p>}
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <GoogleMapsPreview lat={spot?.coordinates?.lat} lng={spot?.coordinates?.lng} placeId={spot?.place_id} name={spot?.name} ratio={16/9} className="w-full" />
                      {Array.isArray(spot?.photo_urls) && spot.photo_urls.length > 0 && (
                        <AutoCarousel images={spot.photo_urls} className="w-full aspect-video" rounded="rounded-lg" showControls intervalMs={4000} imgAlt={spot?.name || 'Photography spot'} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {Array.isArray(it?.customization_suggestions) && it.customization_suggestions.length > 0 && (
          <Card id="customize" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Customization suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {it.customization_suggestions.map((s: string, i: number) => (<li key={i}>{s}</li>))}
              </ul>
            </CardContent>
          </Card>
        )}

        {Array.isArray(it?.packing_suggestions) && it.packing_suggestions.length > 0 && (
          <Card id="packing" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Packing suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {it.packing_suggestions.map((s: string, i: number) => (<Badge key={i} variant="secondary">{s}</Badge>))}
              </div>
            </CardContent>
          </Card>
        )}

        {it?.budget_breakdown && (
          <Card id="budget" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Budget breakdown</CardTitle>
              <CardDescription>Estimated costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {'total_budget' in it.budget_breakdown && (
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" />Total: {it.budget_breakdown.total_budget} {it.budget_breakdown.currency || it.currency}</div>
                )}
                {it.budget_breakdown.food_cost && (
                  <div>Food: {it.budget_breakdown.food_cost} {it.budget_breakdown.currency || it.currency}</div>
                )}
                {it.budget_breakdown.activities_cost && (
                  <div>Activities: {it.budget_breakdown.activities_cost} {it.budget_breakdown.currency || it.currency}</div>
                )}
                {it.budget_breakdown.transport_cost && (
                  <div>Transport: {it.budget_breakdown.transport_cost} {it.budget_breakdown.currency || it.currency}</div>
                )}
                {it.budget_breakdown.miscellaneous_cost && (
                  <div>Misc: {it.budget_breakdown.miscellaneous_cost} {it.budget_breakdown.currency || it.currency}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {it?.accommodations && (
          <Card id="stay" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Accommodation</CardTitle>
              <CardDescription>Top picks</CardDescription>
            </CardHeader>
            <CardContent>
              {it.accommodations.primary_recommendation && (
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{it.accommodations.primary_recommendation.name}</div>
                    <Badge variant="outline">Primary</Badge>
                  </div>
                  {it.accommodations.primary_recommendation.address && (
                    <p className="text-sm text-muted-foreground">{it.accommodations.primary_recommendation.address}</p>
                  )}
                  {it.accommodations.primary_recommendation.website && (
                    <a className="text-xs underline" href={it.accommodations.primary_recommendation.website} target="_blank" rel="noreferrer">Visit website</a>
                      )}
                    </div>
                  )}
                  <div className="space-y-3">
                {Array.isArray(it.accommodations.alternative_options) && it.accommodations.alternative_options.map((opt: unknown, i: number) => (
                      <div key={i} className="p-3 rounded-md border">
                        <div className="font-medium">{opt.name}</div>
                    {opt.address && <p className="text-sm text-muted-foreground">{opt.address}</p>}
                        {opt.website && (
                          <a className="text-xs underline" href={opt.website} target="_blank" rel="noreferrer">Visit website</a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
        )}

        {it?.transportation && (
          <Card id="transport" className="glass-card mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Transportation</CardTitle>
              <CardDescription>Transfers and local modes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {(it.transportation.airport_transfers?.arrival || it.transportation.airport_transfers?.departure) && (
                  <div>
                    <div className="font-medium mb-2">Airport transfers</div>
                    <div className="space-y-1 text-muted-foreground">
                      {it.transportation.airport_transfers?.arrival && (
                        <div>Arrival: {it.transportation.airport_transfers.arrival.mode} · {it.transportation.airport_transfers.arrival.estimated_cost} {it.currency}</div>
                      )}
                      {it.transportation.airport_transfers?.departure && (
                        <div>Departure: {it.transportation.airport_transfers.departure.mode} · {it.transportation.airport_transfers.departure.estimated_cost} {it.currency}</div>
                      )}
                    </div>
                  </div>
                )}
                {(it.transportation.local_transport_guide?.modes || it.transportation.local_transport_guide?.notes) && (
                  <div>
                    <div className="font-medium mb-2">Local transport</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(it.transportation.local_transport_guide?.modes || []).map((m: string, i: number) => (
                        <Badge key={i} variant="secondary" className="capitalize">{m.replaceAll('_',' ')}</Badge>
                      ))}
                    </div>
                    {it.transportation.local_transport_guide?.notes && (
                      <p className="text-muted-foreground break-words">{it.transportation.local_transport_guide.notes}</p>
                    )}
                  </div>
                )}
                {it.transportation.daily_transport_costs && (
                  <div>
                    <div className="font-medium mb-2">Daily transport costs</div>
                    <div className="space-y-1 text-muted-foreground">
                      {Object.entries(it.transportation.daily_transport_costs).map(([k,v]: unknown, i: number) => (
                        <div key={i}>{k}: {v} {it.currency}</div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            {Array.isArray(it.transportation.recommended_apps) && it.transportation.recommended_apps.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="font-medium mb-2 text-sm">Recommended apps</div>
                <div className="flex flex-wrap gap-2">
                  {it.transportation.recommended_apps.map((app: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{app}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {typeof it?.data_freshness_score === 'number' && (
          <div className="flex justify-end mb-8">
            <Badge variant="outline">Data freshness: {Math.round(it.data_freshness_score * 100)}%</Badge>
          </div>
        )}

        {(mapData?.static_map_url || mapData?.daily_route_maps || mapData?.all_locations) && (
          <Card id="maps" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Maps & locations</CardTitle>
              <CardDescription>Static map, daily routes and all locations</CardDescription>
            </CardHeader>
            <CardContent>
              {mapData.daily_route_maps && (
                <div className="">
                  <div className="font-medium mb-2">Day-wise routes</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(mapData.daily_route_maps).map(([day, url]: unknown, i: number) => (
                      <a key={i} href={url as string} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                        <span className="w-2 h-2 rounded-full theme-bg" />
                        {day}
                      </a>
                    ))}
                  </div>
                </div>
              )}
                </CardContent>
              </Card>
          )}
      </div>
    </div>
  );
}
