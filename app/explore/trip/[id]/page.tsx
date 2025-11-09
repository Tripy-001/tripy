/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { headers } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GoogleMapsPreview from '@/components/GoogleMapsPreview';
import { AI_RESPONSE as SAMPLE_CONST } from '@/app/constant';
import { MapPin, Calendar, Clock, DollarSign, Users, Star, Plane, Home, Package, Sparkles, Camera, Info, TrendingUp, Shield, Languages, Sun } from 'lucide-react';
import ScrollSpyTabs from '@/components/ScrollSpyTabs';
import AutoCarousel from '@/components/AutoCarousel';

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
  const resolved: unknown = (typeof (input as unknown)?.then === 'function') ? await (input as unknown) : input;
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
            <p className="text-muted-foreground">We couldn&apos;t load this public trip.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const response = trip as any;
  const it = (response?.itinerary || {}) as any;
  const mapData = (it?.map_data || {}) as any;

  const currency = it?.currency || it?.budget_breakdown?.currency;
  const formatCurrency = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (!isFinite(num)) return String(val);
    return `${num} ${currency || ''}`.trim();
  };

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

      {/* Hero media: use thumbnail_url only, no destination_photos carousel */}
      {response?.thumbnail_url && (
        <div className="w-full">
          <div className="relative h-[220px] sm:h-[280px] lg:h-[360px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={response.thumbnail_url} alt={response?.title || 'Trip thumbnail'} className="absolute inset-0 w-full h-full object-contain bg-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-5">
              <div className="max-w-7xl mx-auto text-white">
                <div className="text-lg font-semibold drop-shadow">{it?.destination || response?.title}</div>
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
        <Accordion type="multiple" defaultValue={["overview"]} className="w-full">
          <AccordionItem value="overview" className="border-0">
            <Card id="overview" className="glass-card mb-8 border-2">
              <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                <div className="w-full bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border-b px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
                        <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {it?.origin && it?.destination && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/10 border">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-muted-foreground">Route</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{it.origin} → {it.destination}</span>
                </div>
              )}
              {it?.trip_duration_days && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-muted-foreground">Duration</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{it.trip_duration_days} day(s)</span>
                </div>
              )}
              {(it?.group_size || response?.request?.group_size) && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-muted-foreground">Group</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{it.group_size ?? response.request.group_size} people</span>
                </div>
              )}
              {(it?.total_budget && it?.currency) && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 border">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-muted-foreground">Budget</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{it.total_budget} {it.currency}</span>
                </div>
              )}
              {(it?.travel_style || response?.request?.primary_travel_style) && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/10 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs font-medium text-muted-foreground">Style</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{it.travel_style ?? response.request.primary_travel_style}</span>
                </div>
              )}
              {(it?.activity_level || response?.request?.activity_level) && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/10 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-muted-foreground">Activity</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{it.activity_level ?? response.request.activity_level}</span>
                </div>
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
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>


        {/* Daily itinerary */}
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
                          <div className="text-2xl font-semibold">Daily Itinerary</div>
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
                                return (
                                  <div key={sectionKey} className="space-y-4">
                                    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                      <span className="text-lg">🍽️</span>
                                      <h4 className="text-lg font-semibold capitalize text-foreground">{sectionKey}</h4>
                                    </div>
                                    {(section?.estimated_cost || section?.duration_hours) && (
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        {section?.duration_hours && <Badge variant="outline">Duration: {section.duration_hours} hrs</Badge>}
                                        {section?.estimated_cost && <Badge variant="outline">Cost: {formatCurrency(section.estimated_cost)}</Badge>}
                                      </div>
                                    )}
                                    <div className="p-6 rounded-xl border">
                                      <div className="mb-2 font-medium">{r?.name || 'Lunch'}</div>
                                      {r?.address && <div className="text-sm text-muted-foreground mb-2">{r.address}</div>}
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                                        <GoogleMapsPreview lat={r?.coordinates?.lat} lng={r?.coordinates?.lng} placeId={r?.place_id} name={r?.name} ratio={16/9} className="w-full" />
                                        {Array.isArray(r?.photo_urls) && r.photo_urls.length > 0 && (
                                          <AutoCarousel images={r.photo_urls} className="w-full aspect-video" rounded="rounded-lg" showControls intervalMs={4000} imgAlt={r?.name || 'Restaurant'} />
                                        )}
                                      </div>
                                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="space-y-1 text-muted-foreground">
                                          {r?.description && <div><span className="font-medium text-foreground">About:</span> {r.description}</div>}
                                          {Array.isArray(r?.cuisine_type) && r.cuisine_type.length > 0 && (
                                            <div><span className="font-medium text-foreground">Cuisine:</span> {r.cuisine_type.join(', ')}</div>
                                          )}
                                          {(typeof r?.rating === 'number') && (
                                            <div><span className="font-medium text-foreground">Rating:</span> {r.rating}{r?.user_ratings_total ? ` (${r.user_ratings_total})` : ''}</div>
                                          )}
                                          {r?.price_level && (
                                            <div><span className="font-medium text-foreground">Price level:</span> {r.price_level}</div>
                                          )}
                                        </div>
                                        <div className="space-y-1 text-muted-foreground">
                                          {typeof r?.estimated_cost !== 'undefined' && (
                                            <div><span className="font-medium text-foreground">Cost per person:</span> {formatCurrency(r.estimated_cost)}</div>
                                          )}
                                          {r?.opening_hours && (
                                            <div><span className="font-medium text-foreground">Hours:</span> {r.opening_hours}</div>
                                          )}
                                          {r?.reservation_required && (
                                            <div><span className="font-medium text-foreground">Reservation:</span> {r.reservation_required ? 'Required' : 'Optional'}</div>
                                          )}
                                          {Array.isArray(r?.dietary_options) && r.dietary_options.length > 0 && (
                                            <div><span className="font-medium text-foreground">Dietary:</span> {r.dietary_options.join(', ')}</div>
                                          )}
                                        </div>
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
                                              {typeof act?.weather_dependent !== 'undefined' && (
                                                <div><span className="font-medium text-foreground">Weather dependent:</span> {act.weather_dependent ? 'Yes' : 'No'}</div>
                                              )}
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

        {/* Travel options */}
        {Array.isArray(it?.travel_options) && it.travel_options.length > 0 && (
          <Accordion type="multiple" defaultValue={["travel-options"]} className="w-full">
            <AccordionItem value="travel-options" className="border-0">
              <Card id="travel-options" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
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
                  <div key={i} className="group p-5 rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg relative overflow-hidden">
                    <Plane className="absolute right-4 top-4 w-16 h-16 text-blue-200 dark:text-blue-900/30 opacity-20" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-bold text-foreground text-lg">{opt.mode}</div>
                        {opt.estimated_cost && (
                          <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                            {opt.estimated_cost} {it.currency}
                          </Badge>
                        )}
                      </div>
                      {opt.details && <p className="text-sm text-foreground leading-relaxed mb-4">{opt.details}</p>}
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
                  </div>
                ))}
              </div>
            </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        )}

        {/* Seasonal considerations */}
        {Array.isArray(it?.seasonal_considerations) && it.seasonal_considerations.length > 0 && (
          <Accordion type="multiple" defaultValue={["season"]} className="w-full">
            <AccordionItem value="season" className="border-0">
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

        {/* Local information */}
        {(it?.weather_forecast_summary || it?.local_information) && (
          <Accordion type="multiple" defaultValue={["local-info"]} className="w-full">
            <AccordionItem value="local-info" className="border-0">
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
                        <p className="text-muted-foreground leading-relaxed">{it.local_information.language_info.notes}</p>
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
                      <div className="text-foreground font-medium">{it.local_information.currency_info.name} ({it.local_information.currency_info.symbol})</div>
                      {it.local_information.currency_info.exchange_rate_notes && (
                        <p className="text-muted-foreground leading-relaxed">{it.local_information.currency_info.exchange_rate_notes}</p>
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
                        <div key={i} className="flex items-center justify-between">
                          <span className="font-medium text-foreground capitalize">{(k as string).replaceAll('_',' ')}</span>
                          <span className="text-muted-foreground font-mono">{v as string}</span>
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
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                          <span className="leading-relaxed">{t}</span>
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
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                          <span className="leading-relaxed">{t}</span>
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
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0"></span>
                          <span className="leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {it.local_information?.useful_phrases && (
                  <div className="md:col-span-2 lg:col-span-3 p-5 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/10 border-2 border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Languages className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      <h4 className="font-bold text-foreground">Useful Phrases</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                      {Object.entries(it.local_information.useful_phrases).map(([k,v]: unknown, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-white/60 dark:bg-gray-900/60 border">
                          <div className="font-medium text-foreground mb-1">{k}</div>
                          <div className="text-muted-foreground italic">{v as string}</div>
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

        {/* Hidden gems */}
        {Array.isArray(it?.hidden_gems) && it.hidden_gems.length > 0 && (
          <Accordion type="multiple" defaultValue={["gems"]} className="w-full">
            <AccordionItem value="gems" className="border-0">
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

        {/* Photography spots */}
        {Array.isArray(it?.photography_spots) && it.photography_spots.length > 0 && (
          <Accordion type="multiple" defaultValue={["photo"]} className="w-full">
            <AccordionItem value="photo" className="border-0">
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

        {/* Customization suggestions */}
        {Array.isArray(it?.customization_suggestions) && it.customization_suggestions.length > 0 && (
          <Accordion type="multiple" defaultValue={["customize"]} className="w-full">
            <AccordionItem value="customize" className="border-0">
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

        {/* Packing suggestions */}
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

        {/* Budget breakdown */}
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

        {/* Accommodation */}
        {it?.accommodations && (
          <Accordion type="multiple" defaultValue={["stay"]} className="w-full">
            <AccordionItem value="stay" className="border-0">
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
                  <h4 className="font-bold text-foreground mb-4">Alternative Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {it.accommodations.alternative_options.map((opt: unknown, i: number) => (
                      <div key={i} className="p-5 rounded-xl bg-gradient-to-br from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10 border-2 hover:border-rose-300 dark:hover:border-rose-700 transition-all hover:shadow-md">
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

        {/* Transportation */}
        {it?.transportation && (
          <Accordion type="multiple" defaultValue={["transport"]} className="w-full">
            <AccordionItem value="transport" className="border-0">
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

        {/* Data freshness */}
        {typeof it?.data_freshness_score === 'number' && (
          <div className="flex justify-end mb-8">
            <Badge variant="outline">Data freshness: {Math.round(it.data_freshness_score * 100)}%</Badge>
          </div>
        )}

        {/* Maps & locations */}
        {(mapData?.static_map_url || mapData?.daily_route_maps || mapData?.all_locations) && (
          <Accordion type="multiple" defaultValue={["maps"]} className="w-full">
            <AccordionItem value="maps" className="border-0">
              <Card id="maps" className="glass-card mb-8 border-2">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden [&[data-state=open]>div>svg]:rotate-180">
                  <div className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
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
      </div>
    </div>
  );
}