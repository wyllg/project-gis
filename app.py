from flask import Flask, request, jsonify
import pickle
import pandas as pd
import requests  
from flask_cors import CORS
import pymysql
from datetime import datetime
import json
import requests
from geopy.distance import geodesic
import random 


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# OpenWeatherMap API Key
API_KEY = "73e7b15a19439a739559b0bf8a3aff43"

# Municipality encoding mapping
encoding = {
    "Agoncillo": 0, "Balete": 1, "Laurel": 2, "MataasNaKahoy": 3,
    "San Nicolas": 4, "Santa Teresita": 5, "Talisay": 6, "Tanauan": 7
}

# Load models at startup
models = {}
for i in range(8):
    try:
        with open(f"{i}.pkl", 'rb') as f:
            models[i] = pickle.load(f)
            print(f"✅ Model {i}.pkl loaded successfully!")
    except FileNotFoundError:
        print(f"❌ Error: Model file {i}.pkl not found.")
    except Exception as e:
        print(f"❌ Error loading model {i}: {str(e)}")

# Database connection
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "beefwellington",
    "database": "pagdaloy",
    "cursorclass": pymysql.cursors.DictCursor
}

def get_db_connection():
    try:
        return pymysql.connect(**DB_CONFIG)
    except pymysql.MySQLError as e:
        print(f"❌ MySQL Connection Error: {e}")
        return None

# Fetch wind data from OpenWeather API
def fetch_wind_data(municipality_name):
    lat_lon_map = {
        "San Nicolas": {"lat": 13.9165, "lon": 120.9328},
        "Agoncillo": {"lat": 13.9333, "lon": 120.9333},
        "Laurel": {"lat": 14.0500, "lon": 120.8833},
        "Tanauan": {"lat": 14.0833, "lon": 121.1500},
        "Mataasnakahoy": {"lat": 13.9667, "lon": 121.1000},
        "Balete": {"lat": 13.8833, "lon": 121.0333},
        "Talisay": {"lat": 14.0917, "lon": 120.9750},
        "Cuenca": {"lat": 13.9000, "lon": 121.0500},
        "SantaTeresita": {"lat": 13.8806, "lon": 120.9750}
    }
    
    location = lat_lon_map.get(municipality_name)
    if not location:
        return 0, 180  # Default values
    
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={location['lat']}&lon={location['lon']}&appid={API_KEY}&units=metric"
    
    try:
        response = requests.get(url)
        data = response.json()
        return data.get("wind", {}).get("speed", 0), data.get("wind", {}).get("deg", 180)
    except requests.RequestException:
        return 0, 180
    
def getTotalDisharge(tributaryName):
    # Load the GeoJSON file from the correct folder
    geojson_file = "geojson_files/Waterways_updated.geojson"

    with open(geojson_file, "r", encoding="utf-8") as file:
        geojson_data = json.load(file)
        # ✅ Extract tributary coordinates
    tributaries = {}
    coords = None
    for feature in geojson_data["features"]:
        name = feature["properties"].get("name", "Unknown")
        coordinates = feature["geometry"].get("coordinates", [])
        print(name, tributaryName)
        if name == tributaryName:
            coords = coordinates  # Store tributary coordinates

    # ✅ Step 3: Fetch piggeries data from piggeries.php
    piggeries_url = "http://localhost/project-gis/public/php/piggeries.php"  # Adjust URL if needed
    response = requests.get(piggeries_url)

    if response.status_code == 200:
        piggeries_data = response.json()
    else:
        print("❌ Error fetching piggeries data")
        exit()

    # ✅ Step 4: Filter piggeries (Sanitation = Free-flow, Distance < 40m)
    distance_threshold = 40  # Meters
    tributary_discharge = 0  # Store only total discharge

    for piggery in piggeries_data:
        if piggery["sanitation"] == "Free-flow" and float(piggery["discharge"]) > 0:
            piggery_location = (float(piggery["latitude"]), float(piggery["longitude"]))
            # for trib_name, trib_coords in tributaries.items():
            if coords == None:
                return 0.8
            
            for coord in coords:
                tributary_location = (coord[1], coord[0])  # Convert GeoJSON format
                distance = geodesic(piggery_location, tributary_location).meters
                if distance < distance_threshold:
                    tributary_discharge += float(piggery["discharge"])
                    break  # Stop checking once assigned
    
    # Convert result to list of tuples
    return tributary_discharge
    # return [(trib_name, discharge) for trib_name, discharge in tributary_discharge.items()]


# discharge_data = getTotalDisharge()

# for tributary, discharge in discharge_data:
#     print(f"Tributary: {tributary}, Total discharge: {round(discharge, 2)}kg")

@app.route('/api/forecast', methods=['GET', 'POST'])
def get_forecast():
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = connection.cursor()

        # Get tributary-municipality mapping
        cursor.execute("SELECT tributary, municipality_name FROM tributaries")
        mappings = cursor.fetchall()
        municipality_map = {entry["tributary"]: entry["municipality_name"] for entry in mappings}
        tributary_names = list(municipality_map.keys())
        
        # Get precipitation data
        cursor.execute("""
            SELECT tributary, SUM(volume) AS precip 
            FROM rain_g 
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 3 DAY) 
            GROUP BY tributary
        """)
        rain_data = cursor.fetchall()
        
        rain_df = pd.DataFrame(rain_data) if rain_data else pd.DataFrame(columns=["tributary", "precip"])
        if not rain_df.empty:
            rain_df.set_index("tributary", inplace=True)
    
    finally:
        cursor.close()
        connection.close()
    
    # Get user-defined forecast periods (default: 10)
    periods = request.args.get("periods", default=7, type=int)
    selectedTributary = request.args.get('tributary', default="", type=str)
    print(selectedTributary)
    
    forecast_results = []

    # for tributary_name in tributary_names:
    municipality_name = municipality_map.get(selectedTributary, "Unknown")
    windspeed, winddir = fetch_wind_data(municipality_name)

    # Pick a random fallback value if needed
    if selectedTributary in rain_df.index:
        precip = rain_df.loc[selectedTributary, "precip"]
    else:
        precip = random.uniform(0.036, 0.417)  # 👈 random fallback value between 0.036 and 0.417

    encoded_value = encoding.get(municipality_name, 0)
    model = models.get(encoded_value)
    
    # if model is None:
    #     continue

    tributaryDischarge = getTotalDisharge(selectedTributary)
    print("tributaryDischarge", tributaryDischarge)
    
    # Adjust the forecast periods dynamically based on user input
    future_df = pd.DataFrame({
        "ds": pd.date_range(start=datetime.now(), periods=periods, freq="D"),
        "wind_speed": windspeed,
        "wind_direction": winddir,
        "precip": precip,
        "effluentVolume": tributaryDischarge,
        "encoded_tributary": encoded_value
    })
    
    forecast = model.predict(future_df)
    
    forecast_results.append({
        "tributary": selectedTributary,
        "municipality_name": municipality_name,
        "wind_speed": float(windspeed),
        "wind_direction": float(winddir),
        "precip": float(precip),
        "effluentVolume": tributaryDischarge,
        "encoded_tributary": encoded_value,
        "forecastV": [
            {
                "date": pd.to_datetime(entry["ds"], errors="coerce").strftime("%Y-%m-%d"),
                "forecast": entry["yhat"]
            } for entry in forecast[["ds", "yhat"]].to_dict(orient="records")
        ]  
    })
    
    return jsonify({"forecasts": forecast_results})

if __name__ == "__main__":
    app.run(debug=True)
