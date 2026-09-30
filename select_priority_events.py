import os
import pandas as pd

INPUT_FILE = "data/processed/temporal_events.csv"
OUTPUT_FILE = "data/processed/priority_events.csv"

print("=" * 50)
print("PRIORITY THERMAL EVENT SELECTION")
print("=" * 50)

df = pd.read_csv(INPUT_FILE)

# --------------------------------------------------
# 1. Select persistent candidates
# --------------------------------------------------

persistent = df[
    df["temporal_pattern"].isin(
        ["Highly Persistent", "Persistent"]
    )
].sort_values(
    ["active_days", "priority_score"],
    ascending=[False, False]
).head(40)

# --------------------------------------------------
# 2. Select repeated candidates
# --------------------------------------------------

repeated = df[
    df["temporal_pattern"] == "Repeated"
].sort_values(
    "priority_score",
    ascending=False
).head(30)

# --------------------------------------------------
# 3. Select high-energy single-day candidates
# --------------------------------------------------

single_day = df[
    df["temporal_pattern"] == "Single-Day"
].sort_values(
    "thermal_strength",
    ascending=False
).head(30)

# --------------------------------------------------
# Combine
# --------------------------------------------------

priority = pd.concat(
    [persistent, repeated, single_day],
    ignore_index=True
)

# Remove accidental duplicates
priority = priority.drop_duplicates(
    subset=["event_id"]
)

# Add investigation category
def investigation_category(row):

    if row["temporal_pattern"] in [
        "Highly Persistent",
        "Persistent"
    ]:
        return "Persistent Candidate"

    elif row["temporal_pattern"] == "Repeated":
        return "Repeated Candidate"

    else:
        return "High-Thermal Candidate"


priority["investigation_category"] = priority.apply(
    investigation_category,
    axis=1
)

# Final ranking
priority = priority.sort_values(
    "priority_score",
    ascending=False
).reset_index(drop=True)

priority["investigation_rank"] = (
    priority.index + 1
)

# Save
os.makedirs(
    "data/processed",
    exist_ok=True
)

priority.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print(f"Total priority candidates: {len(priority)}")

print()
print("Investigation categories:")
print(
    priority["investigation_category"]
    .value_counts()
)

print()
print("Top priority candidates:")

print(
    priority[
        [
            "investigation_rank",
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
            "investigation_category",
            "priority_score"
        ]
    ].head(20).to_string(index=False)
)

print()
print("Saved to:")
print(os.path.abspath(OUTPUT_FILE))

print()
print("=" * 50)
print("PRIORITY SELECTION COMPLETE")
print("=" * 50)