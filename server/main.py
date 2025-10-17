'''

- On the first of every month, grab the data for the previous month.

POST: https://data.rcc-acis.org/StnData

Request body:
{"elems":[{"name":"maxt","add":"t"},{"name":"mint","add":"t"},{"name":"avgt","add":"t"},{"name":"avgt","normal":"departure91","add":"t"},{"name":"hdd","add":"t"},{"name":"cdd","add":"t"},{"name":"pcpn","add":"t"},{"name":"snow","add":"t"},{"name":"snwd","add":"t"}],"sid":"ANCthr 9","sDate":"2000-01-01","eDate":"2023-09-01"}

- Cache the data for practice? If not, just include the data files with the FE bundle.

- Handle fetches for locations that are not yet downloaded. We would need some mapping to NOAA's location representations.

- Upon server startup, compare the latest weather data date. If any missing data, calculate the missing range and make a request.

'''

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi_utils.tasks import repeat_every
from fastapi.staticfiles import StaticFiles

from db import crud, models, schema
from db.database import SessionLocal, engine
from db.cities import US_CAPITALS
from sqlalchemy.orm import Session
import datetime
import calendar
import httpx
import json
from sqlalchemy import func

app = FastAPI()

# Add CORS middleware to allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files from React build at root
app.mount("/static", StaticFiles(directory="static/static"), name="react-static")

# Serve React index.html for root and all non-API routes
@app.get("/")
async def serve_react_root():
    return FileResponse("static/index.html")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup():
    print("starting up app")

@app.get("/healthcheck")
async def root():
    return {"message": "Healthy!"}

@app.post("/weatherByDay")
async def weatherByDay(data: schema.WeatherByDayCreate):
    pass

# day format: YYYY-MM-DD
@app.get("/weather/day/{day}", response_model=schema.WeatherByDay)
def getWeatherByDay(day: str, db: Session = Depends(get_db)):
    day_obj = datetime.datetime.strptime(day, '%Y-%m-%d').date()
    print(day_obj)
    data = crud.getWeatherByDay(db, day_obj)
    if not data:
        raise HTTPException(status_code=400, detail="day doesn't exist")
    return data


@app.get("/weather/month/{year}/{month}")
def getMonth(year: int, month: int, city: str = Query(default="Anchorage, AK"), db: Session = Depends(get_db)):
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    
    # Get the first and last day of the month
    startDate = datetime.date(year, month, 1)
    lastDay = calendar.monthrange(year, month)[1]
    endDate = datetime.date(year, month, lastDay)
    
    # Fetch data for the month
    data = crud.getWeatherByDays(db, startDate, endDate, city=city)
    
    if not data:
        raise HTTPException(status_code=404, detail="No data found for this month")
    
    return data

@app.get("/weather/year/{year}")
def getYear(year: int, city: str = Query(default="Anchorage, AK"), db: Session = Depends(get_db)):
    # Get the first and last day of the year
    startDate = datetime.date(year, 1, 1)
    endDate = datetime.date(year, 12, 31)
    
    # Fetch data for the year
    data = crud.getWeatherByDays(db, startDate, endDate, city=city)
    
    if not data:
        raise HTTPException(status_code=404, detail="No data found for this year")
    
    return data

@app.get("/weather/cities")
def getCities(db: Session = Depends(get_db)):
    """
    Get list of available cities in the database
    """
    cities = crud.getAvailableCities(db)
    return {"cities": [city[0] for city in cities]}

async def fetch_noaa_data(start_date: str, end_date: str, station_id: str = "ANCthr 9"):
    """
    Fetch weather data from NOAA RCC-ACIS API
    start_date and end_date should be in format: YYYY-MM-DD
    station_id: NOAA station identifier
    """
    url = "https://data.rcc-acis.org/StnData"
    
    request_body = {
        "elems": [
            {"name": "maxt", "add": "t"},
            {"name": "mint", "add": "t"},
            {"name": "avgt", "add": "t"},
            {"name": "avgt", "normal": "departure91", "add": "t"},
            {"name": "hdd", "add": "t"},
            {"name": "cdd", "add": "t"},
            {"name": "pcpn", "add": "t"},
            {"name": "snow", "add": "t"},
            {"name": "snwd", "add": "t"}
        ],
        "sid": station_id,
        "sDate": start_date,
        "eDate": end_date
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=request_body)
        response.raise_for_status()
        return response.json()

async def find_station_for_city(lat: float, lon: float, city_name: str):
    """
    Find the best weather station for a given city by coordinates
    Returns the station ID
    """
    url = "https://data.rcc-acis.org/StnMeta"
    
    # Create a small bounding box around the city (roughly 0.5 degrees)
    bbox = f"{lon-0.5},{lat-0.5},{lon+0.5},{lat+0.5}"
    
    request_body = {
        "bbox": bbox,
        "elems": "pcpn,maxt,mint",
        "meta": "name,sids,ll,valid_daterange"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=request_body)
            response.raise_for_status()
            data = response.json()
            
            stations = data.get("meta", [])
            if not stations:
                print(f"No stations found for {city_name}")
                return None
            
            # Find the station with the longest date range and best data coverage
            best_station = None
            best_score = 0
            
            for station in stations:
                # Check if station has valid date range
                valid_range = station.get("valid_daterange", [])
                if not valid_range or len(valid_range) < 2:
                    continue
                
                # Parse date range
                try:
                    start_year = int(valid_range[0][0][:4])
                    end_year = int(valid_range[-1][1][:4]) if valid_range[-1][1] else 2024
                    years_of_data = end_year - start_year
                    
                    # Prefer stations with data starting before 2005 and still active
                    score = years_of_data
                    if start_year <= 2000:
                        score += 10
                    if end_year >= 2023:
                        score += 5
                    
                    if score > best_score:
                        best_score = score
                        best_station = station
                except:
                    continue
            
            if best_station and best_station.get("sids"):
                station_id = best_station["sids"][0]
                print(f"Found station for {city_name}: {station_id} ({best_station.get('name', 'Unknown')})")
                return station_id
            
            return None
    except Exception as e:
        print(f"Error finding station for {city_name}: {e}")
        return None

@app.post("/weather/fetch-latest")
async def fetch_latest_weather(db: Session = Depends(get_db)):
    """
    Fetch the latest weather data from NOAA and update the database
    Also appends new data to the noaa_anchorage.json file
    """
    try:
        # Get the latest date in the database
        latest_record = db.query(func.max(models.WeatherByDay.date)).scalar()
        
        if latest_record:
            # Start from the day after the latest record
            start_date = (latest_record + datetime.timedelta(days=1)).strftime('%Y-%m-%d')
        else:
            # If no data exists, start from 2000-01-01
            start_date = "2000-01-01"
        
        # Fetch up to today
        end_date = datetime.date.today().strftime('%Y-%m-%d')
        
        print(f"Fetching weather data from {start_date} to {end_date}")
        
        # Fetch data from NOAA
        data = await fetch_noaa_data(start_date, end_date)
        
        if "data" not in data:
            raise HTTPException(status_code=500, detail="Invalid response from NOAA API")
        
        weather_data = data["data"]
        records_added = 0
        records_skipped = 0
        
        # Process and store each day's data
        for day in weather_data:
            try:
                date = datetime.datetime.strptime(day[0], '%Y-%m-%d').date()
                max_temp = day[1][0]
                min_temp = day[2][0]
                precipitation = day[7][0]
                
                # Skip records with missing temperature data
                if max_temp == 'M' or min_temp == 'M':
                    print(f"Skipping day {day[0]}: missing temperature data")
                    records_skipped += 1
                    continue
                
                # Handle trace amounts and missing precipitation
                if precipitation == 'T':
                    precipitation = 0.01
                elif precipitation == 'M':
                    precipitation = 0.0
                
                # Create weather record
                weather_record = schema.WeatherByDayCreate(
                    date=date,
                    minTemp=min_temp,
                    maxTemp=max_temp,
                    precipitation=precipitation
                )
                
                crud.createWeatherByDay(db, data=weather_record)
                records_added += 1
            except Exception as e:
                print(f"Error processing day {day[0]}: {e}")
                records_skipped += 1
                continue
        
        # Update the JSON file by fetching all data
        if records_added > 0:
            try:
                # Fetch all data to update the JSON file
                all_data = await fetch_noaa_data("2000-01-01", end_date)
                json_path = "db/noaa_anchorage.json"
                json_data = {
                    "meta": all_data.get("meta", {
                        "state": "AK",
                        "sids": ["ANCthr 9"],
                        "uid": 32645,
                        "name": "Anchorage Area"
                    }),
                    "data": all_data["data"]
                }
                
                with open(json_path, 'w') as f:
                    json.dump(json_data, f)
                
                print(f"Updated {json_path} with latest data")
            except Exception as e:
                print(f"Error updating JSON file: {e}")
        
        return {
            "message": "Weather data fetched successfully",
            "start_date": start_date,
            "end_date": end_date,
            "records_added": records_added,
            "records_skipped": records_skipped
        }
        
    except Exception as e:
        print(f"Error fetching weather data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weather/fetch-all")
async def fetch_all_weather(db: Session = Depends(get_db)):
    """
    Fetch all available weather data from NOAA (2000-01-01 to today)
    This will fetch everything regardless of what's in the database
    Also updates the noaa_anchorage.json file
    """
    try:
        start_date = "2000-01-01"
        end_date = datetime.date.today().strftime('%Y-%m-%d')
        
        print(f"Fetching all weather data from {start_date} to {end_date}")
        
        # Fetch data from NOAA
        data = await fetch_noaa_data(start_date, end_date)
        
        if "data" not in data:
            raise HTTPException(status_code=500, detail="Invalid response from NOAA API")
        
        weather_data = data["data"]
        records_added = 0
        records_updated = 0
        records_skipped = 0
        
        # Process and store each day's data
        for day in weather_data:
            try:
                date = datetime.datetime.strptime(day[0], '%Y-%m-%d').date()
                max_temp = day[1][0]
                min_temp = day[2][0]
                precipitation = day[7][0]
                
                # Skip records with missing temperature data
                if max_temp == 'M' or min_temp == 'M':
                    print(f"Skipping day {day[0]}: missing temperature data")
                    records_skipped += 1
                    continue
                
                # Handle trace amounts and missing precipitation
                if precipitation == 'T':
                    precipitation = 0.01
                elif precipitation == 'M':
                    precipitation = 0.0
                
                # Check if record already exists
                existing_record = crud.getWeatherByDay(db, date)
                
                if existing_record:
                    # Update existing record
                    existing_record.minTemp = min_temp
                    existing_record.maxTemp = max_temp
                    existing_record.precipitation = precipitation
                    db.commit()
                    records_updated += 1
                else:
                    # Create new weather record
                    weather_record = schema.WeatherByDayCreate(
                        date=date,
                        minTemp=min_temp,
                        maxTemp=max_temp,
                        precipitation=precipitation
                    )
                    crud.createWeatherByDay(db, data=weather_record)
                    records_added += 1
                    
            except Exception as e:
                print(f"Error processing day {day[0]}: {e}")
                records_skipped += 1
                continue
        
        # Update the JSON file
        try:
            json_path = "db/noaa_anchorage.json"
            json_data = {
                "meta": data.get("meta", {
                    "state": "AK",
                    "sids": ["ANCthr 9"],
                    "uid": 32645,
                    "name": "Anchorage Area"
                }),
                "data": weather_data
            }
            
            with open(json_path, 'w') as f:
                json.dump(json_data, f)
            
            print(f"Updated {json_path} with latest data")
        except Exception as e:
            print(f"Error updating JSON file: {e}")
        
        return {
            "message": "All weather data fetched successfully",
            "start_date": start_date,
            "end_date": end_date,
            "records_added": records_added,
            "records_updated": records_updated,
            "records_skipped": records_skipped,
            "total_processed": records_added + records_updated
        }
        
    except Exception as e:
        print(f"Error fetching weather data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weather/stations")
async def get_stations(state: str = "AK", bbox: str = None):
    """
    Query available weather stations from NOAA RCC-ACIS
    state: Two-letter state code (default: AK for Alaska)
    bbox: Bounding box coordinates in format "west,south,east,north"
    """
    try:
        url = "https://data.rcc-acis.org/StnMeta"
        
        request_body = {
            "elems": "pcpn,maxt,mint"
        }
        
        if bbox:
            # Format: "west,south,east,north"
            request_body["bbox"] = bbox
        else:
            # Use state filter
            request_body["state"] = state
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=request_body)
            response.raise_for_status()
            data = response.json()
            
            # Format the response for easier reading
            stations = []
            for station in data.get("meta", []):
                stations.append({
                    "name": station.get("name"),
                    "sids": station.get("sids", []),
                    "state": station.get("state"),
                    "ll": station.get("ll"),  # latitude, longitude
                    "elev": station.get("elev"),  # elevation
                    "uid": station.get("uid"),
                    "valid_daterange": station.get("valid_daterange", [])
                })
            
            return {
                "count": len(stations),
                "stations": stations
            }
            
    except Exception as e:
        print(f"Error fetching stations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weather/find-stations")
async def find_all_stations():
    """
    Find weather stations for all US state capitals
    This will update the US_CAPITALS dictionary with station IDs
    """
    from db import cities
    import importlib
    
    results = {}
    
    for city_name, city_data in US_CAPITALS.items():
        if city_data["station_id"]:
            results[city_name] = {
                "status": "already_has_station",
                "station_id": city_data["station_id"]
            }
            continue
        
        station_id = await find_station_for_city(
            city_data["lat"],
            city_data["lon"],
            city_name
        )
        
        if station_id:
            results[city_name] = {
                "status": "found",
                "station_id": station_id
            }
        else:
            results[city_name] = {
                "status": "not_found",
                "station_id": None
            }
    
    return results

@app.post("/weather/fetch-city")
async def fetch_city_weather(
    city: str = Query(..., description="City name (e.g., 'Atlanta, GA')"),
    start_year: int = Query(default=2000),
    db: Session = Depends(get_db)
):
    """
    Fetch weather data for a specific city from start_year to today
    """
    try:
        # Check if city is in our capitals list
        if city not in US_CAPITALS:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found in capitals list")
        
        city_info = US_CAPITALS[city]
        
        # If no station ID, try to find one
        if not city_info["station_id"]:
            print(f"Finding station for {city}...")
            station_id = await find_station_for_city(
                city_info["lat"],
                city_info["lon"],
                city
            )
            if not station_id:
                raise HTTPException(status_code=404, detail=f"No weather station found for {city}")
        else:
            station_id = city_info["station_id"]
        
        # Fetch data
        start_date = f"{start_year}-01-01"
        end_date = datetime.date.today().strftime('%Y-%m-%d')
        
        print(f"Fetching weather data for {city} from {start_date} to {end_date}")
        
        data = await fetch_noaa_data(start_date, end_date, station_id)
        
        if "data" not in data:
            raise HTTPException(status_code=500, detail="Invalid response from NOAA API")
        
        weather_data = data["data"]
        records_added = 0
        records_updated = 0
        records_skipped = 0
        
        # Process and store each day's data
        for day in weather_data:
            try:
                date = datetime.datetime.strptime(day[0], '%Y-%m-%d').date()
                max_temp = day[1][0]
                min_temp = day[2][0]
                precipitation = day[7][0]
                
                # Skip records with missing temperature data
                if max_temp == 'M' or min_temp == 'M':
                    records_skipped += 1
                    continue
                
                # Handle trace amounts and missing precipitation
                if precipitation == 'T':
                    precipitation = 0.01
                elif precipitation == 'M':
                    precipitation = 0.0
                
                # Check if record already exists
                existing_record = crud.getWeatherByDay(db, date, city=city)
                
                if existing_record:
                    # Update existing record
                    existing_record.station_id = station_id
                    existing_record.minTemp = min_temp
                    existing_record.maxTemp = max_temp
                    existing_record.precipitation = precipitation
                    db.commit()
                    records_updated += 1
                else:
                    # Create new weather record
                    weather_record = schema.WeatherByDayCreate(
                        city=city,
                        station_id=station_id,
                        date=date,
                        minTemp=min_temp,
                        maxTemp=max_temp,
                        precipitation=precipitation
                    )
                    crud.createWeatherByDay(db, data=weather_record)
                    records_added += 1
                    
            except Exception as e:
                print(f"Error processing day {day[0]} for {city}: {e}")
                records_skipped += 1
                continue
        
        return {
            "message": f"Weather data fetched successfully for {city}",
            "city": city,
            "station_id": station_id,
            "start_date": start_date,
            "end_date": end_date,
            "records_added": records_added,
            "records_updated": records_updated,
            "records_skipped": records_skipped
        }
        
    except Exception as e:
        print(f"Error fetching weather data for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/weather/fetch-all-cities")
async def fetch_all_cities_weather(
    start_year: int = Query(default=2000),
    db: Session = Depends(get_db)
):
    """
    Fetch weather data for all US state capitals from start_year to present
    Warning: This will take a long time!
    """
    results = {}
    
    for city_name in US_CAPITALS.keys():
        try:
            result = await fetch_city_weather(city=city_name, start_year=start_year, db=db)
            results[city_name] = {
                "status": "success",
                "records_added": result["records_added"],
                "records_updated": result["records_updated"],
                "station_id": result["station_id"]
            }
        except Exception as e:
            results[city_name] = {
                "status": "error",
                "error": str(e)
            }
    
    return results

@app.on_event("startup")
@repeat_every(seconds=60)
def fetchWeatherData() -> None:
    print("fetching weather data")

# TODO: set up db and use sqlalchemy as orm
# figure out how to store the weather data in sql (model)
# import the files into the sql db

# have a page that sums up all the precipitation in a month and overlay by year