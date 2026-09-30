export type Classification =
  | 'Industrial Thermal Source'
  | 'Unknown / Requires Verification'
  | 'Ambiguous / Requires Verification'
  | 'AI Anomaly / Requires Investigation'
  | 'Conflicting Evidence / Requires Verification';

export type FinalResult =
  | 'Industrial Thermal Source'
  | 'Unknown / Requires Verification'
  | 'Ambiguous / Requires Verification'
  | 'AI Anomaly / Requires Investigation'
  | 'Conflicting Evidence / Requires Verification';

export type MLClass = 'Normal Pattern' | 'Anomalous Pattern' | 'Uncertain';

export interface NearbyFeature {
  name: string;
  distance: number; // km
  industrialContext: 'Strong' | 'Moderate' | 'Weak' | 'None';
}

export interface ThermalEvent {
  id: string;
  lat: number;
  lng: number;
  latLabel: string;
  lngLabel: string;
  classification: Classification;
  finalResult: FinalResult;
  priority: number;
  evidenceStrength: 'High' | 'Medium' | 'Low';
  activeDays: number;
  industrialScore: number;
  naturalScore: number;
  abnormalScore: number;
  mlAnomalyScore: number;
  mlPercentile: number;
  mlClass: MLClass;
  humanVerification: 'Required' | 'Not Required';
  supportingEvidence: string[];
  conflictingEvidence: string[];
  nearbyFeatures: NearbyFeature[];
  thermalIntensity: number; // 0-100 for marker sizing
  maxFRP: number; // Fire Radiative Power in MW
  region: string;
  detectedDate: string;
}

export interface ClassificationBreakdown {
  classification: Classification;
  count: number;
  color: string;
}
