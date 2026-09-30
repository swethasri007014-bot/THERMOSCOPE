import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Activity,
  Factory,
  Trees,
  Flame,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Navigation,
  ChevronRight,
} from 'lucide-react';

import { classificationColor } from '@/data/events';
import { getThermalEvents } from '@/api/thermoscopeApi';

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/70 p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          {icon}
        </div>

        <h2 className="text-base font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      {children}
    </div>
  );
}

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  const safeScore = Number(score ?? 0);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>

        <span className="text-sm font-semibold text-gray-900">
          {safeScore}/10
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(safeScore * 10, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200/70 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>

      <div className="text-lg font-bold text-gray-900">
        {value}
      </div>
    </div>
  );
}

export default function EventInvestigation() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [event, setEvent] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await getThermalEvents();

        const found = data.events.find(
          (item: any) => item.event_id === eventId
        );

        setEvent(found);
      } catch (error) {
        console.error(
          'Failed to load investigation event:',
          error
        );

        setEvent(undefined);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadEvent();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#147D7E] rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-gray-500">
            Loading investigation data...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Event Not Found
          </h2>

          <p className="text-sm text-gray-500 mb-5">
            The requested thermal event could not be found.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F2537] text-white text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </Link>
        </div>
      </div>
    );
  }

  const finalResult =
    event.final_investigation_result ||
    event.final_classification ||
    'Unknown / Requires Verification';

  const color = classificationColor(finalResult);

  const industrialScore = Number(
    event.industrial_evidence_score ?? 0
  );

  const naturalScore = Number(
    event.natural_evidence_score ?? 0
  );

  const abnormalScore = Number(
    event.abnormal_event_score ?? 0
  );

  const mlScore = Number(
    event.ml_anomaly_score ?? 0
  );

  const mlPercentile = Number(
    event.ml_anomaly_percentile ?? 0
  );

  const supportingEvidence = String(
    event.supporting_evidence ?? ''
  )
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

  const conflictingEvidence = String(
    event.conflicting_evidence ?? ''
  )
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

  const evidenceTypes = String(
    event.osm_evidence_types ?? ''
  )
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const hypotheses = [
    {
      label: 'Industrial Thermal Source',
      shortLabel: 'Industrial',
      score: industrialScore,
      color: '#147D7E',
      icon: Factory,
      reasoning:
        'Thermal activity is associated with nearby industrial or power infrastructure.',
    },
    {
      label: 'Natural / Agricultural Source',
      shortLabel: 'Natural',
      score: naturalScore,
      color: '#E4C04D',
      icon: Trees,
      reasoning:
        'Environmental context suggests possible agricultural, vegetation, or natural thermal activity.',
    },
    {
      label: 'Abnormal Thermal Event',
      shortLabel: 'Abnormal',
      score: abnormalScore,
      color: '#C85C5C',
      icon: Flame,
      reasoning:
        'The thermal pattern contains characteristics that may require further investigation.',
    },
    {
      label: 'Unknown',
      shortLabel: 'Unknown',
      score: Math.max(
        0,
        10 -
          Math.max(
            industrialScore,
            naturalScore,
            abnormalScore
          )
      ),
      color: '#9CA3AF',
      icon: HelpCircle,
      reasoning:
        'Available evidence is insufficient to strongly associate the event with a known source.',
    },
  ];

  const maxHypothesisScore = Math.max(
    ...hypotheses.map((hypothesis) => hypothesis.score)
  );

  const strongestHypothesis =
    hypotheses.find(
      (hypothesis) =>
        hypothesis.score === maxHypothesisScore
    ) || hypotheses[0];

  const mlDisagrees =
    event.ml_anomaly_class === 'Normal Pattern' &&
    finalResult.includes('AI Anomaly');

  const humanVerification =
    Boolean(event.requires_human_verification);

  const nearbyInfrastructureAvailable =
    evidenceTypes.length > 0 ||
    Boolean(event.nearest_feature_type);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link
              to="/"
              className="hover:text-[#147D7E] transition-colors"
            >
              Command Center
            </Link>

            <ChevronRight className="w-4 h-4" />

            <span>Investigation</span>

            <ChevronRight className="w-4 h-4" />

            <span className="text-gray-900 font-medium">
              {event.event_id}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Thermal Event Investigation
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Evidence-aware analysis of satellite-detected thermal activity
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Final classification */}
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: `${color}55`,
          backgroundColor: `${color}0D`,
        }}
      >
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${color}18`,
                color,
              }}
            >
              <Activity className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1">
                Final Investigation Result
              </p>

              <h2
                className="text-xl font-bold"
                style={{ color }}
              >
                {finalResult}
              </h2>

              <p className="text-sm text-gray-600 mt-2 max-w-3xl">
                {event.investigation_explanation ||
                  'This result combines thermal characteristics, temporal persistence, contextual evidence, and anomaly analysis.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {humanVerification ? (
              <>
                <Clock className="w-4 h-4 text-amber-600" />

                <span className="text-sm font-semibold text-amber-700">
                  Human Verification Required
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />

                <span className="text-sm font-semibold text-emerald-700">
                  Automated Review
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricTile
          label="Priority"
          value={event.final_priority ?? event.investigation_priority ?? 0}
          icon={<AlertTriangle className="w-4 h-4" />}
        />

        <MetricTile
          label="Evidence Strength"
          value={event.evidence_strength ?? 'Unknown'}
          icon={<ShieldCheck className="w-4 h-4" />}
        />

        <MetricTile
          label="Active Days"
          value={event.active_days ?? 0}
          icon={<Calendar className="w-4 h-4" />}
        />

        <MetricTile
          label="Max FRP"
          value={`${event.max_frp ?? 0} MW`}
          icon={<Flame className="w-4 h-4" />}
        />

        <MetricTile
          label="Thermal Strength"
          value={event.thermal_strength ?? 0}
          icon={<Activity className="w-4 h-4" />}
        />
      </div>

      {/* Location */}
      <SectionCard
        title="Event Location"
        icon={
          <MapPin className="w-4 h-4 text-[#147D7E]" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Event ID
            </p>

            <p className="text-sm font-semibold text-gray-900 break-all">
              {event.event_id}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">
              Latitude
            </p>

            <p className="text-sm font-semibold text-gray-900">
              {Number(event.latitude).toFixed(4)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">
              Longitude
            </p>

            <p className="text-sm font-semibold text-gray-900">
              {Number(event.longitude).toFixed(4)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">
              Detection Period
            </p>

            <p className="text-sm font-semibold text-gray-900">
              {event.first_detection ?? '—'} →{' '}
              {event.last_detection ?? '—'}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Evidence Analysis */}
      <SectionCard
        title="Evidence Analysis"
        icon={
          <ShieldCheck className="w-4 h-4 text-[#147D7E]" />
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ScoreBar
              label="Industrial Evidence"
              score={industrialScore}
              color="#147D7E"
            />

            <ScoreBar
              label="Natural / Agricultural Evidence"
              score={naturalScore}
              color="#E4C04D"
            />

            <ScoreBar
              label="Abnormal Event Evidence"
              score={abnormalScore}
              color="#C85C5C"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">
              Evidence Interpretation
            </p>

            <p className="text-sm leading-6 text-gray-700">
              The evidence engine compares multiple possible
              explanations instead of relying only on thermal
              intensity. The strongest current hypothesis is{' '}
              <span className="font-semibold text-gray-900">
                {strongestHypothesis.label}
              </span>
              .
            </p>

            {event.evidence_conflict && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />

                <p className="text-xs leading-5 text-red-700">
                  Conflicting evidence has been detected.
                  Automatic classification should therefore be
                  treated with caution.
                </p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Industrial Context */}
      <SectionCard
        title="Industrial Context"
        icon={
          <Factory className="w-4 h-4 text-[#147D7E]" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Factory className="w-5 h-5 text-[#147D7E]" />

              <span className="text-sm font-semibold text-gray-900">
                Nearby Infrastructure
              </span>
            </div>

            <div className="space-y-3">
              {nearbyInfrastructureAvailable ? (
                <>
                  {event.nearest_feature_type && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div>
                        <span className="text-sm text-gray-700">
                          {event.nearest_feature_type}
                        </span>

                        {event.nearest_feature_distance_km != null && (
                          <p className="text-xs text-gray-500 mt-1">
                            Approx.{' '}
                            {event.nearest_feature_distance_km}{' '}
                            km from event
                          </p>
                        )}
                      </div>

                      <Navigation className="w-4 h-4 text-gray-400" />
                    </div>
                  )}

                  {evidenceTypes.map((feature, index) => (
                    <div
                      key={`${feature}-${index}`}
                      className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                    >
                      <span className="text-sm text-gray-700">
                        {feature}
                      </span>

                      <Navigation className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No mapped contextual features were available
                  for this event.
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">
              Industrial Interpretation
            </p>

            <p className="text-sm leading-6 text-gray-700">
              The industrial evidence score indicates how strongly
              the surrounding mapped context supports an industrial
              thermal-source hypothesis.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                Industrial Evidence Score
              </span>

              <span className="text-sm font-bold text-[#147D7E]">
                {industrialScore}/10
              </span>
            </div>

            <div className="mt-3">
              <span className="text-xs text-gray-500">
                Industrial Context:{' '}
              </span>

              <span className="text-xs font-semibold text-gray-800">
                {event.industrial_context ?? 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Natural Context */}
      <SectionCard
        title="Natural / Agricultural Context"
        icon={
          <Trees className="w-4 h-4 text-[#B28B00]" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">
              Context Assessment
            </p>

            <p className="text-sm leading-6 text-gray-700">
              Natural and agricultural evidence is considered as
              an alternative explanation for persistent thermal
              activity.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">
                  Forest Features
                </p>

                <p className="text-lg font-bold text-gray-900">
                  {event.forest_feature_count ?? 0}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">
                  Farmland Features
                </p>

                <p className="text-lg font-bold text-gray-900">
                  {event.farmland_feature_count ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div>
            <ScoreBar
              label="Natural / Agricultural Evidence"
              score={naturalScore}
              color="#E4C04D"
            />
          </div>
        </div>
      </SectionCard>

      {/* Supporting and conflicting evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Supporting Evidence"
          icon={
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          }
        >
          <div className="space-y-3">
            {supportingEvidence.length > 0 ? (
              supportingEvidence.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>

                  <p className="text-sm text-gray-700 leading-5">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No supporting evidence recorded.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Conflicting Evidence"
          icon={
            <AlertTriangle className="w-4 h-4 text-red-600" />
          }
        >
          <div className="space-y-3">
            {conflictingEvidence.length > 0 ? (
              conflictingEvidence.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  </div>

                  <p className="text-sm text-gray-700 leading-5">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                No significant conflicting evidence identified.
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Multi-hypothesis */}
      <SectionCard
        title="Multi-Hypothesis Analysis"
        icon={
          <Brain className="w-4 h-4 text-[#147D7E]" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hypotheses.map((hypothesis) => {
            const Icon = hypothesis.icon;

            return (
              <div
                key={hypothesis.label}
                className="border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="w-4 h-4"
                      style={{ color: hypothesis.color }}
                    />

                    <span className="text-sm font-semibold text-gray-900">
                      {hypothesis.shortLabel}
                    </span>
                  </div>

                  <span
                    className="text-sm font-bold"
                    style={{ color: hypothesis.color }}
                  >
                    {hypothesis.score}/10
                  </span>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        hypothesis.score * 10,
                        100
                      )}%`,
                      backgroundColor: hypothesis.color,
                    }}
                  />
                </div>

                <p className="text-xs text-gray-600 leading-5">
                  {hypothesis.reasoning}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ML Analysis */}
      <SectionCard
        title="ML Anomaly Analysis"
        icon={
          <Brain className="w-4 h-4 text-[#147D7E]" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">
              Anomaly Score
            </p>

            <p className="text-xl font-bold text-gray-900">
              {mlScore.toFixed(4)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">
              Percentile
            </p>

            <p className="text-xl font-bold text-gray-900">
              {mlPercentile}%
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">
              Pattern
            </p>

            <p className="text-base font-bold text-gray-900">
              {event.ml_anomaly_class ?? 'Unknown'}
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-white">
          <p className="text-sm text-gray-700 leading-6">
            The prototype uses multivariate anomaly analysis to
            identify unusual combinations of thermal, temporal,
            confidence, and contextual features. An anomaly score
            is an investigation signal and should not be interpreted
            as classification accuracy.
          </p>

          {mlDisagrees && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
              ML anomaly analysis and the final investigation result
              indicate different signals. Human review is therefore
              recommended.
            </div>
          )}
        </div>
      </SectionCard>

      {/* Final result */}
      <SectionCard
        title="Final Investigation Result"
        icon={
          <ShieldCheck className="w-4 h-4 text-[#147D7E]" />
        }
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${color}18`,
              color,
            }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div>
            <h3
              className="text-lg font-bold"
              style={{ color }}
            >
              {finalResult}
            </h3>

            <p className="text-sm text-gray-600 mt-2 leading-6">
              {event.investigation_explanation ||
                'The final result is derived from the combined evidence available for this thermal event. Where evidence is insufficient or conflicting, the system recommends human verification rather than forcing an automatic classification.'}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Recommended action */}
      <div className="bg-[#0F2537] rounded-xl p-5 flex items-center justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
            Recommended Action
          </p>

          <h3 className="text-base font-semibold text-white">
            {humanVerification
              ? 'Review satellite and contextual evidence manually'
              : 'Continue monitoring this thermal source'}
          </h3>

          <p className="text-sm text-gray-300 mt-1">
            Investigation priority:{' '}
            {event.final_priority ??
              event.investigation_priority ??
              0}
          </p>
        </div>

        <button
          onClick={() => setActionSubmitted(true)}
          disabled={actionSubmitted}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-[#0F2537] text-sm font-semibold hover:bg-gray-100 disabled:opacity-70"
        >
          {actionSubmitted ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Action Recorded
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Mark for Review
            </>
          )}
        </button>
      </div>
    </div>
  );
}