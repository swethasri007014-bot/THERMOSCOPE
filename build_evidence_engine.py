import os
import pandas as pd

INPUT_FILE = "data/processed/osm_enriched_events.csv"
OUTPUT_FILE = "data/processed/forensic_events.csv"

print("=" * 60)
print("THERMAL EVENT FORENSICS ENGINE")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

print()
print(f"Events loaded: {len(df)}")


# ---------------------------------------------------------
# Fill missing OSM values
# ---------------------------------------------------------

df["industrial_context"] = (
    df["industrial_context"]
    .fillna("Unavailable")
)

df["industrial_feature_count"] = (
    df["industrial_feature_count"]
    .fillna(0)
)

df["power_feature_count"] = (
    df["power_feature_count"]
    .fillna(0)
)

df["forest_feature_count"] = (
    df["forest_feature_count"]
    .fillna(0)
)

df["farmland_feature_count"] = (
    df["farmland_feature_count"]
    .fillna(0)
)

df["quarry_feature_count"] = (
    df["quarry_feature_count"]
    .fillna(0)
)

df["night_ratio"] = (
    df["night_ratio"]
    .fillna(0)
)

df["persistence_ratio"] = (
    df["persistence_ratio"]
    .fillna(0)
)


# ---------------------------------------------------------
# Evidence scoring
# ---------------------------------------------------------

def analyse_event(row):

    supporting = []
    conflicting = []

    industrial_score = 0.0
    natural_score = 0.0
    abnormal_score = 0.0

    # -----------------------------
    # Thermal intensity
    # -----------------------------

    if row["max_frp"] >= 500:

        abnormal_score += 2

        supporting.append(
            "Very high thermal intensity"
        )

    elif row["max_frp"] >= 300:

        abnormal_score += 1

        supporting.append(
            "High thermal intensity"
        )

    # -----------------------------
    # Persistence
    # -----------------------------

    if row["active_days"] >= 4:

        industrial_score += 3

        supporting.append(
            "Highly persistent thermal activity"
        )

    elif row["active_days"] >= 3:

        industrial_score += 2

        supporting.append(
            "Persistent thermal activity"
        )

    elif row["active_days"] == 2:

        industrial_score += 1

        supporting.append(
            "Repeated thermal activity"
        )

    # -----------------------------
    # Night-time behaviour
    # -----------------------------

    if row["night_ratio"] >= 0.30:

        industrial_score += 2

        supporting.append(
            "Significant night-time activity"
        )

    # -----------------------------
    # Industrial OSM context
    # -----------------------------

    if row["industrial_context"] == "Strong":

        industrial_score += 4

        supporting.append(
            "Nearby industrial or power infrastructure"
        )

    # -----------------------------
    # Natural context
    # -----------------------------

    if row["forest_feature_count"] > 0:

        natural_score += 3

        conflicting.append(
            "Nearby forest or woodland context"
        )

    if row["farmland_feature_count"] > 0:

        natural_score += 3

        conflicting.append(
            "Nearby agricultural land context"
        )

    if row["quarry_feature_count"] > 0:

        industrial_score += 1

        supporting.append(
            "Nearby quarry activity"
        )

    # -----------------------------
    # Evidence conflict
    # -----------------------------

    evidence_conflict = False

    if (
        industrial_score >= 4
        and natural_score >= 3
    ):

        evidence_conflict = True

        conflicting.append(
            "Industrial and natural-source evidence conflict"
        )

    # -----------------------------
    # Determine hypothesis
    # -----------------------------

    scores = {
        "Industrial Thermal Source": industrial_score,
        "Natural/Agricultural Source": natural_score,
        "Abnormal Thermal Event": abnormal_score
    }

    ranked = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    best_label = ranked[0][0]
    best_score = ranked[0][1]

    second_score = ranked[1][1]

    # -----------------------------------------------------
    # Open-world / abstention logic
    # -----------------------------------------------------

    requires_verification = False

    if best_score < 3:

        final_class = "Unknown / Requires Verification"

        requires_verification = True

        conflicting.append(
            "Insufficient supporting evidence"
        )

    elif evidence_conflict:

        final_class = "Conflicting Evidence / Requires Verification"

        requires_verification = True

    elif (
        best_score - second_score <= 1
    ):

        final_class = "Ambiguous / Requires Verification"

        requires_verification = True

        conflicting.append(
            "Competing hypotheses have similar evidence strength"
        )

    else:

        final_class = best_label

    # -----------------------------------------------------
    # Evidence strength
    # -----------------------------------------------------

    total_score = (
        industrial_score
        + natural_score
        + abnormal_score
    )

    if total_score >= 7:

        evidence_strength = "High"

    elif total_score >= 4:

        evidence_strength = "Moderate"

    else:

        evidence_strength = "Low"

    return pd.Series({

        "industrial_evidence_score":
            round(industrial_score, 2),

        "natural_evidence_score":
            round(natural_score, 2),

        "abnormal_event_score":
            round(abnormal_score, 2),

        "evidence_strength":
            evidence_strength,

        "evidence_conflict":
            evidence_conflict,

        "primary_hypothesis":
            best_label,

        "primary_hypothesis_score":
            round(best_score, 2),

        "final_classification":
            final_class,

        "requires_human_verification":
            requires_verification,

        "supporting_evidence":
            " | ".join(supporting),

        "conflicting_evidence":
            " | ".join(conflicting)
    })


# ---------------------------------------------------------
# Run evidence analysis
# ---------------------------------------------------------

analysis = df.apply(
    analyse_event,
    axis=1
)

df = pd.concat(
    [df, analysis],
    axis=1
)


# ---------------------------------------------------------
# Investigation priority
# ---------------------------------------------------------

def investigation_priority(row):

    score = 0

    if row["requires_human_verification"]:
        score += 4

    if row["evidence_conflict"]:
        score += 4

    if row["max_frp"] >= 500:
        score += 3

    elif row["max_frp"] >= 300:
        score += 2

    if row["active_days"] >= 3:
        score += 3

    elif row["active_days"] == 2:
        score += 1

    if row["industrial_context"] == "Strong":
        score += 2

    if row["forest_feature_count"] > 0:
        score += 2

    if row["farmland_feature_count"] > 0:
        score += 2

    return score


df["investigation_priority"] = df.apply(
    investigation_priority,
    axis=1
)


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# Results
# ---------------------------------------------------------

print()
print("=" * 60)
print("FORENSIC CLASSIFICATION SUMMARY")
print("=" * 60)

print()

print(
    df["final_classification"]
    .value_counts()
)

print()
print("Evidence strength:")

print(
    df["evidence_strength"]
    .value_counts()
)

print()
print("Evidence conflicts:")

print(
    df["evidence_conflict"]
    .value_counts()
)

print()
print("Human verification required:")

print(
    df["requires_human_verification"]
    .value_counts()
)

print()
print("Top investigation candidates:")

print(
    df[
        [
            "event_id",
            "latitude",
            "longitude",
            "max_frp",
            "active_days",
            "industrial_context",
            "industrial_evidence_score",
            "natural_evidence_score",
            "abnormal_event_score",
            "evidence_conflict",
            "final_classification",
            "requires_human_verification",
            "investigation_priority"
        ]
    ]
    .sort_values(
        "investigation_priority",
        ascending=False
    )
    .head(20)
    .to_string(index=False)
)

print()
print("Saved to:")
print(os.path.abspath(OUTPUT_FILE))

print()
print("=" * 60)
print("THERMAL EVENT FORENSICS COMPLETE")
print("=" * 60)