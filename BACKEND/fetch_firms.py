import os
import requests
import pandas as pd
from io import StringIO
from dotenv import load_dotenv

load_dotenv()

MAP_KEY = os.getenv("FIRMS_MAP_KEY")

SOURCE = "VIIRS_NOAA20_NRT"
START_DATE = "2026-09-24"
DAY_RANGE = 5

URL = (
    f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
    f"{MAP_KEY}/{SOURCE}/world/{DAY_RANGE}/{START_DATE}"
)

OUTPUT = "data/raw/firms_viirs_noaa20_5days.csv"

print("Connecting to NASA FIRMS...")
print(f"Downloading NOAA-20 data from {START_DATE} for {DAY_RANGE} days...")

response = requests.get(URL, timeout=120)

if response.status_code != 200:
    print("FIRMS request failed.")
    print("Status:", response.status_code)
    print(response.text[:500])
    raise SystemExit(1)

df = pd.read_csv(StringIO(response.text))

os.makedirs("data/raw", exist_ok=True)
df.to_csv(OUTPUT, index=False)

print()
print("FIRMS 5-day data downloaded successfully!")
print(f"Saved to: {os.path.abspath(OUTPUT)}")
print(f"Rows downloaded: {len(df):,}")
print()
print("Dates available:")
print(df["acq_date"].value_counts().sort_index())