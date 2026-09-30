import type { ThermalEvent, ClassificationBreakdown } from './types';

// Centralized demo event dataset — structured to be replaced by a FastAPI backend later.
// Priority events and key statistics match the SIH 2026 problem statement 26162 brief.

export const CLASSIFICATION_BREAKDOWN: ClassificationBreakdown[] = [
  { classification: 'Industrial Thermal Source', count: 59, color: '#147D7E' },
  { classification: 'Unknown / Requires Verification', count: 34, color: '#9CA3AF' },
  { classification: 'Ambiguous / Requires Verification', count: 4, color: '#E4C04D' },
  { classification: 'AI Anomaly / Requires Investigation', count: 2, color: '#D99A2B' },
  { classification: 'Conflicting Evidence / Requires Verification', count: 1, color: '#C85C5C' },
];

export const DASHBOARD_STATS = {
  totalEvents: 100,
  aiAnomalies: 2,
  evidenceConflicts: 1,
  verificationRequired: 41,
};

const supportingEvidenceTemplates = [
  ['Highly persistent thermal activity', 'Significant night-time activity', 'Nearby industrial or power infrastructure'],
  ['Consistent daily thermal pattern', 'Daytime peak with night-time decay', 'Proximity to known industrial zone'],
  ['Sustained elevated thermal signature', 'Correlation with operational hours', 'Adjacent to power generation facility'],
];

const conflictingEvidenceTemplates = [
  ['Nearby forest or woodland context', 'Nearby agricultural land context', 'Industrial and natural-source evidence conflict'],
  ['Seasonal vegetation thermal signature', 'Proximity to water body', 'Ambiguous source attribution'],
  ['Natural geothermal proximity', 'Residual heat from solar exposure', 'Mixed land-use context'],
];

function makeEvent(partial: Partial<ThermalEvent> & Pick<ThermalEvent, 'id' | 'lat' | 'lng' | 'latLabel' | 'lngLabel' | 'classification' | 'finalResult' | 'priority'>): ThermalEvent {
  return {
    evidenceStrength: 'High',
    activeDays: 5,
    industrialScore: 9,
    naturalScore: 6,
    abnormalScore: 0,
    mlAnomalyScore: 1.8397,
    mlPercentile: 95,
    mlClass: 'Normal Pattern',
    humanVerification: 'Required',
    supportingEvidence: supportingEvidenceTemplates[0],
    conflictingEvidence: conflictingEvidenceTemplates[0],
    nearbyFeatures: [{ name: 'Storage Tank', distance: 0.027, industrialContext: 'Strong' }],
    thermalIntensity: 70,
    maxFRP: 45.2,
    region: 'Sector 7',
    detectedDate: '2026-09-22',
    ...partial,
  };
}

// The four priority events from the brief, with full forensic detail for the first.
const priorityEvents: ThermalEvent[] = [
  makeEvent({
    id: '2557.0_-9994.0',
    lat: 25.577,
    lng: -99.9357,
    latLabel: '25.5770 N',
    lngLabel: '99.9357 W',
    classification: 'Conflicting Evidence / Requires Verification',
    finalResult: 'Conflicting Evidence / Requires Verification',
    priority: 23,
    evidenceStrength: 'High',
    activeDays: 5,
    industrialScore: 9,
    naturalScore: 6,
    abnormalScore: 0,
    mlAnomalyScore: 1.8397,
    mlPercentile: 95,
    mlClass: 'Normal Pattern',
    humanVerification: 'Required',
    supportingEvidence: ['Highly persistent thermal activity', 'Significant night-time activity', 'Nearby industrial or power infrastructure'],
    conflictingEvidence: ['Nearby forest or woodland context', 'Nearby agricultural land context', 'Industrial and natural-source evidence conflict'],
    nearbyFeatures: [{ name: 'Storage Tank', distance: 0.027, industrialContext: 'Strong' }],
    thermalIntensity: 85,
    maxFRP: 62.7,
    region: 'North-East Industrial Corridor',
    detectedDate: '2026-09-24',
  }),
  makeEvent({
    id: '-347.0_10491.0',
    lat: 34.7104,
    lng: 10.4910,
    latLabel: '34.7104 N',
    lngLabel: '10.4910 E',
    classification: 'AI Anomaly / Requires Investigation',
    finalResult: 'AI Anomaly / Requires Investigation',
    priority: 10,
    evidenceStrength: 'Medium',
    activeDays: 3,
    industrialScore: 7,
    naturalScore: 3,
    abnormalScore: 6,
    mlAnomalyScore: 3.4121,
    mlPercentile: 99,
    mlClass: 'Anomalous Pattern',
    humanVerification: 'Required',
    supportingEvidence: ['Consistent daily thermal pattern', 'Daytime peak with night-time decay', 'Proximity to known industrial zone'],
    conflictingEvidence: ['Seasonal vegetation thermal signature', 'Proximity to water body', 'Ambiguous source attribution'],
    nearbyFeatures: [{ name: 'Refinery Stack', distance: 0.41, industrialContext: 'Moderate' }],
    thermalIntensity: 72,
    maxFRP: 38.1,
    region: 'Coastal Processing Zone',
    detectedDate: '2026-09-26',
  }),
  makeEvent({
    id: '-2423.0_-6113.0',
    lat: 24.2300,
    lng: -61.1300,
    latLabel: '24.2300 N',
    lngLabel: '61.1300 W',
    classification: 'Ambiguous / Requires Verification',
    finalResult: 'Ambiguous / Requires Verification',
    priority: 10,
    evidenceStrength: 'Medium',
    activeDays: 8,
    industrialScore: 5,
    naturalScore: 7,
    abnormalScore: 2,
    mlAnomalyScore: 2.1043,
    mlPercentile: 88,
    mlClass: 'Uncertain',
    humanVerification: 'Required',
    supportingEvidence: ['Sustained elevated thermal signature', 'Correlation with operational hours', 'Adjacent to power generation facility'],
    conflictingEvidence: ['Natural geothermal proximity', 'Residual heat from solar exposure', 'Mixed land-use context'],
    nearbyFeatures: [{ name: 'Power Plant', distance: 1.2, industrialContext: 'Moderate' }],
    thermalIntensity: 58,
    maxFRP: 24.5,
    region: 'Inland Mixed-Use Sector',
    detectedDate: '2026-09-21',
  }),
  makeEvent({
    id: '-1664.0_13003.0',
    lat: -16.6400,
    lng: 130.0300,
    latLabel: '16.6400 S',
    lngLabel: '130.0300 E',
    classification: 'AI Anomaly / Requires Investigation',
    finalResult: 'AI Anomaly / Requires Investigation',
    priority: 10,
    evidenceStrength: 'Low',
    activeDays: 2,
    industrialScore: 4,
    naturalScore: 5,
    abnormalScore: 8,
    mlAnomalyScore: 4.0078,
    mlPercentile: 99,
    mlClass: 'Anomalous Pattern',
    humanVerification: 'Required',
    supportingEvidence: ['Consistent daily thermal pattern', 'Daytime peak with night-time decay', 'Proximity to known industrial zone'],
    conflictingEvidence: ['Seasonal vegetation thermal signature', 'Proximity to water body', 'Ambiguous source attribution'],
    nearbyFeatures: [{ name: 'Chemical Storage', distance: 0.083, industrialContext: 'Weak' }],
    thermalIntensity: 91,
    maxFRP: 71.3,
    region: 'Remote Northern Territory',
    detectedDate: '2026-09-27',
  }),
];

// Generate a representative spread of events around the globe for the map.
// We produce the remaining 96 events deterministically so totals match the brief.
function generateRemainingEvents(): ThermalEvent[] {
  const regions = [
    'Sector 3', 'Sector 5', 'Sector 7', 'Sector 9', 'Sector 12',
    'Sector 15', 'Sector 18', 'Sector 22', 'Sector 25', 'Sector 30',
    'Coastal Processing Zone', 'Inland Mixed-Use Sector', 'North-East Industrial Corridor',
    'Remote Northern Territory', 'Southern Agricultural Belt', 'Eastern Mining District',
  ];
  const features = [
    { name: 'Refinery Stack', distance: 0.41, industrialContext: 'Moderate' as const },
    { name: 'Power Plant', distance: 1.2, industrialContext: 'Moderate' as const },
    { name: 'Storage Tank', distance: 0.027, industrialContext: 'Strong' as const },
    { name: 'Chemical Storage', distance: 0.083, industrialContext: 'Weak' as const },
    { name: 'Manufacturing Plant', distance: 0.35, industrialContext: 'Strong' as const },
    { name: 'Flare Stack', distance: 0.15, industrialContext: 'Strong' as const },
    { name: 'None detected', distance: 99, industrialContext: 'None' as const },
  ];

  const events: ThermalEvent[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  // Distribution: 59 Industrial, 34 Unknown, 4 Ambiguous, 2 AI Anomaly, 1 Conflict
  // Priority events already account for: 1 Conflict, 2 AI Anomaly, 1 Ambiguous
  // Remaining: 59 Industrial, 34 Unknown, 3 Ambiguous, 0 AI Anomaly, 0 Conflict
  const distribution: { cls: ThermalEvent['classification']; count: number }[] = [
    { cls: 'Industrial Thermal Source', count: 59 },
    { cls: 'Unknown / Requires Verification', count: 34 },
    { cls: 'Ambiguous / Requires Verification', count: 3 },
  ];

  let idx = 0;
  for (const { cls, count } of distribution) {
    for (let i = 0; i < count; i++) {
      const lat = -55 + rand() * 110;
      const lng = -170 + rand() * 340;
      const latLabel = `${Math.abs(lat).toFixed(4)} ${lat >= 0 ? 'N' : 'S'}`;
      const lngLabel = `${Math.abs(lng).toFixed(4)} ${lng >= 0 ? 'E' : 'W'}`;

      const isIndustrial = cls === 'Industrial Thermal Source';
      const indScore = isIndustrial ? 7 + Math.floor(rand() * 3) : Math.floor(rand() * 5);
      const natScore = isIndustrial ? Math.floor(rand() * 4) : 3 + Math.floor(rand() * 5);
      const abnScore = cls.includes('AI Anomaly') ? 6 + Math.floor(rand() * 4) : Math.floor(rand() * 3);

      events.push({
        id: `${(lat * 100).toFixed(1)}_${(lng * 100).toFixed(1)}`,
        lat: parseFloat(lat.toFixed(4)),
        lng: parseFloat(lng.toFixed(4)),
        latLabel,
        lngLabel,
        classification: cls,
        finalResult: cls,
        priority: isIndustrial ? Math.floor(rand() * 5) : Math.floor(rand() * 15) + 1,
        evidenceStrength: isIndustrial ? 'High' : rand() > 0.5 ? 'Medium' : 'Low',
        activeDays: 1 + Math.floor(rand() * 20),
        industrialScore: indScore,
        naturalScore: natScore,
        abnormalScore: abnScore,
        mlAnomalyScore: parseFloat((1 + rand() * 3).toFixed(4)),
        mlPercentile: 50 + Math.floor(rand() * 50),
        mlClass: cls.includes('AI Anomaly') ? 'Anomalous Pattern' : 'Normal Pattern',
        humanVerification: isIndustrial ? 'Not Required' : 'Required',
        supportingEvidence: supportingEvidenceTemplates[idx % supportingEvidenceTemplates.length],
        conflictingEvidence: isIndustrial ? [] : conflictingEvidenceTemplates[idx % conflictingEvidenceTemplates.length],
        nearbyFeatures: [features[idx % features.length]],
        thermalIntensity: 40 + Math.floor(rand() * 55),
        maxFRP: parseFloat((10 + rand() * 80).toFixed(1)),
        region: regions[idx % regions.length],
        detectedDate: `2026-09-${String(10 + (idx % 18)).padStart(2, '0')}`,
      });
      idx++;
    }
  }

  return events;
}

export const THERMAL_EVENTS: ThermalEvent[] = [...priorityEvents, ...generateRemainingEvents()];

export function getEventById(id: string): ThermalEvent | undefined {
  return THERMAL_EVENTS.find((e) => e.id === id);
}

export const PRIORITY_EVENTS: ThermalEvent[] = [...priorityEvents].sort((a, b) => b.priority - a.priority);

export const classificationColor = (cls: string): string => {
  const map: Record<string, string> = {
    'Industrial Thermal Source': '#147D7E',
    'AI Anomaly / Requires Investigation': '#D99A2B',
    'Unknown / Requires Verification': '#9CA3AF',
    'Ambiguous / Requires Verification': '#E4C04D',
    'Conflicting Evidence / Requires Verification': '#C85C5C',
  };
  return map[cls] ?? '#9CA3AF';
};
