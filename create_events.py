import pandas as pd
import numpy as np
from pathlib import Path


# --------------------------------------------------
# Paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "firms_viirs_noaa20_5days.csv"
)

OUTPUT_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / "thermal_events.csv"


# --------------------------------------------------
# Load data
# --------------------------------------------------

print("\n========================================")
print("THERMAL EVENT CREATION")
print("========================================")

df = pd.read_csv(INPUT_FILE)

print(f"\nRaw FIRMS detections: {len(df):,}")


# --------------------------------------------------
# Remove invalid coordinates
# --------------------------------------------------

df = df.dropna(subset=["latitude", "longitude"]).copy()

print(f"Valid detections: {len(df):,}")


# --------------------------------------------------
# Create spatial grid
# --------------------------------------------------
# Approximately 1 km grid cells.
# This groups nearby FIRMS detections without
# requiring scikit-learn or SciPy.
# --------------------------------------------------

GRID_SIZE = 0.01

df["lat_cell"] = np.floor(df["latitude"] / GRID_SIZE)
df["lon_cell"] = np.floor(df["longitude"] / GRID_SIZE)

df["event_id"] = (
    df["lat_cell"].astype(str)
    + "_"
    + df["lon_cell"].astype(str)
)


# --------------------------------------------------
# Build event-level information
# --------------------------------------------------

events = (
    df.groupby("event_id")
    .agg(
        latitude=("latitude", "mean"),
        longitude=("longitude", "mean"),

        detection_count=("event_id", "size"),

        max_frp=("frp", "max"),
        mean_frp=("frp", "mean"),

        max_brightness=("bright_ti4", "max"),
        mean_brightness=("bright_ti4", "mean"),

        high_confidence_count=(
            "confidence",
            lambda x: (x == "h").sum()
        ),

        nominal_confidence_count=(
            "confidence",
            lambda x: (x == "n").sum()
        ),

        low_confidence_count=(
            "confidence",
            lambda x: (x == "l").sum()
        ),

        day_count=(
            "daynight",
            lambda x: (x == "D").sum()
        ),

        night_count=(
            "daynight",
            lambda x: (x == "N").sum()
        ),
    )
    .reset_index()
)


# --------------------------------------------------
# Event-level evidence features
# --------------------------------------------------

events["confidence_score"] = (
    events["high_confidence_count"] * 1.0
    + events["nominal_confidence_count"] * 0.7
    + events["low_confidence_count"] * 0.4
) / events["detection_count"]


events["night_ratio"] = (
    events["night_count"]
    / events["detection_count"]
)


events["event_strength"] = (
    events["max_frp"]
    * events["confidence_score"]
)


# --------------------------------------------------
# Sort strongest events first
# --------------------------------------------------

events = events.sort_values(
    "event_strength",
    ascending=False
).reset_index(drop=True)


# --------------------------------------------------
# Save
# --------------------------------------------------

events.to_csv(
    OUTPUT_FILE,
    index=False
)


# --------------------------------------------------
# Summary
# --------------------------------------------------

print(f"\nThermal events created: {len(events):,}")

print("\nTop 10 events:")

print(
    events[
        [
            "event_id",
            "latitude",
            "longitude",
            "detection_count",
            "max_frp",
            "max_brightness",
            "confidence_score",
            "event_strength",
        ]
    ]
    .head(10)
    .to_string(index=False)
)

print("\nSaved to:")
print(OUTPUT_FILE)

print("\n========================================")
print("EVENT CREATION COMPLETE")
print("========================================")