import os
import pandas as pd

ML_INPUT = "data/processed/ml_anomaly_events.csv"
OUTPUT = "data/processed/final_investigation_results.csv"

print("=" * 60)
print("ML + THERMAL EVENT FORENSICS INTEGRATION")
print("=" * 60)

print("\nLoading ML results...")
df = pd.read_csv(ML_INPUT)


def determine_result(row):

    classification = str(row["final_classification"])
    ml_class = str(row["ml_anomaly_class"])
    ml_score = float(row["ml_anomaly_score"])

    conflict = bool(row["evidence_conflict"])
    verification = bool(row["requires_human_verification"])

    # -----------------------------------------------------
    # 1. Conflicting evidence always gets priority
    # -----------------------------------------------------

    if conflict:
        return "Conflicting Evidence / Requires Verification"

    # -----------------------------------------------------
    # 2. Strong ML anomaly
    # -----------------------------------------------------

    if ml_class == "High Anomaly":
        return "AI Anomaly / Requires Investigation"

    # -----------------------------------------------------
    # 3. Moderate ML anomaly + uncertain forensic result
    # -----------------------------------------------------

    if (
        ml_class == "Moderate Anomaly"
        and (
            "Unknown" in classification
            or "Ambiguous" in classification
        )
    ):
        return "AI Anomaly / Requires Investigation"

    # -----------------------------------------------------
    # 4. Existing forensic uncertainty
    # -----------------------------------------------------

    if verification:
        return classification

    # -----------------------------------------------------
    # 5. Otherwise retain forensic classification
    # -----------------------------------------------------

    return classification


df["final_investigation_result"] = df.apply(
    determine_result,
    axis=1
)


# ---------------------------------------------------------
# Investigation explanation
# ---------------------------------------------------------

def explanation(row):

    result = row["final_investigation_result"]

    if result == "AI Anomaly / Requires Investigation":
        return (
            "ML detected unusual multivariate thermal behaviour. "
            "The event should be investigated using contextual evidence."
        )

    if "Conflicting Evidence" in result:
        return (
            "Industrial and natural evidence conflict. "
            "Automatic classification is withheld."
        )

    if "Unknown" in result or "Ambiguous" in result:
        return (
            "Available evidence is insufficient for confident "
            "automatic classification."
        )

    if result == "Industrial Thermal Source":
        return (
            "Thermal behaviour and contextual evidence are "
            "consistent with an industrial thermal source."
        )

    if result == "Abnormal Thermal Event":
        return (
            "Thermal behaviour contains indicators of an "
            "abnormal event requiring investigation."
        )

    if result == "Natural/Agricultural Source":
        return (
            "Available contextual evidence is more consistent "
            "with a natural or agricultural thermal source."
        )

    return "Continue monitoring."


df["investigation_explanation"] = df.apply(
    explanation,
    axis=1
)


# ---------------------------------------------------------
# Investigation priority
# ---------------------------------------------------------

def priority(row):

    score = float(row["investigation_priority"])

    if row["ml_anomaly_class"] == "High Anomaly":
        score += 8

    elif row["ml_anomaly_class"] == "Moderate Anomaly":
        score += 4

    if row["evidence_conflict"]:
        score += 6

    return score


df["final_priority"] = df.apply(
    priority,
    axis=1
)


df["final_priority"] = (
    df["final_priority"]
    .round(2)
)


# ---------------------------------------------------------
# Sort highest priority first
# ---------------------------------------------------------

df = df.sort_values(
    "final_priority",
    ascending=False
).reset_index(drop=True)

df["final_rank"] = (
    df.index + 1
)


# ---------------------------------------------------------
# Save
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
# Results
# ---------------------------------------------------------

print()
print("Final investigation results generated.")

print()
print("Result distribution:")
print(
    df["final_investigation_result"]
    .value_counts()
    .to_string()
)

print()
print("Top 15 investigation cases:")

columns = [
    "final_rank",
    "event_id",
    "final_investigation_result",
    "ml_anomaly_score",
    "ml_anomaly_class",
    "evidence_conflict",
    "final_priority",
]

print(
    df[columns]
    .head(15)
    .to_string(index=False)
)

print()
print("Saved to:")
print(os.path.abspath(OUTPUT))

print()
print("=" * 60)
print("ML + FORENSICS INTEGRATION COMPLETE")
print("=" * 60)