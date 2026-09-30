import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Search, X, RotateCcw } from 'lucide-react';

import { Card } from '@/components/StatCard';
import ThermalMap from '@/components/ThermalMap';
import { getThermalEvents } from '@/api/thermoscopeApi';
import {
  classificationColor,
  CLASSIFICATION_BREAKDOWN,
} from '@/data/events';

import type { Classification } from '@/data/types';

export default function ThermalMapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [backendEvents, setBackendEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClasses, setSelectedClasses] = useState<
    Set<Classification>
  >(new Set());

  const [verificationOnly, setVerificationOnly] = useState(false);
  const [minPriority, setMinPriority] = useState(0);
  const [search, setSearch] = useState('');

  // Load real backend thermal events
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getThermalEvents();

        const mappedEvents = (data.events || []).map((event: any) => ({
          ...event,
          lat: event.latitude,
          lon: event.longitude,
        }));

        console.log('FULL MAP BACKEND EVENTS:', mappedEvents.length);
        console.log('FIRST FULL MAP EVENT:', mappedEvents[0]);

        setBackendEvents(mappedEvents);
      } catch (error) {
        console.error('Failed to load thermal events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  // Convert backend result into the same classification names
  // used by the existing filter UI.
  const getEventClassification = (event: any): Classification => {
    const result = String(event.final_investigation_result || '').toLowerCase();

    if (event.evidence_conflict || result.includes('conflicting')) {
      return 'Conflicting Evidence / Requires Verification' as Classification;
    }

    if (
      event.ml_investigation_flag ||
      result.includes('ai anomaly') ||
      result.includes('anomaly')
    ) {
      return 'AI Anomaly / Requires Investigation' as Classification;
    }

    if (result.includes('industrial')) {
      return 'Industrial Thermal Source' as Classification;
    }

    if (result.includes('ambiguous')) {
      return 'Ambiguous / Requires Verification' as Classification;
    }

    return 'Unknown / Requires Verification' as Classification;
  };

  // Read URL query params on mount
  useEffect(() => {
    const cls = searchParams.get('classification');
    const verif = searchParams.get('verification');

    if (cls) {
      const matches = CLASSIFICATION_BREAKDOWN.filter((c) =>
        c.classification.toLowerCase().includes(cls.toLowerCase())
      );

      const next = new Set<Classification>();

      matches.forEach((m) => next.add(m.classification));

      setSelectedClasses(next);
    }

    if (verif === 'true') {
      setVerificationOnly(true);
    }

    if (cls || verif) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const toggleClass = (cls: Classification) => {
    setSelectedClasses((prev) => {
      const next = new Set(prev);

      if (next.has(cls)) {
        next.delete(cls);
      } else {
        next.add(cls);
      }

      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    return backendEvents.filter((event) => {
      const classification = getEventClassification(event);

      if (
        selectedClasses.size > 0 &&
        !selectedClasses.has(classification)
      ) {
        return false;
      }

      if (
        verificationOnly &&
        !event.requires_human_verification
      ) {
        return false;
      }

      if ((event.priority ?? 0) < minPriority) {
        return false;
      }

      const eventId = String(event.event_id ?? '');
      const region = String(event.region ?? '');

      if (
        search &&
        !eventId.toLowerCase().includes(search.toLowerCase()) &&
        !region.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [
    backendEvents,
    selectedClasses,
    verificationOnly,
    minPriority,
    search,
  ]);

  const hasActiveFilters =
    selectedClasses.size > 0 ||
    verificationOnly ||
    minPriority > 0 ||
    search;

  const clearAllFilters = () => {
    setSelectedClasses(new Set());
    setVerificationOnly(false);
    setMinPriority(0);
    setSearch('');
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#203040]">
            Thermal Map
          </h2>

          <p className="text-xs text-gray-500 mt-0.5">
            {loading
              ? 'Loading thermal events...'
              : `${filteredEvents.length} of ${backendEvents.length} events shown — click any marker to investigate`}
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#C85C5C] bg-white border border-gray-200 rounded-lg px-3 py-1.5 transition-all hover:border-[#C85C5C]/30"
          >
            <RotateCcw className="h-3 w-3" />
            Reset filters
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 px-6 pb-6 min-h-0">

        {/* Filters sidebar */}
        <div className="space-y-4 overflow-auto">
          <Card title="Filters">
            <div className="p-4 space-y-4">

              {/* Search */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Search
                </label>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Event ID or region..."
                    className="w-full rounded-lg border border-gray-200 bg-[#EEF3F5]/50 pl-8 pr-3 py-2 text-xs text-[#203040] focus:outline-none focus:ring-2 focus:ring-[#147D7E]/40 focus:border-[#147D7E] transition-all"
                  />
                </div>
              </div>

              {/* Classification */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  <Filter className="h-3 w-3" />
                  Classification
                </label>

                <div className="space-y-1">
                  {CLASSIFICATION_BREAKDOWN.map((c) => (
                    <button
                      key={c.classification}
                      onClick={() => toggleClass(c.classification)}
                      className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-[11px] transition-all ${
                        selectedClasses.has(c.classification)
                          ? 'bg-[#147D7E]/10 text-[#203040] font-medium ring-1 ring-[#147D7E]/20'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: c.color,
                        }}
                      />

                      <span className="flex-1 text-left truncate">
                        {c.classification.replace(/ \/ .*/, '')}
                      </span>

                      <span className="text-gray-400">
                        {c.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Verification
                </label>

                <button
                  onClick={() =>
                    setVerificationOnly(!verificationOnly)
                  }
                  className={`flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-[11px] transition-all ${
                    verificationOnly
                      ? 'bg-[#D99A2B]/10 text-[#D99A2B] font-medium ring-1 ring-[#D99A2B]/20'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                      verificationOnly
                        ? 'bg-[#D99A2B] border-[#D99A2B]'
                        : 'border-gray-300'
                    }`}
                  >
                    {verificationOnly && (
                      <span className="text-white text-[10px]">
                        ✓
                      </span>
                    )}
                  </span>

                  Verification required only
                </button>
              </div>

              {/* Priority slider */}
              <div>
                <label className="flex items-center justify-between text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  <span>Min Priority</span>

                  <span className="text-[#147D7E] font-bold normal-case text-xs">
                    {minPriority}
                  </span>
                </label>

                <input
                  type="range"
                  min={0}
                  max={25}
                  value={minPriority}
                  onChange={(e) =>
                    setMinPriority(Number(e.target.value))
                  }
                  className="w-full accent-[#147D7E] cursor-pointer"
                />

                <div className="flex justify-between text-[9px] text-gray-300 mt-1">
                  <span>0</span>
                  <span>10</span>
                  <span>25</span>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#C85C5C] transition-colors w-full justify-center border-t border-gray-100 pt-3"
                >
                  <X className="h-3 w-3" />
                  Clear all filters
                </button>
              )}

            </div>
          </Card>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm flex flex-col min-h-0">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#203040]">
              Interactive Thermal Event Map
            </h3>

            <span className="text-xs text-gray-400">
              {filteredEvents.length} markers
            </span>
          </div>

          <div className="p-3 flex-1 min-h-0">
            <ThermalMap
              events={filteredEvents}
              className="h-full min-h-[500px] w-full"
              onSelect={(id) =>
                id && navigate(`/investigate/${id}`)
              }
            />
          </div>

        </div>
      </div>
    </div>
  );
}