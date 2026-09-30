from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI(
    title="Thermal Source Intelligence API",
    description="SIH 26162 thermal event investigation backend",
    version="1.0.0"
)

# Allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# DATA PATH
# --------------------------------------------------

DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "processed",
    "final_investigation_results.csv"
)

# Load investigation results
if not os.path.exists(DATA_FILE):
    raise FileNotFoundError(
        f"Investigation results not found: {DATA_FILE}"
    )

df = pd.read_csv(DATA_FILE)


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "system": "Thermal Source Intelligence API",
        "status": "running",
        "events": len(df),
        "data_source": "NASA FIRMS + OSM + temporal analysis + ML anomaly detection"
    }


# --------------------------------------------------
# SUMMARY
# --------------------------------------------------

@app.get("/api/summary")
def get_summary():

    classification_counts = (
        df["final_investigation_result"]
        .value_counts()
        .to_dict()
    )

    return {
        "total_events": len(df),
        "classification_counts": classification_counts,
        "human_verification_required": int(
            df["requires_human_verification"].sum()
        ),
        "evidence_conflicts": int(
            df["evidence_conflict"].sum()
        ),
        "ai_anomalies": int(
            (df["final_investigation_result"] ==
             "AI Anomaly / Requires Investigation").sum()
        )
    }


# --------------------------------------------------
# ALL EVENTS
# --------------------------------------------------

@app.get("/api/events")
def get_events():

    events_df = df.copy()

    # Convert NaN values to JSON-safe None
    events_df = events_df.astype(object).where(
        pd.notna(events_df),
        None
    )

    records = events_df.to_dict(
        orient="records"
    )

    return {
        "count": len(records),
        "events": records
    }


# --------------------------------------------------
# PRIORITY EVENTS
# --------------------------------------------------

@app.get("/api/events/priority")
def get_priority_events():

    priority_df = df.sort_values(
        "final_priority",
        ascending=False
    ).head(20).copy()

    # Convert NaN values to JSON-safe None
    priority_df = priority_df.astype(object).where(
        pd.notna(priority_df),
        None
    )

    records = priority_df.to_dict(
        orient="records"
    )

    return {
        "count": len(records),
        "events": records
    }

# --------------------------------------------------
# SINGLE EVENT
# --------------------------------------------------

@app.get("/api/events/{event_id}")
def get_event(event_id: str):

    result = df[df["event_id"].astype(str) == event_id]

    if result.empty:
        raise HTTPException(
            status_code=404,
            detail="Thermal event not found"
        )

    record = result.iloc[0].where(
        pd.notnull(result.iloc[0]),
        None
    ).to_dict()

    return record