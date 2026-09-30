import { useEffect, useMemo, useState } from 'react';

import { getThermalEvents } from '@/api/thermoscopeApi';

import { Link, useNavigate } from 'react-router-dom';

import {
  Activity,
  AlertTriangle,
  FileWarning,
  ClipboardCheck,
  ArrowRight,
  MapPin,
} from 'lucide-react';

import ThermalMap from '@/components/ThermalMap';
import { useAuth } from '@/context/AuthContext';

import {
  DASHBOARD_STATS,
  CLASSIFICATION_BREAKDOWN,
  THERMAL_EVENTS,
  classificationColor,
} from '@/data/events';

/* =========================================================
   KPI TILE
========================================================= */

function KpiTile({
  label,
  value,
  icon: Icon,
  accent,
  filterParam,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  accent: string;
  filterParam: string;
}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/map?${filterParam}`)}
      className="group flex items-center gap-3 bg-white rounded-xl border border-gray-200/60 p-3.5 shadow-sm hover:shadow-md hover:border-[#147D7E]/30 transition-all text-left"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
        style={{ backgroundColor: `${accent}15` }}
      >
        <Icon
          className="h-4.5 w-4.5"
          style={{ color: accent }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider truncate">
          {label}
        </p>

        <p
          className="text-xl font-semibold leading-tight"
          style={{ color: accent }}
        >
          {value}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 text-gray-200 group-hover:text-[#147D7E] transition-colors shrink-0" />
    </button>
  );
}

/* =========================================================
   PANEL WRAPPER
========================================================= */

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm flex flex-col min-w-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-[#203040]">
          {title}
        </h3>

        {action}
      </div>

      <div className="p-4 flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   QUEUE ROW
========================================================= */

function QueueRow({
  event,
  rank,
}: {
  event: any;
  rank?: number;
}) {
  const classification =
    event.final_investigation_result ||
    event.classification ||
    'Unknown / Requires Verification';

  const color = classificationColor(
    classification
  );

  const eventId =
    event.event_id ??
    event.id;
const priority = Number(event.final_priority ?? 0);

  const requiresVerification =
    event.requires_human_verification === true ||
    event.humanVerification === 'Required';

  return (
    <Link
      to={`/investigate/${eventId}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#EEF3F5]/60 transition-colors border-b border-gray-50 last:border-0 group"
    >
      {rank !== undefined ? (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {rank}
        </div>
      ) : (
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-medium text-[#203040] truncate">
          {eventId}
        </p>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400 truncate">
            {classification.replace(/ \/ .*/, '')}
          </span>

          {requiresVerification && (
            <span className="px-1.5 py-0 rounded text-[9px] font-medium bg-[#D99A2B]/15 text-[#D99A2B] shrink-0">
              Verify
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[9px] text-gray-300 uppercase leading-none">
          Pri
        </p>

        <p
          className="text-base font-bold leading-tight"
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
    </Link>
  );
}

/* =========================================================
   ANALYTICS STAT
========================================================= */

function AnalyticsStat({
  label,
  value,
  color,
  sublabel,
}: {
  label: string;
  value: string | number;
  color: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />

        <span className="text-xs text-gray-600">
          {label}
        </span>
      </div>

      <div className="text-right">
        <span className="text-sm font-bold text-[#203040]">
          {value}
        </span>

        {sublabel && (
          <span className="text-[10px] text-gray-400 ml-1.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CommandCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [backendEvents, setBackendEvents] =
    useState<any[]>([]);

  const [backendStats, setBackendStats] = useState({
    totalEvents: DASHBOARD_STATS.totalEvents,
    aiAnomalies: DASHBOARD_STATS.aiAnomalies,
    evidenceConflicts:
      DASHBOARD_STATS.evidenceConflicts,
    verificationRequired:
      DASHBOARD_STATS.verificationRequired,
  });

  /* =======================================================
     FETCH REAL BACKEND EVENTS
  ======================================================= */

  useEffect(() => {
    getThermalEvents()
      .then((data) => {
        const events = Array.isArray(data.events)
          ? data.events
          : [];

        console.log(
          'COMMAND CENTER EVENTS:',
          events.length,
          events[0]
        );

        const mappedEvents = events.map(
          (event: any) => ({
            ...event,
            lat: event.latitude,
            lon: event.longitude,
          })
        );

        console.log(
          'MAPPED EVENTS:',
          mappedEvents.length,
          mappedEvents[0]
        );

        setBackendEvents(mappedEvents);

        setBackendStats({
          totalEvents: events.length,

          aiAnomalies: events.filter(
            (event: any) =>
              event.ml_investigation_flag === true ||
              event.final_investigation_result?.startsWith(
                'AI Anomaly'
              )
          ).length,

          evidenceConflicts: events.filter(
            (event: any) =>
              event.evidence_conflict === true
          ).length,

          verificationRequired: events.filter(
            (event: any) =>
              event.requires_human_verification === true
          ).length,
        });
      })
      .catch((error) => {
        console.error(
          'Failed to load thermal events from FastAPI:',
          error
        );
      });
  }, []);

  /* =======================================================
     CLASSIFICATION DISTRIBUTION
  ======================================================= */

  const maxCount = Math.max(
    ...CLASSIFICATION_BREAKDOWN.map(
      (c) => c.count
    )
  );

  /* =======================================================
     EVIDENCE OVERVIEW
  ======================================================= */

  const evidenceStats = useMemo(() => {
    const industrialHigh =
      THERMAL_EVENTS.filter(
        (event) => event.industrialScore >= 7
      ).length;

    const naturalSignificant =
      THERMAL_EVENTS.filter(
        (event) => event.naturalScore >= 5
      ).length;

    const abnormalDetected =
      THERMAL_EVENTS.filter(
        (event) => event.abnormalScore >= 5
      ).length;

    const conflicts =
      backendEvents.filter(
        (event) =>
          event.evidence_conflict === true
      ).length;

    return {
      industrialHigh,
      naturalSignificant,
      abnormalDetected,
      conflicts,
    };
  }, [backendEvents]);

  /* =======================================================
     REAL BACKEND PRIORITY QUEUE
     
     IMPORTANT:
     - Uses the same backendEvents shown on the map
     - Uses the backend priority field
     - Sorts highest priority first
     - No static PRIORITY_EVENTS
  ======================================================= */

  const queueEvents = useMemo(() => {
    return [...backendEvents]
      .sort(
        (a, b) =>
          Number(b.priority ?? 0) -
          Number(a.priority ?? 0)
      )
      .slice(0, 12);
  }, [backendEvents]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex flex-col min-h-full min-w-0">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F2537]">
            <MapPin className="h-4 w-4 text-[#147D7E]" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#203040] leading-tight">
              Command Center
            </h2>

            <p className="text-[11px] text-gray-500">
              Thermal Event Intelligence & Forensics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />

            <span className="text-gray-500">
              Satellite feed active
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Analyst
            </p>

            <p className="text-xs font-medium text-[#203040]">
              {user?.role ??
                'Thermal Intelligence Analyst'}
            </p>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="flex-1 px-6 py-5 space-y-5 min-w-0">

        {/* =================================================
            KPI ROW
        ================================================= */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">

          <KpiTile
            label="Total Events"
            value={backendStats.totalEvents}
            icon={Activity}
            accent="#147D7E"
            filterParam=""
          />

          <KpiTile
            label="AI Anomalies"
            value={backendStats.aiAnomalies}
            icon={AlertTriangle}
            accent="#D99A2B"
            filterParam="classification=AI+Anomaly"
          />

          <KpiTile
            label="Evidence Conflicts"
            value={backendStats.evidenceConflicts}
            icon={FileWarning}
            accent="#C85C5C"
            filterParam="classification=Conflicting"
          />

          <KpiTile
            label="Verification Required"
            value={backendStats.verificationRequired}
            icon={ClipboardCheck}
            accent="#D99A2B"
            filterParam="verification=true"
          />

        </div>

        {/* =================================================
            MAP + PRIORITY QUEUE
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 min-w-0">

          {/* =================================================
              MAP PANEL
          ================================================= */}

          <Panel
            title="Global Thermal Event Map"
            action={
              <Link
                to="/map"
                className="text-xs text-[#147D7E] hover:underline flex items-center gap-1"
              >
                Open full map
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="w-full min-w-[600px]">
              <ThermalMap
                events={backendEvents}
                className="h-[440px] w-full min-w-[600px]"
                onSelect={(id) =>
                  id &&
                  navigate(
                    `/investigate/${id}`
                  )
                }
              />
            </div>
          </Panel>

          {/* =================================================
              PRIORITY QUEUE
          ================================================= */}

          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm flex flex-col min-w-0">

            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-[#203040]">
                Priority Queue
              </h3>

              <Link
                to="/queue"
                className="text-xs text-[#147D7E] hover:underline"
              >
                View all
              </Link>
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: '440px' }}
            >

              {queueEvents.map(
                (event, idx) => (
                  <QueueRow
                    key={
                      event.event_id ??
                      event.id ??
                      idx
                    }
                    event={event}
                    rank={idx + 1}
                  />
                )
              )}

              {queueEvents.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-gray-400">
                  Loading priority events...
                </div>
              )}

            </div>
          </div>
        </div>

        {/* =================================================
            ANALYTICS ROW
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* =================================================
              CLASSIFICATION DISTRIBUTION
          ================================================= */}

          <Panel title="Classification Distribution">

            <div className="space-y-2.5">

              {CLASSIFICATION_BREAKDOWN.map(
                (c) => (
                  <button
                    key={c.classification}
                    onClick={() =>
                      navigate(
                        `/map?classification=${encodeURIComponent(
                          c.classification.split(' /')[0]
                        )}`
                      )
                    }
                    className="block w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">

                      <div className="flex items-center gap-2">

                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              c.color,
                          }}
                        />

                        <span className="text-xs text-[#203040] group-hover:text-[#147D7E] transition-colors">
                          {c.classification.replace(
                            / \/ .*/,
                            ''
                          )}
                        </span>

                      </div>

                      <span className="text-xs font-semibold text-[#203040]">
                        {c.count}
                      </span>

                    </div>

                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">

                      <div
                        className="h-full rounded-full transition-all group-hover:opacity-80"
                        style={{
                          width: `${
                            (c.count /
                              maxCount) *
                            100
                          }%`,
                          backgroundColor:
                            c.color,
                        }}
                      />

                    </div>
                  </button>
                )
              )}

            </div>
          </Panel>

          {/* =================================================
              EVIDENCE OVERVIEW
          ================================================= */}

          <Panel title="Evidence Overview">

            <div className="divide-y divide-gray-50">

              <AnalyticsStat
                label="Industrial evidence (high)"
                value={
                  evidenceStats.industrialHigh
                }
                color="#147D7E"
                sublabel="score >= 7"
              />

              <AnalyticsStat
                label="Natural evidence (significant)"
                value={
                  evidenceStats.naturalSignificant
                }
                color="#E4C04D"
                sublabel="score >= 5"
              />

              <AnalyticsStat
                label="Abnormal evidence (detected)"
                value={
                  evidenceStats.abnormalDetected
                }
                color="#C85C5C"
                sublabel="score >= 5"
              />

              <AnalyticsStat
                label="Evidence conflicts"
                value={
                  evidenceStats.conflicts
                }
                color="#9CA3AF"
              />

            </div>
          </Panel>

          {/* =================================================
              INVESTIGATION STATUS
          ================================================= */}

          <Panel title="Investigation Status">

            <div className="divide-y divide-gray-50">

              <AnalyticsStat
                label="Total events"
                value={
                  backendStats.totalEvents
                }
                color="#147D7E"
              />

              <AnalyticsStat
                label="Verification required"
                value={
                  backendStats.verificationRequired
                }
                color="#D99A2B"
              />

              <AnalyticsStat
                label="AI anomalies"
                value={
                  backendStats.aiAnomalies
                }
                color="#D99A2B"
              />

              <AnalyticsStat
                label="Conflicting events"
                value={
                  backendStats.evidenceConflicts
                }
                color="#C85C5C"
              />

            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}