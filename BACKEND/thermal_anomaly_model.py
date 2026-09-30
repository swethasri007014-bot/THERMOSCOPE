import os
import numpy as np
import pandas as pd

INPUT = "data/processed/forensic_events.csv"
OUTPUT = "data/processed/ml_anomaly_events.csv"

print("=" * 60)
print("THERMAL ANOMALY ML MODEL")
print("=" * 60)

print("\nLoading forensic events...")
df = pd.read_csv(INPUT)

# ---------------------------------------------------------
# 1. Select numerical thermal/temporal features
# ---------------------------------------------------------

FEATURES = [
    "max_frp",
    "mean_frp",
    "active_days",
    "persistence_ratio",
    "night_ratio",
    "confidence_score",
    "industrial_evidence_score",
    "natural_evidence_score",
    "abnormal_event_score",
]

missing = [f for f in FEATURES if f not in df.columns]

if missing:
    print("Missing required features:", missing)
    raise SystemExit(1)

X = df[FEATURES].astype(float).fillna(0).values


# ---------------------------------------------------------
# 2. Robust feature normalization
# ---------------------------------------------------------
# Median and MAD are used instead of sklearn so this model
# does not depend on scipy/sklearn.

median = np.median(X, axis=0)

mad = np.median(
    np.abs(X - median),
    axis=0
)

# Prevent division by zero
mad[mad == 0] = 1.0

Z = np.abs(
    (X - median) / (1.4826 * mad)
)


# ---------------------------------------------------------
# 3. ML anomaly score
# ---------------------------------------------------------
# Each event receives a multivariate anomaly score.
#
# Higher score = more unusual behaviour compared with
# the observed thermal-event population.

anomaly_score = np.sqrt(
    np.mean(Z ** 2, axis=1)
)


# ---------------------------------------------------------
# 4. Rank events
# ---------------------------------------------------------

rank = (
    pd.Series(anomaly_score)
    .rank(
        method="min",
        ascending=False
    )
    .astype(int)
)

percentile = (
    pd.Series(anomaly_score)
    .rank(
        pct=True
    ) * 100
)


# ---------------------------------------------------------
# 5. Convert score into investigation categories
# ---------------------------------------------------------

def classify_score(score):
    if score >= 3.0:
        return "High Anomaly"

    if score >= 2.0:
        return "Moderate Anomaly"

    return "Normal Pattern"


df["ml_anomaly_score"] = np.round(
    anomaly_score,
    4
)

df["ml_anomaly_percentile"] = np.round(
    percentile.values,
    2
)

df["ml_anomaly_rank"] = rank.values

df["ml_anomaly_class"] = [
    classify_score(score)
    for score in anomaly_score
]


# ---------------------------------------------------------
# 6. ML investigation flag
# ---------------------------------------------------------

df["ml_investigation_flag"] = (
    df["ml_anomaly_class"]
    != "Normal Pattern"
)


# ---------------------------------------------------------
# 7. Save results
# ---------------------------------------------------------

os.makedirs(
    "data/processed",
    exist_ok=True
)

df.to_csv(
    OUTPUT,
    index=False
)


# ---------------------------------------------------------
# 8. Display results
# ---------------------------------------------------------

print()
print("ML anomaly analysis completed.")

print()
print("Events analysed:", len(df))

print()
print("Anomaly distribution:")
print(
    df["ml_anomaly_class"]
    .value_counts()
    .to_string()
)

print()
print("Top 15 anomalous events:")

top = (
    df[
        [
            "event_id",
            "max_frp",
            "active_days",
            "persistence_ratio",
            "night_ratio",
            "ml_anomaly_score",
            "ml_anomaly_class",
        ]
    ]
    .sort_values(
        "ml_anomaly_score",
        ascending=False
    )
    .head(15)
)

print(
    top.to_string(index=False)
)

print()
print("Saved to:")
print(os.path.abspath(OUTPUT))

print()
print("=" * 60)
print("ML ANOMALY MODEL COMPLETE")
print("=" * 60)