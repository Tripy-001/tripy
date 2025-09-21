import React from 'react';
import { headers } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GoogleMapsPreview from '@/components/GoogleMapsPreview';
import { AI_RESPONSE as SAMPLE_CONST } from '@/app/constant';
import { MapPin, Calendar, Clock, DollarSign, Users, Star } from 'lucide-react';
import ScrollSpyTabs from '@/components/ScrollSpyTabs';
import { Button } from '@/components/ui/button';

type PublicTrip = unknown;

async function fetchPublicTrip(id: string): Promise<PublicTrip | null> {
  try {
    const h = await headers();
    const host = h.get('host') || '';
    const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;
    const res = await fetch(`${baseUrl}/api/public_trips/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.trip || null;
  } catch (error) {
    console.error("Something went wrong", error)
    return null;
  }
}

export default async function PublicTripsPage(
  input: { params: { id: string } } | Promise<{ params: { id: string } }>
) {
  const resolved: any = (typeof (input as any)?.then === 'function') ? await (input as any) : input;
  const id = resolved?.params?.id;
  const fetchedTrip = id ? await fetchPublicTrip(id) : null;
  const sampleTrip = SAMPLE_CONST?.trip ?? null;
  const trip = fetchedTrip || sampleTrip;

  if (!trip) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Trip not found</h2>
            <p className="text-muted-foreground">We couldn't load this public trip.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const response = trip;
  const it = response?.itinerary || {};
  const mapData = it?.map_data || {};

  const sectionLinks: Array<{ href: string; label: string }> = [];
  sectionLinks.push({ href: '#overview', label: 'Overview' });
  if (response?.request) sectionLinks.push({ href: '#request', label: 'Request' });
  if (Array.isArray(it?.daily_itineraries) && it.daily_itineraries.length) sectionLinks.push({ href: '#itinerary', label: 'Itinerary' });
  if (Array.isArray(it?.travel_options) && it.travel_options.length) sectionLinks.push({ href: '#travel-options', label: 'Travel options' });
  if (Array.isArray(it?.seasonal_considerations) && it.seasonal_considerations.length) sectionLinks.push({ href: '#season', label: 'Seasonal' });
  if (it?.local_information || it?.weather_forecast_summary) sectionLinks.push({ href: '#local-info', label: 'Local info' });
  if (Array.isArray(it?.hidden_gems) && it.hidden_gems.length) sectionLinks.push({ href: '#gems', label: 'Hidden gems' });
  if (Array.isArray(it?.photography_spots) && it.photography_spots.length) sectionLinks.push({ href: '#photo', label: 'Photography' });
  if (Array.isArray(it?.customization_suggestions) && it.customization_suggestions.length) sectionLinks.push({ href: '#customize', label: 'Customize' });
  if (Array.isArray(it?.packing_suggestions) && it.packing_suggestions.length) sectionLinks.push({ href: '#packing', label: 'Packing' });
  if (it?.budget_breakdown) sectionLinks.push({ href: '#budget', label: 'Budget' });
  if (it?.accommodations) sectionLinks.push({ href: '#stay', label: 'Stay' });
  if (it?.transportation) sectionLinks.push({ href: '#transport', label: 'Transport' });
  if (mapData?.static_map_url || mapData?.daily_route_maps || mapData?.all_locations) sectionLinks.push({ href: '#maps', label: 'Maps' });

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
              {response?.updated_at && (
                <Badge variant="outline">Updated {new Date(response.updated_at).toLocaleDateString()}</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero thumbnail */}
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
                  {response?.source_trip_id && <Badge variant="secondary">Source: {response.source_trip_id}</Badge>}
                  {response?.schema_version && <Badge variant="secondary">Schema v{response.schema_version}</Badge>}
                  {it?.version && <Badge variant="secondary">Itinerary v{it.version}</Badge>}
                  {typeof it?.confidence_score === 'number' && <Badge variant="outline" className="bg-white/20 text-white border-white/40">Confidence: {Math.round(it.confidence_score * 100)}%</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section nav */}
      <div className="bg-white/70 sticky top-16 z-40 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSpyTabs links={sectionLinks} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview */}
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

            {/* Map embed if available */}
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

            {/* Meta timestamps */}
            <div className="mt-4 text-xs text-muted-foreground flex flex-wrap gap-4">
              {response?.created_at && (<span>Created: {new Date(response.created_at).toLocaleString()}</span>)}
              {response?.updated_at && (<span>Updated: {new Date(response.updated_at).toLocaleString()}</span>)}
              {it?.last_updated && (<span>Itinerary updated: {new Date(it.last_updated).toLocaleString()}</span>)}
              {it?.generated_at && (<span>Generated: {new Date(it.generated_at).toLocaleString()}</span>)}
            </div>
          </CardContent>
        </Card>

        {/* Request details */}
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
                        const bb: any = response.request.budget_breakdown;
                        const items = [
                          ['Accommodation', bb.accommodation_percentage],
                          ['Food', bb.food_percentage],
                          ['Transport', bb.transport_percentage],
                          ['Activities', bb.activities_percentage],
                        ] as const;
                        return (
                          <div>
                            <div className="flex h-2 w-full overflow-hidden rounded bg-muted">
                              {items.map(([label, value], i) => (
                                <div key={i} className="h-full" style={{ width: `${value}%`, backgroundColor: ['#60a5fa','#fbbf24','#34d399','#f472b6'][i % 4] }} />
                              ))}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {items.map(([label, value], i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: ['#60a5fa','#fbbf24','#34d399','#f472b6'][i % 4] }} />
                                  {label}: {value}%
                                </div>
                              ))}
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

        {/* Daily itinerary */}
        {Array.isArray(it?.daily_itineraries) && it.daily_itineraries.length > 0 && (
          <Card id="itinerary" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Daily Itinerary</CardTitle>
              <CardDescription>Explore each day's plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
                <Accordion type="single" collapsible defaultValue="day-1" className="w-full space-y-4">
                  {it.daily_itineraries.map((day: any, idx: number) => (
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
                              const section: any = day?.[sectionKey];
                              if (!section) return null;

                              if (sectionKey === 'lunch' && section.restaurant) {
                                const r = section.restaurant;
                                return (
                                  <div key={sectionKey} className="space-y-4">
                                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                      <span className="text-lg">🍽️</span>
                                      <h4 className="text-lg font-semibold capitalize text-foreground">{sectionKey}</h4>
                                    </div>
                                    <div className="p-6 rounded-xl border">
                                      <div className="mb-2 font-medium">{r?.name || 'Lunch'}</div>
                                      {r?.address && <div className="text-sm text-muted-foreground mb-2">{r.address}</div>}
                                      <GoogleMapsPreview lat={r?.coordinates?.lat} lng={r?.coordinates?.lng} placeId={r?.place_id} name={r?.name} ratio={16/10} className="w-full" />
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
                                  <div className="grid gap-4">
                                    {section.activities.map((act: any, aIdx: number) => {
                                      const p = act.activity || {};
                                      return (
                                        <div key={aIdx} className="p-6 rounded-xl border">
                                          <div className="font-medium mb-1">{p?.name || act?.activity_type}</div>
                                          {p?.address && <div className="text-sm text-muted-foreground mb-2">{p.address}</div>}
                                          <GoogleMapsPreview lat={p?.coordinates?.lat} lng={p?.coordinates?.lng} placeId={p?.place_id} name={p?.name} ratio={16/10} className="w-full" />
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

        {/* Travel options */}
        {Array.isArray(it?.travel_options) && it.travel_options.length > 0 && (
          <Card id="travel-options" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Travel options</CardTitle>
              <CardDescription>Ways to reach and move between places</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.travel_options.map((opt: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{opt.mode}</div>
                      {opt.estimated_cost && <Badge variant="secondary">{opt.estimated_cost} {it.currency}</Badge>}
                    </div>
                    {opt.details && (<p className="text-sm text-muted-foreground mt-1">{opt.details}</p>)}
                    {opt.booking_link && (
                      <div className="mt-2">
                        <Button size="sm" className="theme-bg theme-bg-hover text-primary-foreground shadow-sm" asChild>
                          <a href={opt.booking_link} target="_blank" rel="noreferrer">Book now</a>
                        </Button>
                      </div>
                    )}
                    {Array.isArray(opt.legs) && opt.legs.length > 0 && (
                      <div className="mt-3 space-y-2 text-sm">
                        {opt.legs.map((leg: any, j: number) => (
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
                                <Button size="sm" variant="outline" className="shadow-sm" asChild>
                                  <a href={leg.booking_link} target="_blank" rel="noreferrer">Book leg</a>
                                </Button>
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

        {/* Seasonal considerations */}
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

        {/* Local information */}
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
                      {Object.entries(it.local_information.emergency_contacts).map(([k,v]: any, i: number) => (<div key={i}><span className="font-medium capitalize">{k.replaceAll('_',' ')}:</span> {v as string}</div>))}
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
                      {Object.entries(it.local_information.useful_phrases).map(([k,v]: any, i: number) => (<div key={i}><span className="font-medium">{k}:</span> {v as string}</div>))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden gems */}
        {Array.isArray(it?.hidden_gems) && it.hidden_gems.length > 0 && (
          <Card id="gems" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Hidden gems</CardTitle>
              <CardDescription>Curated lesser-known spots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.hidden_gems.map((gem: any, i: number) => (
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
                    <div className="mt-3">
                      <GoogleMapsPreview lat={gem?.coordinates?.lat} lng={gem?.coordinates?.lng} placeId={gem?.place_id} name={gem?.name} ratio={16/10} className="w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photography spots */}
        {Array.isArray(it?.photography_spots) && it.photography_spots.length > 0 && (
          <Card id="photo" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Photography spots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {it.photography_spots.map((spot: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <div className="flex items-start justify-between">
                      <div className="font-medium">{spot.name}</div>
                      {typeof spot.rating === 'number' && <Badge variant="secondary">{spot.rating}★</Badge>}
                    </div>
                    {spot.description && <p className="text-sm text-muted-foreground mt-1">{spot.description}</p>}
                    <div className="mt-3">
                      <GoogleMapsPreview lat={spot?.coordinates?.lat} lng={spot?.coordinates?.lng} placeId={spot?.place_id} name={spot?.name} ratio={16/10} className="w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customization suggestions */}
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

        {/* Packing suggestions */}
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

        {/* Budget breakdown */}
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

        {/* Accommodation */}
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
                {Array.isArray(it.accommodations.alternative_options) && it.accommodations.alternative_options.map((opt: any, i: number) => (
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

        {/* Transportation */}
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
                      <p className="text-muted-foreground">{it.transportation.local_transport_guide.notes}</p>
                    )}
                  </div>
                )}
                {it.transportation.daily_transport_costs && (
                  <div>
                    <div className="font-medium mb-2">Daily transport costs</div>
                    <div className="space-y-1 text-muted-foreground">
                      {Object.entries(it.transportation.daily_transport_costs).map(([k,v]: any, i: number) => (
                        <div key={i}>{k}: {v} {it.currency}</div>
                      ))}
                    </div>
                    {Array.isArray(it.transportation.recommended_apps) && it.transportation.recommended_apps.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium">Recommended apps</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {it.transportation.recommended_apps.map((app: string, i: number) => (
                            <Badge key={i} variant="outline">{app}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data freshness */}
        {typeof it?.data_freshness_score === 'number' && (
          <div className="flex justify-end mb-8">
            <Badge variant="outline">Data freshness: {Math.round(it.data_freshness_score * 100)}%</Badge>
          </div>
        )}

        {/* Maps & locations */}
        {(mapData?.static_map_url || mapData?.daily_route_maps || mapData?.all_locations) && (
          <Card id="maps" className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Maps & locations</CardTitle>
              <CardDescription>Static map, daily routes and all locations</CardDescription>
            </CardHeader>
            <CardContent>
              {mapData.static_map_url && (
                <div className="rounded-xl overflow-hidden border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mapData.static_map_url} alt="Static map" className="w-full h-auto" />
                </div>
              )}
              {mapData.daily_route_maps && (
                <div className="mt-4">
                  <div className="font-medium mb-2">Daily route maps</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {Object.entries(mapData.daily_route_maps).map(([day, url]: any, i: number) => (
                      <a key={i} href={url as string} target="_blank" rel="noreferrer" className="p-3 rounded-md border hover:bg-muted transition-colors">
                        {day}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(mapData.all_locations) && mapData.all_locations.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium mb-2">All locations</div>
                  <div className="flex flex-wrap gap-2">
                    {mapData.all_locations.map((loc: any, i: number) => (
                      <Badge key={i} variant="secondary" className="capitalize">{loc.name}</Badge>
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