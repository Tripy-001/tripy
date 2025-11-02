'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GoogleMapsPreview from '@/components/GoogleMapsPreview';
import AutoCarousel from '@/components/AutoCarousel';
import ChatAssistant from '@/components/ChatAssistant';
import TripTodoList from '@/components/TripTodoList';
import TodoWidget from '@/components/TodoWidget';
import { useTripTodos } from '@/lib/hooks/useTripTodos';
import { MapPin, Calendar, Clock, DollarSign, Users, Star, Download, Cloud, CloudRain, Sun, Wind, Plane, Home, Package, Sparkles, Camera, Info, TrendingUp, Shield, Languages } from 'lucide-react';
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

  // Todo list hook
  const {
    todoDays,
    loading: todosLoading,
    initialized: todosInitialized,
    initializeTodos,
    toggleTodo,
    addTodo,
    updateTodo,
    deleteTodo,
  } = useTripTodos(tripId);

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

  const itineraryData = useMemo(() => (trip?.itinerary ?? {}), [trip]);
  const it = itineraryData;
  const mapData = useMemo(() => it?.map_data || {}, [it]);
  const currency = it?.currency || it?.budget_breakdown?.currency;

  // Auto-initialize todos from itinerary when trip loads (runs once per trip)
  useEffect(() => {
    if (!trip || !tripId || todosLoading || todosInitialized) return;
    
    // Only initialize if trip has itinerary data
    const hasItinerary = Array.isArray(trip?.itinerary?.daily_itineraries) && 
                        trip.itinerary.daily_itineraries.length > 0;
    if (!hasItinerary) return;

    console.log('[TodoList] Auto-initializing todos from itinerary');
    initializeTodos().catch(err => {
      console.error('[TodoList] Failed to initialize:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, tripId, todosLoading, todosInitialized]); // Only re-run if trip ID changes or initialization status changes

  const formatCurrency = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (!isFinite(num)) return String(val);
    return `${num} ${currency || ''}`.trim();
  };

  const scrollToChecklist = () => {
    const checklistElement = document.getElementById('checklist');
    if (checklistElement) {
      checklistElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    if (tripId) links.push({ href: '#checklist', label: 'Checklist' });
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
        <Accordion type="multiple" defaultValue={["overview"]} className="w-full">
          <AccordionItem value="overview" className="border-0">
            <Card id="overview" className="glass-card mb-8 border-2">
              <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-semibold">Itinerary Overview</div>
                        {response?.summary && (
                          <div className="text-sm text-muted-foreground max-w-3xl">{response.summary}</div>
                        )}
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {it?.origin && it?.destination && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route</span>
                        </div>
                        <div className="text-sm font-medium text-foreground">{it.origin} → {it.destination}</div>
                      </div>
                    )}
                    
                    {it?.trip_duration_days && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</span>
                        </div>
                        <div className="text-sm font-medium text-foreground">{it.trip_duration_days} day(s)</div>
                      </div>
                    )}
                    
                    {(it?.group_size || response?.request?.group_size) && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group</span>
                        </div>
                        <div className="text-sm font-medium text-foreground">{it.group_size ?? response.request.group_size} people</div>
                      </div>
                    )}
                    
                    {(it?.total_budget && it?.currency) && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                            <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget</span>
                        </div>
                        <div className="text-sm font-medium text-foreground">{it.total_budget} {it.currency}</div>
                      </div>
                    )}
                    
                    {(it?.travel_style || response?.request?.primary_travel_style) && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border-2 border-rose-200 dark:border-rose-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900">
                            <Star className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Style</span>
                        </div>
                        <div className="text-sm font-medium text-foreground capitalize">{it.travel_style ?? response.request.primary_travel_style}</div>
                      </div>
                    )}
                    
                    {(it?.activity_level || response?.request?.activity_level) && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border-2 border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity</span>
                        </div>
                        <div className="text-sm font-medium text-foreground capitalize">{it.activity_level ?? response.request.activity_level}</div>
                      </div>
                    )}
                  </div>

            {it?.map_data?.interactive_map_embed_url && (
              <div className="rounded-2xl overflow-hidden border mb-4">
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
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

        {Array.isArray(it?.daily_itineraries) && it.daily_itineraries.length > 0 && (
          <Accordion type="multiple" defaultValue={["daily-itinerary"]} className="w-full">
            <AccordionItem value="daily-itinerary" className="border-0">
              <Card id="itinerary" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900">
                          <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Daily Itinerary</div>
                          <div className="text-sm text-muted-foreground">Explore each day&apos;s plan</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
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
                                    <div className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="space-y-4">
                                        {/* Title and Address */}
                                        <div>
                                          <h5 className="font-semibold text-lg text-foreground mb-1.5">{r?.name || 'Lunch'}</h5>
                                          {r?.address && <p className="text-sm text-muted-foreground">{r.address}</p>}
                                        </div>

                                        {/* Media Section */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          <GoogleMapsPreview lat={r?.coordinates?.lat} lng={r?.coordinates?.lng} placeId={r?.place_id} name={r?.name} ratio={16/9} className="w-full" />
                                          {Array.isArray(r?.photo_urls) && r.photo_urls.length > 0 && (
                                            <AutoCarousel images={r.photo_urls} className="w-full aspect-video" rounded="rounded-lg" showControls intervalMs={4000} imgAlt={r?.name || 'Restaurant'} />
                                          )}
                                        </div>

                                        {/* Weather Card */}
                                        {wKey && (
                                          <div className="pt-2">
                                            <CompactWeatherCard date={day?.date} w={w} />
                                          </div>
                                        )}
                                      </div>
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
                                        <div key={aIdx} className="p-5 rounded-xl border bg-gradient-to-br from-background to-muted/20 shadow-sm hover:shadow-md transition-shadow">
                                          <div className="space-y-4">
                                            {/* Title and Address */}
                                            <div>
                                              <h5 className="font-semibold text-lg text-foreground mb-1.5">{p?.name || act?.activity_type}</h5>
                                              {p?.address && <p className="text-sm text-muted-foreground flex items-center gap-1.5">{p.address}</p>}
                                            </div>

                                            {/* Media Section */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                              <GoogleMapsPreview lat={p?.coordinates?.lat} lng={p?.coordinates?.lng} placeId={p?.place_id} name={p?.name} ratio={16/9} className="w-full" />
                                              {Array.isArray(p?.photo_urls) && p.photo_urls.length > 0 && (
                                                <AutoCarousel images={p.photo_urls} className="w-full aspect-video" rounded="rounded-lg" showControls intervalMs={4000} imgAlt={p?.name || 'Activity'} />
                                              )}
                                            </div>

                                            {/* Information Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2">
                                              <div className="space-y-2.5">
                                                {p?.description && (
                                                  <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-foreground text-xs uppercase tracking-wide">Why Visit</span>
                                                    <span className="text-muted-foreground">{p.description}</span>
                                                  </div>
                                                )}
                                                {(p?.category || p?.subcategory || act?.activity_type) && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[70px]">Type:</span>
                                                    <span className="text-muted-foreground">{act?.activity_type || p?.subcategory || p?.category}</span>
                                                  </div>
                                                )}
                                                {(p?.duration_hours || act?.duration_hours) && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[70px]">Duration:</span>
                                                    <span className="text-muted-foreground">{p?.duration_hours || act?.duration_hours} hrs</span>
                                                  </div>
                                                )}
                                                {(typeof p?.rating === 'number') && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[70px]">Rating:</span>
                                                    <span className="text-muted-foreground">{p.rating}{p?.user_ratings_total ? ` (${p.user_ratings_total} reviews)` : ''}</span>
                                                  </div>
                                                )}
                                                {p?.price_level && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[70px]">Price Level:</span>
                                                    <span className="text-muted-foreground">{p.price_level}</span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="space-y-2.5">
                                                {(typeof act?.estimated_cost_per_person !== 'undefined' || typeof p?.estimated_cost !== 'undefined') && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[100px]">Cost/Person:</span>
                                                    <span className="text-muted-foreground">{formatCurrency(act?.estimated_cost_per_person ?? p?.estimated_cost)}</span>
                                                  </div>
                                                )}
                                                {typeof act?.group_cost !== 'undefined' && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[100px]">Group Cost:</span>
                                                    <span className="text-muted-foreground">{formatCurrency(act.group_cost)}</span>
                                                  </div>
                                                )}
                                                {Array.isArray(act?.age_suitability) && act.age_suitability.length > 0 && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[100px]">Ages:</span>
                                                    <span className="text-muted-foreground">{act.age_suitability.join(', ')}</span>
                                                  </div>
                                                )}
                                                {act?.difficulty_level && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[100px]">Difficulty:</span>
                                                    <span className="text-muted-foreground">{act.difficulty_level}</span>
                                                  </div>
                                                )}
                                                {(act?.advance_booking_required || p?.booking_required) && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[100px]">Booking:</span>
                                                    <span className="text-muted-foreground">{act?.advance_booking_required || p?.booking_required ? 'Required' : 'Optional'}</span>
                                                  </div>
                                                )}
                                                {p?.booking_url && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[100px]">Book Now:</span>
                                                    <a href={p.booking_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Booking Link →</a>
                                                  </div>
                                                )}
                                                {typeof act?.weather_dependent !== 'undefined' && (
                                                  <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-foreground min-w-[100px]">Weather:</span>
                                                    <span className="text-muted-foreground">{act.weather_dependent ? 'Dependent' : 'Independent'}</span>
                                                  </div>
                                                )}
                                                {wKey && (
                                                  <div className="pt-2">
                                                    <CompactWeatherCard date={day?.date} w={w} />
                                                  </div>
                                                )}
                                              </div>
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
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {Array.isArray(it?.travel_options) && it.travel_options.length > 0 && (
          <Accordion type="multiple" defaultValue={["travel-options"]} className="w-full">
            <AccordionItem value="travel-options" className="border-0">
              <Card id="travel-options" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-xl font-semibold">Travel Options</div>
                          <div className="text-sm text-muted-foreground">Ways to reach and move between places</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {it.travel_options.map((opt: unknown, i: number) => (
                  <div key={i} className="group relative p-6 rounded-2xl border-2 hover:border-blue-300 dark:hover:border-blue-700 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 transition-all hover:shadow-lg">
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                      <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-bold text-lg text-foreground">{opt.mode}</div>
                      {opt.estimated_cost && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-3 py-1">
                          {opt.estimated_cost} {it.currency}
                        </Badge>
                      )}
                    </div>
                    {opt.details && (<p className="text-sm text-muted-foreground mb-3 leading-relaxed">{opt.details}</p>)}
                    {opt.booking_link && (
                      <a href={opt.booking_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mb-3">
                        <span>Book now</span>
                        <span>→</span>
                      </a>
                    )}
                    {Array.isArray(opt.legs) && opt.legs.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Journey Legs</div>
                        {opt.legs.map((leg: unknown, j: number) => (
                          <div key={j} className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 border">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="font-semibold">{leg.mode}</Badge>
                              {leg.estimated_cost && <span className="text-sm font-medium text-muted-foreground">{leg.estimated_cost} {it.currency}</span>}
                            </div>
                            <div className="text-sm font-medium text-foreground flex items-center gap-2">
                              <span>{leg.from_location}</span>
                              <span className="text-blue-500">→</span>
                              <span>{leg.to_location}</span>
                            </div>
                            {typeof leg.duration_hours === 'number' && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {leg.duration_hours} hrs
                              </div>
                            )}
                            {leg.notes && <div className="text-xs text-muted-foreground mt-2 italic">{leg.notes}</div>}
                            {leg.booking_link && (
                              <a href={leg.booking_link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                Book this leg →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {Array.isArray(it?.seasonal_considerations) && it.seasonal_considerations.length > 0 && (
          <Accordion type="multiple" defaultValue={["seasonal-considerations"]} className="w-full">
            <AccordionItem value="seasonal-considerations" className="border-0">
              <Card id="season" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                          <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Seasonal Considerations</div>
                          <div className="text-sm text-muted-foreground">Important seasonal insights for your trip</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {it.seasonal_considerations.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 border">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sun className="w-3 h-3 text-white" />
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {(it?.weather_forecast_summary || it?.local_information) && (
          <Accordion type="multiple" defaultValue={["local-information"]} className="w-full">
            <AccordionItem value="local-information" className="border-0">
              <Card id="local-info" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                          <Info className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Local Information</div>
                          {it.weather_forecast_summary && (<div className="text-sm text-muted-foreground">{it.weather_forecast_summary}</div>)}
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {it.local_information?.language_info && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Languages className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h4 className="font-bold text-foreground">Languages</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-foreground">Primary:</span>
                        <span className="ml-2 text-muted-foreground">{it.local_information.language_info.primary_language}</span>
                      </div>
                      {it.local_information.language_info.secondary_languages && (
                        <div>
                          <span className="font-medium text-foreground">Secondary:</span>
                          <span className="ml-2 text-muted-foreground">{it.local_information.language_info.secondary_languages}</span>
                        </div>
                      )}
                      {it.local_information.language_info.notes && (
                        <p className="text-muted-foreground italic mt-2 pt-2 border-t border-purple-200 dark:border-purple-800">{it.local_information.language_info.notes}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {it.local_information?.currency_info && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h4 className="font-bold text-foreground">Currency</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold text-lg text-foreground">
                        {it.local_information.currency_info.name} ({it.local_information.currency_info.symbol})
                      </div>
                      {it.local_information.currency_info.exchange_rate_notes && (
                        <p className="text-muted-foreground italic mt-2 pt-2 border-t border-green-200 dark:border-green-800">{it.local_information.currency_info.exchange_rate_notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {it.local_information?.emergency_contacts && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/10 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <h4 className="font-bold text-foreground">Emergency Contacts</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {Object.entries(it.local_information.emergency_contacts).map(([k,v]: unknown, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                          <span className="font-medium capitalize text-foreground">{k.replaceAll('_',' ')}</span>
                          <span className="font-bold text-red-600 dark:text-red-400">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(it.local_information?.safety_tips) && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-bold text-foreground">Safety Tips</h4>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {it.local_information.safety_tips.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                          <span className="text-muted-foreground">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(it.local_information?.local_customs) && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/10 border-2 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h4 className="font-bold text-foreground">Local Customs</h4>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {it.local_information.local_customs.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
                          <span className="text-muted-foreground">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(it.local_information?.cultural_etiquette) && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/10 border-2 border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      <h4 className="font-bold text-foreground">Cultural Etiquette</h4>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {it.local_information.cultural_etiquette.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0 mt-2" />
                          <span className="text-muted-foreground">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {it.local_information?.useful_phrases && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/10 border-2 border-violet-200 dark:border-violet-800 md:col-span-2 lg:col-span-3">
                    <div className="flex items-center gap-2 mb-4">
                      <Languages className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      <h4 className="font-bold text-foreground">Useful Phrases</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(it.local_information.useful_phrases).map(([k,v]: unknown, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border border-violet-200 dark:border-violet-800">
                          <div className="font-semibold text-foreground mb-1">{k}</div>
                          <div className="text-sm text-violet-600 dark:text-violet-400 font-medium">{v as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {Array.isArray(it?.hidden_gems) && it.hidden_gems.length > 0 && (
          <Accordion type="multiple" defaultValue={["hidden-gems"]} className="w-full">
            <AccordionItem value="hidden-gems" className="border-0">
              <Card id="gems" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
                          <Camera className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Hidden Gems</div>
                          <div className="text-sm text-muted-foreground">Curated lesser-known spots for authentic experiences</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {it.hidden_gems.map((gem: unknown, i: number) => (
                  <div key={i} className="group p-5 rounded-xl bg-gradient-to-br from-teal-50/50 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border-2 hover:border-teal-300 dark:hover:border-teal-700 transition-all hover:shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-bold text-foreground text-lg">{gem.name}</div>
                        </div>
                        {gem.address && <div className="text-sm text-muted-foreground ml-10">{gem.address}</div>}
                      </div>
                      {typeof gem.rating === 'number' && (
                        <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 flex-shrink-0">
                          {gem.rating}★
                        </Badge>
                      )}
                    </div>
                    {gem.description && (
                      <p className="text-sm text-foreground leading-relaxed mb-4 ml-10">{gem.description}</p>
                    )}
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <GoogleMapsPreview lat={gem?.coordinates?.lat} lng={gem?.coordinates?.lng} placeId={gem?.place_id} name={gem?.name} ratio={16/9} className="w-full rounded-lg overflow-hidden border-2 border-teal-200 dark:border-teal-800" />
                      {Array.isArray(gem?.photo_urls) && gem.photo_urls.length > 0 && (
                        <AutoCarousel images={gem.photo_urls} className="w-full aspect-video border-2 border-teal-200 dark:border-teal-800" rounded="rounded-lg" showControls imgAlt={gem?.name || 'Hidden gem'} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {Array.isArray(it?.photography_spots) && it.photography_spots.length > 0 && (
          <Accordion type="multiple" defaultValue={["photography-spots"]} className="w-full">
            <AccordionItem value="photography-spots" className="border-0">
              <Card id="photo" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                          <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Photography Spots</div>
                          <div className="text-sm text-muted-foreground">Perfect locations to capture memorable moments</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {it.photography_spots.map((spot: unknown, i: number) => (
                  <div key={i} className="group p-5 rounded-xl bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10 border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                            <Camera className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-bold text-foreground text-lg">{spot.name}</div>
                        </div>
                        {spot.address && <div className="text-sm text-muted-foreground ml-10">{spot.address}</div>}
                      </div>
                      {typeof spot.rating === 'number' && (
                        <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 flex-shrink-0">
                          {spot.rating}★
                        </Badge>
                      )}
                    </div>
                    {spot.description && (
                      <p className="text-sm text-foreground leading-relaxed mb-4 ml-10">{spot.description}</p>
                    )}
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <GoogleMapsPreview lat={spot?.coordinates?.lat} lng={spot?.coordinates?.lng} placeId={spot?.place_id} name={spot?.name} ratio={16/9} className="w-full rounded-lg overflow-hidden border-2 border-purple-200 dark:border-purple-800" />
                      {Array.isArray(spot?.photo_urls) && spot.photo_urls.length > 0 && (
                        <AutoCarousel images={spot.photo_urls} className="w-full aspect-video border-2 border-purple-200 dark:border-purple-800" rounded="rounded-lg" showControls imgAlt={spot?.name || 'Photography spot'} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {Array.isArray(it?.customization_suggestions) && it.customization_suggestions.length > 0 && (
          <Accordion type="multiple" defaultValue={["customization"]} className="w-full">
            <AccordionItem value="customization" className="border-0">
              <Card id="customize" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900">
                          <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Customization Suggestions</div>
                          <div className="text-sm text-muted-foreground">Tailor your trip to perfection</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.customization_suggestions.map((s: string, i: number) => (
                  <div key={i} className="group p-5 rounded-xl bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-pink-950/20 dark:to-rose-950/10 border-2 hover:border-pink-300 dark:hover:border-pink-700 transition-all hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1">{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {Array.isArray(it?.packing_suggestions) && it.packing_suggestions.length > 0 && (
          <Accordion type="multiple" defaultValue={["packing"]} className="w-full">
            <AccordionItem value="packing" className="border-0">
              <Card id="packing" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                          <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Packing Suggestions</div>
                          <div className="text-sm text-muted-foreground">Essential items for your journey</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                {it.packing_suggestions.map((s: string, i: number) => (
                  <Badge key={i} className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-200 dark:border-indigo-800 hover:from-indigo-200 hover:to-blue-200 dark:hover:from-indigo-800 dark:hover:to-blue-800 transition-colors">
                    {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {it?.budget_breakdown && (
          <Accordion type="multiple" defaultValue={["budget"]} className="w-full">
            <AccordionItem value="budget" className="border-0">
              <Card id="budget" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                          <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Budget Breakdown</div>
                          <div className="text-sm text-muted-foreground">Estimated costs for your trip</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {'total_budget' in it.budget_breakdown && (
                  <div className="md:col-span-2 lg:col-span-3 p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90 mb-1">Total Budget</div>
                        <div className="text-3xl font-bold">{it.budget_breakdown.total_budget} {it.budget_breakdown.currency || it.currency}</div>
                      </div>
                      <DollarSign className="w-12 h-12 opacity-20" />
                    </div>
                  </div>
                )}
                
                {it.budget_breakdown.food_cost && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 border-2 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <span className="text-xl">🍽️</span>
                      </div>
                      <div className="font-semibold text-foreground">Food</div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{it.budget_breakdown.food_cost} {it.budget_breakdown.currency || it.currency}</div>
                  </div>
                )}

                {it.budget_breakdown.activities_cost && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <span className="text-xl">🎯</span>
                      </div>
                      <div className="font-semibold text-foreground">Activities</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{it.budget_breakdown.activities_cost} {it.budget_breakdown.currency || it.currency}</div>
                  </div>
                )}

                {it.budget_breakdown.transport_cost && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/10 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-xl">🚗</span>
                      </div>
                      <div className="font-semibold text-foreground">Transport</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{it.budget_breakdown.transport_cost} {it.budget_breakdown.currency || it.currency}</div>
                  </div>
                )}

                {it.budget_breakdown.accommodation_cost && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/10 border-2 border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                        <span className="text-xl">🏨</span>
                      </div>
                      <div className="font-semibold text-foreground">Accommodation</div>
                    </div>
                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{it.budget_breakdown.accommodation_cost} {it.budget_breakdown.currency || it.currency}</div>
                  </div>
                )}

                {it.budget_breakdown.miscellaneous_cost && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/10 border-2 border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                        <span className="text-xl">📦</span>
                      </div>
                      <div className="font-semibold text-foreground">Miscellaneous</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{it.budget_breakdown.miscellaneous_cost} {it.budget_breakdown.currency || it.currency}</div>
                  </div>
                )}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {it?.accommodations && (
          <Accordion type="multiple" defaultValue={["accommodations"]} className="w-full">
            <AccordionItem value="accommodations" className="border-0">
              <Card id="stay" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900">
                          <Home className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Accommodation</div>
                          <div className="text-sm text-muted-foreground">Recommended places to stay</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              {it.accommodations.primary_recommendation && (
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge className="bg-white/20 text-white border-white/40 mb-2">Primary Recommendation</Badge>
                      <h3 className="text-2xl font-bold">{it.accommodations.primary_recommendation.name}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Home className="w-6 h-6" />
                    </div>
                  </div>
                  {it.accommodations.primary_recommendation.address && (
                    <p className="text-white/90 mb-3">{it.accommodations.primary_recommendation.address}</p>
                  )}
                  {it.accommodations.primary_recommendation.website && (
                    <a className="inline-flex items-center gap-2 text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors" href={it.accommodations.primary_recommendation.website} target="_blank" rel="noreferrer">
                      Visit website
                      <span>→</span>
                    </a>
                  )}
                </div>
              )}
              
              {Array.isArray(it.accommodations.alternative_options) && it.accommodations.alternative_options.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-4">Alternative Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {it.accommodations.alternative_options.map((opt: unknown, i: number) => (
                      <div key={i} className="p-5 rounded-xl bg-gradient-to-br from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10 border-2 border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all">
                        <div className="font-bold text-foreground mb-2">{opt.name}</div>
                        {opt.address && <p className="text-sm text-muted-foreground mb-3">{opt.address}</p>}
                        {opt.website && (
                          <a className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline" href={opt.website} target="_blank" rel="noreferrer">
                            Visit website
                            <span>→</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {it?.transportation && (
          <Accordion type="multiple" defaultValue={["transportation"]} className="w-full">
            <AccordionItem value="transportation" className="border-0">
              <Card id="transport" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                          <Plane className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Transportation</div>
                          <div className="text-sm text-muted-foreground">Transfers and local transport options</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {(it.transportation.airport_transfers?.arrival || it.transportation.airport_transfers?.departure) && (
                  <div className="lg:col-span-1 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-bold text-foreground">Airport Transfers</h4>
                    </div>
                    <div className="space-y-3">
                      {it.transportation.airport_transfers?.arrival && (
                        <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-900/60">
                          <div className="text-xs text-muted-foreground mb-1">Arrival</div>
                          <div className="font-semibold text-foreground">{it.transportation.airport_transfers.arrival.mode}</div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">{it.transportation.airport_transfers.arrival.estimated_cost} {it.currency}</div>
                        </div>
                      )}
                      {it.transportation.airport_transfers?.departure && (
                        <div className="p-3 rounded-lg bg-white/60 dark:bg-gray-900/60">
                          <div className="text-xs text-muted-foreground mb-1">Departure</div>
                          <div className="font-semibold text-foreground">{it.transportation.airport_transfers.departure.mode}</div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">{it.transportation.airport_transfers.departure.estimated_cost} {it.currency}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {(it.transportation.local_transport_guide?.modes || it.transportation.local_transport_guide?.notes) && (
                  <div className="lg:col-span-1 p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🚌</span>
                      <h4 className="font-bold text-foreground">Local Transport</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(it.transportation.local_transport_guide?.modes || []).map((m: string, i: number) => (
                        <Badge key={i} className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 capitalize">
                          {m.replaceAll('_',' ')}
                        </Badge>
                      ))}
                    </div>
                    {it.transportation.local_transport_guide?.notes && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{it.transportation.local_transport_guide.notes}</p>
                    )}
                  </div>
                )}
                
                {it.transportation.daily_transport_costs && (
                  <div className="lg:col-span-1 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border-2 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h4 className="font-bold text-foreground">Daily Costs</h4>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(it.transportation.daily_transport_costs).map(([k,v]: unknown, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-gray-900/60">
                          <span className="text-sm font-medium text-foreground">{k}</span>
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{v} {it.currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {Array.isArray(it.transportation.recommended_apps) && it.transportation.recommended_apps.length > 0 && (
                <div className="p-5 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/10 border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📱</span>
                    <h4 className="font-bold text-foreground">Recommended Apps</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {it.transportation.recommended_apps.map((app: string, i: number) => (
                      <Badge key={i} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        {app}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}        
        
        {typeof it?.data_freshness_score === 'number' && (
          <div className="flex justify-end mb-8">
            <Badge variant="outline">Data freshness: {Math.round(it.data_freshness_score * 100)}%</Badge>
          </div>
        )}

        {(mapData?.static_map_url || mapData?.daily_route_maps || mapData?.all_locations) && (
          <Accordion type="multiple" defaultValue={["maps"]} className="w-full">
            <AccordionItem value="maps" className="border-0">
              <Card id="maps" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                          <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-xl font-semibold">Maps & Locations</div>
                          <div className="text-sm text-muted-foreground">Navigate your journey with daily routes and location guides</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-6">
              {mapData.daily_route_maps && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 border-2 border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-foreground">Day-wise Routes</h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(mapData.daily_route_maps)
                      .sort(([dayA], [dayB]) => {
                        // Extract day numbers from strings like "Day 1", "Day 2", etc.
                        const numA = parseInt((dayA as string).match(/\d+/)?.[0] || '0');
                        const numB = parseInt((dayB as string).match(/\d+/)?.[0] || '0');
                        return numA - numB;
                      })
                      .map(([day, url]: unknown, i: number) => (
                      <a key={i} href={url as string} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:scale-125 transition-transform" />
                        <span className="text-foreground">{day}</span>
                        <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}
        
        {/* Trip Checklist */}
        {tripId && (
          <div id="checklist" className="mb-8">
            <TripTodoList
              tripId={tripId}
              initialDays={todoDays}
              onTodoToggle={toggleTodo}
              onTodoAdd={addTodo}
              onTodoUpdate={updateTodo}
              onTodoDelete={deleteTodo}
            />
          </div>
        )}
      </div>

      {/* AI Travel Assistant - Only show when trip is loaded */}
      {tripId && <ChatAssistant tripId={tripId} />}

      {/* Floating Todo Widget */}
      {tripId && todoDays.length > 0 && (
        <TodoWidget
          todoDays={todoDays}
          onToggleTodo={toggleTodo}
          onScrollToChecklist={scrollToChecklist}
        />
      )}
    </div>
  );
}
