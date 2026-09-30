import os
import time
import math
import requests
import pandas as pd

INPUT_FILE = "data/processed/priority_events.csv"
OUTPUT_FILE = "data/processed/osm_enriched_events.csv"

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

RADIUS_METERS = 2000
BATCH_SIZE = 5

HEADERS = {
    "User-Agent": "SIH26162-ThermalSourceResearch/1.0"
}

print("=" * 60)
print("OSM CONTEXT ENRICHMENT")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

print()
print(f"Priority events loaded: {len(df)}")


def haversine(lat1, lon1, lat2, lon2):

    R = 6371.0

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return R * 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )


def build_query(events):

    blocks = []

    for _, row in events.iterrows():

        lat = row["latitude"]
        lon = row["longitude"]

        blocks.append(f"""
        nwr(around:{RADIUS_METERS},{lat},{lon})["industrial"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["landuse"="industrial"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["man_made"="works"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["power"~"plant|generator|substation"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["man_made"~"storage_tank|works"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["landuse"="quarry"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["landuse"="farmland"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["landuse"="orchard"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["landuse"="forest"];
        nwr(around:{RADIUS_METERS},{lat},{lon})["natural"="wood"];
        """)

    return f"""
    [out:json][timeout:120];
    (
        {"".join(blocks)}
    );
    out tags center;
    """


def get_coordinates(element):

    if element["type"] == "node":

        return (
            element.get("lat"),
            element.get("lon")
        )

    center = element.get("center")

    if center:

        return (
            center.get("lat"),
            center.get("lon")
        )

    return None, None


def classify_feature(tags):

    if tags.get("power") == "plant":
        return "Power Plant"

    if tags.get("power") == "generator":
        return "Power Generator"

    if tags.get("power") == "substation":
        return "Substation"

    if tags.get("industrial"):
        return "Industrial: " + str(tags["industrial"])

    if tags.get("landuse") == "industrial":
        return "Industrial Area"

    if tags.get("man_made") == "works":
        return "Industrial Works"

    if tags.get("man_made") == "storage_tank":
        return "Storage Tank"

    if tags.get("landuse") == "quarry":
        return "Quarry"

    if tags.get("landuse") == "farmland":
        return "Farmland"

    if tags.get("landuse") == "orchard":
        return "Orchard"

    if tags.get("landuse") == "forest":
        return "Forest"

    if tags.get("natural") == "wood":
        return "Woodland"

    return "Other"


def analyse_event(event_lat, event_lon, elements):

    nearest_distance = None
    nearest_name = ""
    nearest_type = ""

    industrial_count = 0
    power_count = 0
    forest_count = 0
    farmland_count = 0
    quarry_count = 0

    evidence_types = []

    for element in elements:

        tags = element.get("tags", {})

        lat, lon = get_coordinates(element)

        if lat is None or lon is None:
            continue

        distance = haversine(
            event_lat,
            event_lon,
            lat,
            lon
        )

        if distance > RADIUS_METERS / 1000:
            continue

        feature_type = classify_feature(tags)

        name = (
            tags.get("name")
            or tags.get("operator")
            or tags.get("brand")
            or ""
        )

        if (
            tags.get("industrial")
            or tags.get("landuse") == "industrial"
            or tags.get("man_made") in [
                "works",
                "storage_tank"
            ]
        ):
            industrial_count += 1

        if tags.get("power") in [
            "plant",
            "generator",
            "substation"
        ]:
            power_count += 1

        if (
            tags.get("landuse") == "forest"
            or tags.get("natural") == "wood"
        ):
            forest_count += 1

        if tags.get("landuse") in [
            "farmland",
            "orchard"
        ]:
            farmland_count += 1

        if tags.get("landuse") == "quarry":
            quarry_count += 1

        if feature_type not in evidence_types:
            evidence_types.append(feature_type)

        if (
            nearest_distance is None
            or distance < nearest_distance
        ):
            nearest_distance = distance
            nearest_name = name
            nearest_type = feature_type

    if industrial_count > 0 or power_count > 0:
        industrial_context = "Strong"

    elif quarry_count > 0:
        industrial_context = "Moderate"

    else:
        industrial_context = "None"

    return {
        "industrial_feature_count": industrial_count,
        "power_feature_count": power_count,
        "forest_feature_count": forest_count,
        "farmland_feature_count": farmland_count,
        "quarry_feature_count": quarry_count,
        "nearest_feature_name": nearest_name,
        "nearest_feature_type": nearest_type,
        "nearest_feature_distance_km": (
            round(nearest_distance, 3)
            if nearest_distance is not None
            else None
        ),
        "industrial_context": industrial_context,
        "osm_evidence_types": ", ".join(evidence_types)
    }


results = []

total_batches = math.ceil(len(df) / BATCH_SIZE)

for batch_number, start in enumerate(
    range(0, len(df), BATCH_SIZE),
    start=1
):

    batch = df.iloc[start:start + BATCH_SIZE]

    print()
    print(
        f"Batch {batch_number}/{total_batches} "
        f"({len(batch)} events)"
    )

    query = build_query(batch)

    try:

        response = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers=HEADERS,
            timeout=180
        )

        print(
            "HTTP status:",
            response.status_code
        )

        if response.status_code != 200:

            print(
                "Overpass request failed."
            )

            print(response.text[:300])

            continue

        data = response.json()

        elements = data.get("elements", [])

        print(
            f"OSM features returned: {len(elements)}"
        )

        for _, row in batch.iterrows():

            analysis = analyse_event(
                row["latitude"],
                row["longitude"],
                elements
            )

            analysis["event_id"] = row["event_id"]

            results.append(analysis)

        time.sleep(2)

    except Exception as e:

        print("Error:", e)


osm_df = pd.DataFrame(results)

final_df = df.merge(
    osm_df,
    on="event_id",
    how="left"
)

final_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("=" * 60)
print("OSM ENRICHMENT COMPLETE")
print("=" * 60)

print()
print(
    f"Events with OSM results: "
    f"{len(osm_df)}"
)

print()
print("Industrial context:")

print(
    final_df["industrial_context"]
    .fillna("Unknown")
    .value_counts()
)

print()
print("Sample:")

print(
    final_df[
        [
            "event_id",
            "latitude",
            "longitude",
            "temporal_pattern",
            "max_frp",
            "industrial_context",
            "nearest_feature_type",
            "nearest_feature_name",
            "nearest_feature_distance_km"
        ]
    ].head(20).to_string(index=False)
)

print()
print("Saved to:")
print(os.path.abspath(OUTPUT_FILE))

print()
print("=" * 60)