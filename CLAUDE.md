# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeatherQuilt is a full-stack weather visualization application that displays historical weather data as colorful "quilts" - grid-based visualizations where each patch represents a day's weather. The application supports multiple US cities and visualizes both temperature and precipitation data.

## Architecture

### Backend (FastAPI + SQLite)
- **Framework**: FastAPI with Uvicorn server
- **Database**: SQLite (`server/db/weatherquilt.db`) managed by SQLAlchemy ORM
- **Data Source**: NOAA RCC-ACIS API for historical weather data
- **Structure**:
  - `server/main.py` - Main FastAPI application with all endpoints and NOAA data fetching logic
  - `server/db/models.py` - SQLAlchemy `WeatherByDay` model with city, station_id, date, temps, and precipitation
  - `server/db/schema.py` - Pydantic schemas for request/response validation
  - `server/db/crud.py` - Database operations (queries by day/range, city filtering)
  - `server/db/cities.py` - US state capitals configuration with coordinates and NOAA station IDs
  - `server/db/database.py` - SQLAlchemy session/engine setup

### Frontend (React)
- **Framework**: Create React App (react-scripts)
- **Routing**: React Router DOM
- **Styling**: CSS Modules for component-scoped styles
- **Structure**:
  - `client/src/App.js` - Main routing between WeatherQuilt and About pages
  - `client/src/components/WeatherQuilt/` - Main visualization component with year/month views, city selection, and dynamic/fixed temperature range modes
  - `client/src/components/Patch/` - Individual day patch component (displays as square with color-coded weather)
  - `client/src/components/Navigation/` - Site navigation
  - `client/src/components/About/` - About page

### Data Model
The `WeatherByDay` table stores:
- `city` - City name (e.g., "Anchorage, AK")
- `station_id` - NOAA weather station identifier
- `date` - Date (indexed)
- `minTemp` - Daily minimum temperature (°F)
- `maxTemp` - Daily maximum temperature (°F)
- `precipitation` - Daily precipitation (inches)

## Development Commands

### Running Locally (Development)

**Backend:**
```bash
cd server
# Activate virtual environment (if exists)
source weatherquiltEnv/bin/activate
# Install dependencies
pip install -r ../requirements.txt
# Run FastAPI server
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd client
npm install
npm start
# Runs on http://localhost:3000
```

**Tests:**
```bash
cd client
npm test
```

**Build:**
```bash
cd client
npm run build
```

### Running with Docker

**Development (multi-container):**
```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

**Production (with Nginx):**
```bash
docker-compose --profile production up --build
# Application: http://localhost:80
```

**Single container:**
```bash
docker build -t weatherquilt .
docker run -p 8000:8000 weatherquilt
```

**Stop services:**
```bash
docker-compose down
```

**Clean up (including volumes):**
```bash
docker-compose down -v
```

## Key API Endpoints

- `GET /weather/cities` - List available cities in database
- `GET /weather/month/{year}/{month}?city=...` - Weather data for specific month
- `GET /weather/year/{year}?city=...` - Weather data for entire year
- `GET /weather/day/{YYYY-MM-DD}` - Single day weather data
- `POST /weather/fetch-city?city=...&start_year=...` - Fetch/update data for a city from NOAA API
- `POST /weather/fetch-all-cities` - Fetch data for all US state capitals (long-running)
- `POST /weather/fetch-latest` - Update database with latest weather data
- `GET /weather/stations?state=...` - Query NOAA stations by state
- `GET /weather/find-stations` - Find stations for all configured cities

## Important Implementation Details

### Color Visualization Logic
The WeatherQuilt component (`client/src/components/WeatherQuilt/index.js`) contains sophisticated color mapping:
- **Temperature colors**: 18-stop gradient from deep blue (cold) to dark red (hot)
- **Precipitation colors**: White to deep blue scale based on inches
- **Range modes**: Fixed range (-20°F to 110°F) or dynamic range (min/max from current data)
- Color interpolation happens at 1-degree granularity for smooth gradients

### NOAA API Integration
The backend fetches weather data from `https://data.rcc-acis.org/StnData`:
- Uses station IDs to identify locations (configured in `server/db/cities.py`)
- Handles missing data (marked as 'M') and trace precipitation (marked as 'T')
- Auto-discovery of stations by coordinates via `find_station_for_city()`
- Data elements: maxt, mint, avgt, hdd, cdd, pcpn, snow, snwd

### Database Seeding
Use `POST /weather/fetch-city` to populate data for a specific city, or `POST /weather/fetch-all-cities` to seed all US state capitals. The app stores data from 2000-present by default.

## CORS Configuration
Backend allows requests from `http://localhost:3000` only. Update `server/main.py` CORS settings for production deployment.

## Known TODOs (from code comments)
- Set up automated data refresh on a cadence (consider lambdas or orchestration)
- Deployment strategy for production hosting
- File structure cleanup
- Highlight freezing temp windows with no precipitation (for ice skating)
- Page to sum precipitation by month overlaid by year
