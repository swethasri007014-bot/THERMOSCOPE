import pandas as pd
from pathlib import Path


# --------------------------------------------------
# Paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "data" / "raw" / "firms_viirs_noaa20_latest.csv"


# --------------------------------------------------
# Load data
# --------------------------------------------------

print("\n========================================")
print("NASA FIRMS DATA ANALYSIS")
print("========================================")

df = pd.read_csv(INPUT_FILE)

print(f"\nTotal records: {len(df):,}")
print(f"Total columns: {len(df.columns)}")


# --------------------------------------------------
# Basic information
# --------------------------------------------------

print("\n--- DATE RANGE ---")

df["acq_date"] = pd.to_datetime(df["acq_date"])

print(f"First date : {df['acq_date'].min().date()}")
print(f"Last date  : {df['acq_date'].max().date()}")


# --------------------------------------------------
# Geographic extent
# --------------------------------------------------

print("\n--- GEOGRAPHIC EXTENT ---")

print(f"Latitude  : {df['latitude'].min():.4f} to {df['latitude'].max():.4f}")
print(f"Longitude : {df['longitude'].min():.4f} to {df['longitude'].max():.4f}")


# --------------------------------------------------
# Day / Night
# --------------------------------------------------

print("\n--- DAY / NIGHT ---")

print(df["daynight"].value_counts(dropna=False))


# --------------------------------------------------
# Confidence
# --------------------------------------------------

print("\n--- CONFIDENCE ---")

print(df["confidence"].value_counts(dropna=False).sort_index())


# --------------------------------------------------
# FRP statistics
# --------------------------------------------------

print("\n--- FRP (Fire Radiative Power) ---")

print(df["frp"].describe())


# --------------------------------------------------
# Brightness statistics
# --------------------------------------------------

print("\n--- BRIGHTNESS TEMPERATURE (TI4) ---")

print(df["bright_ti4"].describe())


# --------------------------------------------------
# Nighttime vs daytime FRP
# --------------------------------------------------

print("\n--- AVERAGE FRP BY DAY/NIGHT ---")

print(
    df.groupby("daynight")["frp"]
    .agg(["count", "mean", "median", "max"])
)


# --------------------------------------------------
# Highest FRP detections
# --------------------------------------------------

print("\n--- TOP 10 HIGHEST FRP DETECTIONS ---")

top_frp = df.nlargest(10, "frp")[
    [
        "latitude",
        "longitude",
        "acq_date",
        "acq_time",
        "frp",
        "bright_ti4",
        "confidence",
        "daynight",
    ]
]

print(top_frp.to_string(index=False))


# --------------------------------------------------
# Duplicate locations
# --------------------------------------------------

print("\n--- DUPLICATE COORDINATES ---")

duplicates = df.duplicated(
    subset=["latitude", "longitude", "acq_date", "acq_time"]
).sum()

print(f"Duplicate detections: {duplicates:,}")


# --------------------------------------------------
# Missing values
# --------------------------------------------------

print("\n--- MISSING VALUES ---")

missing = df.isnull().sum()

print(missing[missing > 0])


# --------------------------------------------------
# Satellite / instrument
# --------------------------------------------------

print("\n--- SATELLITE ---")
print(df["satellite"].value_counts())

print("\n--- INSTRUMENT ---")
print(df["instrument"].value_counts())


# --------------------------------------------------
# Final
# --------------------------------------------------

print("\n========================================")
print("ANALYSIS COMPLETE")
print("========================================")