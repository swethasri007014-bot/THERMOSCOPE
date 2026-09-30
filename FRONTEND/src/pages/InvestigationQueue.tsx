import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  MapPin,
  Clock,
  AlertTriangle,
} from 'lucide-react';

import { Card } from '@/components/StatCard';
import { getThermalEvents } from '@/api/thermoscopeApi';

type SortKey = 'priority' | 'activeDays' | 'mlAnomalyScore';

type BackendEvent = {
  event_id: string;
  latitude: number;
  longitude: number;
  active_days: number;
  persistence_ratio?: number;
  ml_anomaly_score?: number;
  ml_anomaly_class?: string;
  ml_investigation_flag?: boolean;
  final_priority?: number;
  priority?: number;
  final_investigation_result?: string;
  final_classification?: string;
  requires_human_verification?: boolean;
  evidence_conflict?: boolean;
};

function getClassification(event: BackendEvent) {
  const result = event.final_investigation_result || '';
  const classification = event.final_classification || '';

  if (
    event.evidence_conflict ||
    result.toLowerCase().includes('conflicting')
  ) {
    return 'Conflict';
  }

  if (
    event.ml_investigation_flag ||
    result.toLowerCase().includes('ai anomaly')
  ) {
    return 'AI Anomaly';
  }

  if (
    result.toLowerCase().includes('industrial') ||
    classification.toLowerCase().includes('industrial')
  ) {
    return 'Industrial';
  }

  if (
    result.toLowerCase().includes('ambiguous') ||
    classification.toLowerCase().includes('ambiguous')
  ) {
    return 'Ambiguous';
  }

  return 'Unknown';
}

function classificationColor(classification: string) {
  switch (classification) {
    case 'Industrial':
      return '#147D7E';

    case 'AI Anomaly':
      return '#C85C5C';

    case 'Conflict':
      return '#C85C5C';

    case 'Ambiguous':
      return '#D99A2B';

    default:
      return '#8A98A5';
  }
}

export default function InvestigationQueue() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('priority');
  const [verificationOnly, setVerificationOnly] = useState(false);

  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      try {
        setLoading(true);
        setError('');

        const data = await getThermalEvents();

        if (mounted) {
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Failed to load investigation queue:', err);

        if (mounted) {
          setError(
            'Unable to load investigation events from the backend.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...events];

    if (verificationOnly) {
      list = list.filter(
        (event) =>
          event.requires_human_verification === true
      );
    }

    if (search) {
      const query = search.toLowerCase();

      list = list.filter((event) => {
        const eventId = event.event_id.toLowerCase();

        const classification =
          event.final_investigation_result?.toLowerCase() || '';

        return (
          eventId.includes(query) ||
          classification.includes(query)
        );
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'priority') {
        return (
          Number(b.final_priority ?? b.priority ?? 0) -
          Number(a.final_priority ?? a.priority ?? 0)
        );
      }

      if (sortBy === 'activeDays') {
        return (
          Number(b.active_days ?? 0) -
          Number(a.active_days ?? 0)
        );
      }

      return (
        Number(b.ml_anomaly_score ?? 0) -
        Number(a.ml_anomaly_score ?? 0)
      );
    });

    return list;
  }, [
    events,
    search,
    sortBy,
    verificationOnly,
  ]);

  return (
    <div className="p-6 space-y-6">

      <div>
        <h2 className="text-2xl font-semibold text-[#203040]">
          Investigation Queue
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {loading
            ? 'Loading thermal events...'
            : `${filtered.length} events — sorted by ${
                sortBy === 'priority'
                  ? 'priority'
                  : sortBy === 'activeDays'
                  ? 'active days'
                  : 'ML anomaly score'
              }`}
        </p>
      </div>

      <Card>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 px-5 py-4 border-b border-gray-100">

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by event ID or classification..."
              className="w-full rounded-lg border border-gray-200 bg-[#EEF3F5]/50 pl-10 pr-4 py-2 text-sm text-[#203040] focus:outline-none focus:ring-2 focus:ring-[#147D7E]/40 focus:border-[#147D7E] transition-all"
            />
          </div>

          <div className="flex items-center gap-3">

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as SortKey
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#203040] focus:outline-none focus:ring-2 focus:ring-[#147D7E]/40"
            >
              <option value="priority">
                Sort: Priority
              </option>

              <option value="activeDays">
                Sort: Active Days
              </option>

              <option value="mlAnomalyScore">
                Sort: ML Anomaly
              </option>
            </select>

            <button
              onClick={() =>
                setVerificationOnly(
                  !verificationOnly
                )
              }
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all border ${
                verificationOnly
                  ? 'bg-[#D99A2B]/10 border-[#D99A2B]/30 text-[#D99A2B]'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />

              Verification only
            </button>

          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[calc(100vh-220px)] overflow-auto">

          {loading && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              Loading investigation events...
            </div>
          )}

          {!loading && error && (
            <div className="px-5 py-12 text-center text-sm text-[#C85C5C]">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((event) => {
              const classification =
                getClassification(event);

              const priority = Number(
                event.final_priority ??
                  event.priority ??
                  0
              );

              const activeDays = Number(
                event.active_days ?? 0
              );

              const anomalyScore = Number(
                event.ml_anomaly_score ?? 0
              );

              return (
                <Link
                  key={event.event_id}
                  to={`/investigate/${encodeURIComponent(
                    event.event_id
                  )}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#EEF3F5]/50 transition-colors group"
                >

                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        classificationColor(
                          classification
                        ),
                    }}
                  />

                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-mono font-medium text-[#203040] truncate">
                      {event.event_id}
                    </p>

                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">

                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />

                        {Number(event.latitude).toFixed(
                          4
                        )}
                        ,{' '}
                        {Number(event.longitude).toFixed(
                          4
                        )}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />

                        {activeDays}d
                      </span>

                      <span className="hidden sm:block">
                        ML {anomalyScore.toFixed(2)}
                      </span>

                    </div>
                  </div>

                  <span className="text-xs text-gray-500 hidden md:block truncate max-w-[220px]">
                    {event.final_investigation_result ||
                      event.final_classification ||
                      classification}
                  </span>

                  {event.requires_human_verification && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#D99A2B]/15 text-[#D99A2B]">
                      Verify
                    </span>
                  )}

                  <div className="text-right shrink-0 w-12">

                    <p className="text-xs text-gray-400">
                      P
                    </p>

                    <p
                      className="text-base font-bold"
                      style={{
                        color:
                          priority >= 20
                            ? '#C85C5C'
                            : priority >= 10
                            ? '#D99A2B'
                            : '#147D7E',
                      }}
                    >
                      {priority}
                    </p>

                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#147D7E] transition-colors shrink-0" />

                </Link>
              );
            })}

          {!loading &&
            !error &&
            filtered.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-gray-400">
                No events match your filters.
              </div>
            )}

        </div>

      </Card>

    </div>
  );
}