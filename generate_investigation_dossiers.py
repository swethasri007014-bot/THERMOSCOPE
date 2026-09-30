import os
import pandas as pd

INPUT = "data/processed/forensic_events.csv"
OUTPUT = "data/processed/investigation_dossiers.csv"

print("Loading forensic events...")
df = pd.read_csv(INPUT)

print("Available columns:")
print(", ".join(df.columns))


def get_value(row, *names, default=0):
    """Return the first available column value."""
    for name in names:
        if name in row.index:
            value = row[name]

            if pd.isna(value):
                return default

            return value

    return default


def evidence_list(row):
    evidence = []

    active_days = get_value(row, "active_days")
    max_frp = get_value(row, "max_frp")
    night_ratio = get_value(row, "night_ratio")
    industrial_context = get_value(row, "industrial_context", default="Unknown")

    industrial_score = get_value(
        row,
        "industrial_evidence",
        "industrial_score",
        default=0
    )

    natural_score = get_value(
        row,
        "natural_evidence",
        "natural_score",
        default=0
    )

    abnormal_score = get_value(
        row,
        "abnormal_evidence",
        "abnormal_score",
        default=0
    )

    evidence_conflict = get_value(
        row,
        "evidence_conflict",
        default=False
    )

    if active_days >= 4:
        evidence.append("Highly persistent thermal activity")
    elif active_days >= 3:
        evidence.append("Persistent thermal activity")
    elif active_days == 2:
        evidence.append("Repeated thermal activity")

    if max_frp >= 500:
        evidence.append("Very high thermal intensity")
    elif max_frp >= 300:
        evidence.append("High thermal intensity")

    if night_ratio >= 0.30:
        evidence.append("Significant night-time activity")

    if industrial_context == "Strong":
        evidence.append("Industrial infrastructure detected nearby")
    elif industrial_context == "Moderate":
        evidence.append("Possible industrial infrastructure nearby")

    if natural_score >= 3:
        evidence.append("Natural/agricultural land evidence")

    if industrial_score >= 4 and natural_score >= 3:
        evidence.append("Industrial and natural evidence both present")

    if abnormal_score >= 2:
        evidence.append("Abnormal thermal behaviour indicator")

    if evidence_conflict:
        evidence.append("Conflicting evidence detected")

    if not evidence:
        evidence.append("Insufficient supporting evidence")

    return "; ".join(evidence)


def recommendation(row):
    status = str(
        get_value(
            row,
            "final_hypothesis",
            default="Unknown / Requires Verification"
        )
    )

    if "Conflicting Evidence" in status:
        return "Human verification required due to conflicting evidence."

    if "Unknown" in status or "Ambiguous" in status:
        return "Human verification required before classification."

    if status == "Abnormal Thermal Event":
        return "Investigate thermal anomaly and compare with facility baseline."

    if status == "Industrial Thermal Source":
        return "Monitor against historical facility behaviour."

    if status == "Natural/Agricultural Source":
        return "Check surrounding land-use and natural-fire indicators."

    return "Continue monitoring."


# Generate investigation evidence
df["supporting_evidence"] = df.apply(evidence_list, axis=1)
df["recommended_action"] = df.apply(recommendation, axis=1)

# Generate dossier IDs
df["dossier_id"] = [
    f"DOSSIER-{i:04d}"
    for i in range(1, len(df) + 1)
]


# Columns that actually exist in the forensic output
wanted_columns = [
    "dossier_id",
    "event_id",
    "latitude",
    "longitude",
    "max_frp",
    "active_days",
    "persistence_ratio",
    "night_ratio",
    "industrial_context",
    "industrial_evidence",
    "industrial_score",
    "natural_evidence",
    "natural_score",
    "abnormal_evidence",
    "abnormal_score",
    "evidence_conflict",
    "evidence_strength",
    "final_hypothesis",
    "human_verification_required",
    "investigation_priority",
    "supporting_evidence",
    "recommended_action",
]

# Keep only columns that exist
available_columns = [
    col for col in wanted_columns
    if col in df.columns
]

dossier = df[available_columns].copy()

os.makedirs("data/processed", exist_ok=True)
dossier.to_csv(OUTPUT, index=False)

print()
print("=" * 60)
print("INVESTIGATION DOSSIERS GENERATED")
print("=" * 60)

print(f"Total dossiers: {len(dossier):,}")
print(f"Saved to: {os.path.abspath(OUTPUT)}")

print()
print("Hypothesis distribution:")

if "final_hypothesis" in dossier.columns:
    print(
        dossier["final_hypothesis"]
        .value_counts()
        .to_string()
    )

print()
print("Top 10 investigation dossiers:")

display_columns = [
    col
    for col in [
        "dossier_id",
        "event_id",
        "final_hypothesis",
        "investigation_priority",
        "human_verification_required",
    ]
    if col in dossier.columns
]

if "investigation_priority" in dossier.columns:
    print(
        dossier[
            display_columns
        ]
        .sort_values(
            "investigation_priority",
            ascending=False
        )
        .head(10)
        .to_string(index=False)
    )
else:
    print(
        dossier[display_columns]
        .head(10)
        .to_string(index=False)
    )

print()
print("=" * 60)
print("DONE")
print("=" * 60)