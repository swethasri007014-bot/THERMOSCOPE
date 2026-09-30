import os
import pandas as pd
import numpy as np

INPUT_FILE = "data/raw/firms_viirs_noaa20_5days.csv"
OUTPUT_FILE = "data/processed/temporal_events.csv"

print("=" * 45)
print("5-DAY TEMPORAL EVENT ANALYSIS")
print("=" * 45)

# Load FIRMS data
df = pd.read_csv(INPUT_FILE)

# Convert date
df["acq_date"] = pd.to_datetime(df["acq_date"])

# Clean coordinates
df = df.dropna(subset=["latitude", "longitude"])

# Create a spatial cell
# Same spatial cell = candidate event location
GRID_SIZE = 0.01

df["lat_cell"] = np.floor(df["latitude"] / GRID_SIZE)
df["lon_cell"] = np.floor(df["longitude"] / GRID_SIZE)

df["event_id"] = (
    df["lat_cell"].astype(str)
    + "_"
    + df["lon_cell"].astype(str)
)

# ------------------------------------------------
# Aggregate temporal behaviour
# ------------------------------------------------

events = (
    df.groupby("event_id")
    .agg(
        latitude=("latitude", "mean"),
        longitude=("longitude", "mean"),

        detection_count=("event_id", "size"),

        active_days=("acq_date", "nunique"),

        first_detection=("acq_date", "min"),
        last_detection=("acq_date", "max"),

        max_frp=("frp", "max"),
        mean_frp=("frp", "mean"),

        max_brightness=("bright_ti4", "max"),
        mean_brightness=("bright_ti4", "mean"),

        high_confidence=("confidence", lambda x: (x == "h").sum()),
        nominal_confidence=("confidence", lambda x: (x == "n").sum()),
        low_confidence=("confidence", lambda x: (x == "l").sum()),

        night_detections=("daynight", lambda x: (x == "N").sum()),
        day_detections=("daynight", lambda x: (x == "D").sum()),
    )
    .reset_index()
)

# ------------------------------------------------
# Derived temporal features
# ------------------------------------------------

TOTAL_DAYS = 5

events["persistence_ratio"] = (
    events["active_days"] / TOTAL_DAYS
)

events["night_ratio"] = (
    events["night_detections"] /
    events["detection_count"]
)

events["confidence_score"] = (
    (
        events["high_confidence"] * 1.0
        + events["nominal_confidence"] * 0.7
        + events["low_confidence"] * 0.4
    )
    / events["detection_count"]
)

events["thermal_strength"] = (
    events["max_frp"] *
    events["confidence_score"]
)

# ------------------------------------------------
# Temporal classification
# ------------------------------------------------

def temporal_pattern(row):

    if row["active_days"] >= 4:
        return "Highly Persistent"

    elif row["active_days"] >= 3:
        return "Persistent"

    elif row["active_days"] == 2:
        return "Repeated"

    else:
        return "Single-Day"

events["temporal_pattern"] = events.apply(
    temporal_pattern,
    axis=1
)

# ------------------------------------------------
# Priority score
# ------------------------------------------------

events["priority_score"] = (
    events["thermal_strength"] * 0.50
    + events["persistence_ratio"] * 100 * 0.30
    + events["night_ratio"] * 100 * 0.20
)

# Sort strongest candidates first
events = events.sort_values(
    "priority_score",
    ascending=False
)

# Save
os.makedirs("data/processed", exist_ok=True)

events.to_csv(
    OUTPUT_FILE,
    index=False
)

# ------------------------------------------------
# Summary
# ------------------------------------------------

print()
print(f"Raw detections: {len(df):,}")
print(f"Candidate spatial events: {len(events):,}")

print()
print("Temporal pattern distribution:")
print(events["temporal_pattern"].value_counts())

print()
print("Top 15 candidate events:")
print(
    events[
        [
            "event_id",
            "latitude",
            "longitude",
            "detection_count",
            "active_days",
            "persistence_ratio",
            "max_frp",
            "mean_frp",
            "night_ratio",
            "temporal_pattern",
            "priority_score",
        ]
    ].head(15).to_string(index=False)
)

print()
print("Saved to:")
print(os.path.abspath(OUTPUT_FILE))

print()
print("=" * 45)
print("TEMPORAL ANALYSIS COMPLETE")
print("=" * 45)